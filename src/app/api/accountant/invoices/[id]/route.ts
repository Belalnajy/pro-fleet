import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            customer: true,
            driver: {
              include: {
                user: true
              }
            },
            vehicle: {
              include: {
                vehicleType: true
              }
            },
            fromCity: true,
            toCity: true,
            temperature: true,
            customsBroker: {
              include: {
                user: true
              }
            }
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    }) as any

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Format the response to match the frontend interface
    const formattedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tripNumber: invoice.trip?.tripNumber || 'N/A',
      customer: {
        id: invoice.trip?.customer?.id || '',
        name: invoice.trip?.customer?.name || 'Unknown Customer',
        email: invoice.trip?.customer?.email || '',
        phone: invoice.trip?.customer?.phone || ''
      },
      route: {
        from: invoice.trip?.fromCity?.nameAr || invoice.trip?.fromCity?.name || 'N/A',
        to: invoice.trip?.toCity?.nameAr || invoice.trip?.toCity?.name || 'N/A'
      },
      driver: invoice.trip?.driver?.user?.name || 'N/A',
      vehicle: {
        type: invoice.trip?.vehicle?.vehicleType?.nameAr || invoice.trip?.vehicle?.vehicleType?.name || 'N/A',
        capacity: invoice.trip?.vehicle?.vehicleType?.capacity || 0,
        vehicleNumber: invoice.trip?.vehicle?.vehicleNumber || 'N/A'
      },
      customsBroker: invoice.trip?.customsBroker?.user?.name || 'N/A',
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFee: 0, // Regular invoices don't have customs fees
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate?.toISOString() || '',
      paidDate: invoice.paidDate?.toISOString() || null,
      // New payment tracking fields
      amountPaid: invoice.amountPaid || 0,
      remainingAmount: invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0)),
      installmentCount: invoice.installmentCount,
      installmentsPaid: invoice.installmentsPaid || 0,
      installmentAmount: invoice.installmentAmount,
      nextInstallmentDate: invoice.nextInstallmentDate?.toISOString(),
      payments: invoice.payments || [],
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      notes: invoice.notes,
      // Additional details for the details page
      trip: {
        tripNumber: invoice.trip?.tripNumber || 'N/A',
        scheduledDate: invoice.trip?.scheduledDate?.toISOString() || null,
        actualStartDate: invoice.trip?.actualStartDate?.toISOString() || null,
        deliveredDate: invoice.trip?.deliveredDate?.toISOString() || null,
        status: invoice.trip?.status || 'PENDING',
        price: invoice.trip?.price || 0,
        notes: invoice.trip?.notes || '',
        temperature: {
          option: invoice.trip?.temperature?.option || 'STANDARD',
          value: invoice.trip?.temperature?.value || null,
          unit: invoice.trip?.temperature?.unit || 'C'
        },
        vehicle: {
          vehicleNumber: invoice.trip?.vehicle?.vehicleNumber || 'N/A',
          capacity: invoice.trip?.vehicle?.vehicleType?.capacity || 0,
          description: invoice.trip?.vehicle?.vehicleType?.description || 'N/A',
          vehicleType: {
            name: invoice.trip?.vehicle?.vehicleType?.name || 'N/A',
            nameAr: invoice.trip?.vehicle?.vehicleType?.nameAr || 'غير محدد'
          }
        },
        driver: {
          name: invoice.trip?.driver?.user?.name || 'N/A',
          phone: invoice.trip?.driver?.user?.phone || 'N/A',
          email: invoice.trip?.driver?.user?.email || 'N/A'
        }
      }
    }

    return NextResponse.json(formattedInvoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      subtotal, 
      taxAmount, 
      customsFee, 
      total, 
      paymentStatus, 
      dueDate,
      notes 
    } = body

    const updatedInvoice = await db.invoice.update({
      where: {
        id
      },
      data: {
        subtotal: subtotal ? parseFloat(subtotal) : undefined,
        taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
        // customsFee: customsFee ? parseFloat(customsFee) : undefined, // Not available in regular invoices
        total: total ? parseFloat(total) : undefined,
        paymentStatus: paymentStatus || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        paidDate: paymentStatus === 'PAID' ? new Date() : undefined,
        notes: notes || undefined
      },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        }
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Check if invoice can be deleted (only if not paid)
    const invoice = await db.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot delete paid invoice' }, 
        { status: 400 }
      )
    }

    await db.invoice.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
