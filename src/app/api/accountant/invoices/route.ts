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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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

    // Get invoices with pagination
    const invoices = await db.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        trip: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true }
            },
            fromCity: { select: { name: true, nameAr: true } },
            toCity: { select: { name: true, nameAr: true } },
            driver: {
              include: {
                user: { select: { name: true } }
              }
            },
            vehicle: {
              include: {
                vehicleType: { select: { name: true, nameAr: true } }
              }
            }
          }
        },
        customsBroker: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    })
    const totalCount = await db.invoice.count({ where })

    // Format invoices for frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tripNumber: invoice.trip?.tripNumber || 'N/A',
      customer: {
        id: invoice.trip?.customer?.id,
        name: invoice.trip?.customer?.name || 'Unknown Customer',
        email: invoice.trip?.customer?.email,
        phone: invoice.trip?.customer?.phone
      },
      route: {
        from: invoice.trip?.fromCity?.nameAr || invoice.trip?.fromCity?.name || 'N/A',
        to: invoice.trip?.toCity?.nameAr || invoice.trip?.toCity?.name || 'N/A'
      },
      driver: invoice.trip?.driver?.user?.name || 'N/A',
      vehicle: {
        type: invoice.trip?.vehicle?.vehicleType?.nameAr || invoice.trip?.vehicle?.vehicleType?.name || 'N/A',
        capacity: invoice.trip?.vehicle?.capacity || 0
      },
      customsBroker: invoice.customsBroker?.user?.name || 'N/A',
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFee: invoice.customsFee,
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      invoices: formattedInvoices,
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
    console.error('Error fetching accountant invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
