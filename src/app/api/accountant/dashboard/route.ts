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

    // Get current date for filtering
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Get invoice statistics
    const [
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      cancelledInvoices,
      totalRevenue,
      monthlyRevenue,
      recentInvoices,
      recentTransactions
    ] = await Promise.all([
      // Total invoices count
      db.invoice.count(),
      
      // Pending invoices count
      db.invoice.count({
        where: { paymentStatus: 'PENDING' }
      }),
      
      // Paid invoices count
      db.invoice.count({
        where: { paymentStatus: 'PAID' }
      }),
      
      // Overdue invoices count
      db.invoice.count({
        where: {
          paymentStatus: { in: ['PENDING', 'SENT'] },
          dueDate: { lt: now }
        }
      }),
      
      // Cancelled invoices count
      db.invoice.count({
        where: { paymentStatus: 'CANCELLED' }
      }),
      
      // Total revenue (all paid invoices)
      db.invoice.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { total: true }
      }),
      
      // Monthly revenue (current month)
      db.invoice.aggregate({
        where: {
          paymentStatus: 'PAID',
          paidDate: { gte: startOfMonth }
        },
        _sum: { total: true }
      }),
      
      // Recent invoices (last 10)
      db.invoice.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          trip: {
            include: {
              customer: {
                select: { name: true, email: true }
              }
            }
          }
        }
      }),
      
      // Recent transactions (simulate from invoices)
      db.invoice.findMany({
        take: 10,
        where: { paymentStatus: 'PAID' },
        orderBy: { paidDate: 'desc' },
        include: {
          trip: {
            include: {
              customer: {
                select: { name: true }
              }
            }
          }
        }
      })
    ])

    // Calculate financial metrics
    const totalRevenueAmount = totalRevenue._sum?.total || 0
    const monthlyRevenueAmount = monthlyRevenue._sum?.total || 0
    
    // Estimate expenses (30% of revenue for demo)
    const totalExpenses = totalRevenueAmount * 0.3
    const netProfit = totalRevenueAmount - totalExpenses

    // Format recent invoices
    const formattedInvoices = recentInvoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.trip?.customer?.name || 'Unknown Customer',
      amount: invoice.total,
      status: invoice.paymentStatus.toLowerCase(),
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      paidDate: invoice.paidDate?.toISOString().split('T')[0] || null,
      tripId: invoice.trip?.tripNumber || 'N/A',
      createdAt: invoice.createdAt
    }))

    // Format recent transactions
    const formattedTransactions = recentTransactions.map(invoice => ({
      id: `TXN-${invoice.id}`,
      type: 'payment',
      description: `Payment for ${invoice.invoiceNumber}`,
      amount: invoice.total,
      date: invoice.paidDate?.toISOString().split('T')[0] || '',
      status: 'completed',
      invoiceId: invoice.invoiceNumber,
      customer: invoice.trip?.customer?.name || 'Unknown Customer'
    }))

    // Dashboard statistics
    const dashboardStats = {
      totalRevenue: totalRevenueAmount,
      monthlyRevenue: monthlyRevenueAmount,
      totalExpenses: totalExpenses,
      netProfit: netProfit,
      totalInvoices: totalInvoices,
      pendingInvoices: pendingInvoices,
      paidInvoices: paidInvoices,
      overdueInvoices: overdueInvoices,
      cancelledInvoices: cancelledInvoices,
      totalTransactions: recentTransactions.length
    }

    return NextResponse.json({
      stats: dashboardStats,
      recentInvoices: formattedInvoices,
      recentTransactions: formattedTransactions
    })

  } catch (error) {
    console.error('Error fetching accountant dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
