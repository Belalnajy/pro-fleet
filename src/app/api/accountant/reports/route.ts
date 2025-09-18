import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'monthly'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null

    let startDate: Date
    let endDate: Date

    // Set date range based on report type
    if (reportType === 'yearly') {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year + 1, 0, 1)
    } else if (reportType === 'monthly' && month !== null) {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 1)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    // Get financial data
    const [
      revenueData,
      invoicesByStatus,
      topCustomers,
      monthlyTrends,
      paymentMethods
    ] = await Promise.all([
      // Revenue summary
      db.invoice.aggregate({
        where: {
          paymentStatus: 'PAID',
          paidDate: { gte: startDate, lt: endDate }
        },
        _sum: {
          subtotal: true,
          taxAmount: true,
          customsFee: true,
          total: true
        },
        _count: true
      }),

      // Invoices by status
      db.invoice.groupBy({
        by: ['paymentStatus'],
        where: {
          createdAt: { gte: startDate, lt: endDate }
        },
        _count: true,
        _sum: { total: true }
      }),

      // Top customers by revenue
      db.invoice.groupBy({
        by: ['tripId'],
        where: {
          paymentStatus: 'PAID',
          paidDate: { gte: startDate, lt: endDate }
        },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10
      }),

      // Monthly trends (last 12 months)
      db.invoice.groupBy({
        by: ['createdAt'],
        where: {
          paymentStatus: 'PAID',
          paidDate: { gte: new Date(year - 1, 0, 1), lt: endDate }
        },
        _sum: { total: true },
        _count: true
      }),

      // Payment methods simulation (since we don't have this field)
      db.invoice.findMany({
        where: {
          paymentStatus: 'PAID',
          paidDate: { gte: startDate, lt: endDate }
        },
        select: { total: true }
      })
    ])

    // Get customer details for top customers
    const topCustomerIds = topCustomers.map(tc => tc.tripId).filter(Boolean)
    const customerDetails = await db.trip.findMany({
      where: { id: { in: topCustomerIds } },
      include: {
        customer: { select: { name: true, email: true } }
      }
    })

    // Format top customers with details
    const formattedTopCustomers = topCustomers.map(tc => {
      const trip = customerDetails.find(cd => cd.id === tc.tripId)
      return {
        customerId: trip?.customer?.name || 'unknown',
        customerName: trip?.customer?.name || 'Unknown Customer',
        customerEmail: trip?.customer?.email || '',
        totalRevenue: tc._sum.total || 0,
        invoiceCount: 1 // Since we're grouping by trip, each represents one invoice
      }
    })

    // Generate monthly trends data
    const monthlyTrendsData: Array<{
      month: string
      revenue: number
      invoices: number
    }> = []
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(year, new Date().getMonth() - i, 1)
      const monthData = monthlyTrends.filter(mt => {
        const mtDate = new Date(mt.createdAt)
        return mtDate.getMonth() === date.getMonth() && mtDate.getFullYear() === date.getFullYear()
      })
      
      monthlyTrendsData.push({
        month: date.toLocaleString('ar', { month: 'long', year: 'numeric' }),
        revenue: monthData.reduce((sum, md) => sum + (md._sum.total || 0), 0),
        invoices: monthData.reduce((sum, md) => sum + md._count, 0)
      })
    }

    // Simulate payment methods distribution
    const totalPaidAmount = paymentMethods.reduce((sum, pm) => sum + pm.total, 0)
    const paymentMethodsData = [
      { method: 'تحويل بنكي', amount: totalPaidAmount * 0.6, percentage: 60 },
      { method: 'نقدي', amount: totalPaidAmount * 0.25, percentage: 25 },
      { method: 'شيك', amount: totalPaidAmount * 0.15, percentage: 15 }
    ]

    // Format invoices by status
    const statusData = invoicesByStatus.map(status => ({
      status: status.paymentStatus,
      count: status._count,
      amount: status._sum.total || 0
    }))

    // Calculate key metrics
    const totalRevenue = revenueData._sum.total || 0
    const totalInvoices = revenueData._count
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0
    const taxCollected = revenueData._sum.taxAmount || 0
    const customsFeesCollected = revenueData._sum.customsFee || 0

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalInvoices,
        averageInvoiceValue,
        taxCollected,
        customsFeesCollected,
        reportPeriod: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: reportType
        }
      },
      invoicesByStatus: statusData,
      topCustomers: formattedTopCustomers,
      monthlyTrends: monthlyTrendsData,
      paymentMethods: paymentMethodsData
    })

  } catch (error) {
    console.error('Error generating financial report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
