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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.paymentStatus = status.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { trip: { tripNumber: { contains: search, mode: 'insensitive' } } },
        { trip: { customer: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    }

    if (dateFrom || dateTo) {
      where.paidDate = {}
      if (dateFrom) where.paidDate.gte = new Date(dateFrom)
      if (dateTo) where.paidDate.lte = new Date(dateTo)
    }

    // Get payments (paid invoices) with pagination
    const [payments, totalCount] = await Promise.all([
      db.invoice.findMany({
        where: {
          ...where,
          paymentStatus: 'PAID'
        },
        skip,
        take: limit,
        orderBy: { paidDate: 'desc' },
        include: {
          trip: {
            include: {
              customer: {
                select: { id: true, name: true, email: true, phone: true }
              },
              fromCity: { select: { name: true, nameAr: true } },
              toCity: { select: { name: true, nameAr: true } }
            }
          }
        }
      }),
      db.invoice.count({ 
        where: {
          ...where,
          paymentStatus: 'PAID'
        }
      })
    ])

    // Format payments for frontend
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      invoiceNumber: payment.invoiceNumber,
      tripNumber: payment.trip?.tripNumber || 'N/A',
      customer: {
        id: payment.trip?.customer?.id,
        name: payment.trip?.customer?.name || 'Unknown Customer',
        email: payment.trip?.customer?.email,
        phone: payment.trip?.customer?.phone
      },
      route: {
        from: payment.trip?.fromCity?.nameAr || payment.trip?.fromCity?.name || 'N/A',
        to: payment.trip?.toCity?.nameAr || payment.trip?.toCity?.name || 'N/A'
      },
      amount: payment.total,
      paymentDate: payment.paidDate,
      paymentMethod: getRandomPaymentMethod(), // Simulate payment method
      referenceNumber: `REF-${payment.invoiceNumber}-${Date.now()}`,
      status: 'completed',
      createdAt: payment.createdAt
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for recording new payments
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, amount, paymentMethod, referenceNumber, notes } = body

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        trip: {
          include: {
            customer: { select: { name: true, email: true } }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      )
    }

    // Update invoice to paid status
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: 'PAID',
        paidDate: new Date(),
        // Note: In a real system, you'd store payment details in a separate Payment table
      }
    })

    return NextResponse.json({
      message: 'Payment recorded successfully',
      invoice: updatedInvoice,
      paymentDetails: {
        amount,
        paymentMethod,
        referenceNumber,
        notes,
        recordedBy: session.user.name,
        recordedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to simulate payment methods
function getRandomPaymentMethod(): string {
  const methods = ['تحويل بنكي', 'نقدي', 'شيك', 'بطاقة ائتمان']
  return methods[Math.floor(Math.random() * methods.length)]
}
