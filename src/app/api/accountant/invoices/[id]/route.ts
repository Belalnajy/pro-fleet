import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await db.invoice.findUnique({
      where: {
        id: params.id
      },
      include: {
        trip: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            driver: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    phone: true,
                    email: true
                  }
                }
              }
            },
            vehicle: {
              include: {
                vehicleType: true
              }
            },
            fromCity: true,
            toCity: true,
            temperature: true
          }
        },
        customsBroker: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Format the response to match the frontend interface
    const formattedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tripNumber: invoice.trip?.tripNumber || '',
      customer: {
        id: invoice.trip?.customer?.id || '',
        name: invoice.trip?.customer?.name || '',
        email: invoice.trip?.customer?.email || '',
        phone: invoice.trip?.customer?.phone || ''
      },
      route: {
        from: invoice.trip?.fromCity?.name || '',
        to: invoice.trip?.toCity?.name || ''
      },
      driver: invoice.trip?.driver?.user?.name || '',
      vehicle: {
        type: invoice.trip?.vehicle?.vehicleType?.name || '',
        capacity: invoice.trip?.vehicle?.capacity || 0
      },
      customsBroker: invoice.customsBroker?.user?.name || '',
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFee: invoice.customsFee,
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate?.toISOString() || '',
      paidDate: invoice.paidDate?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
      // Additional details for the details page
      trip: {
        tripNumber: invoice.trip?.tripNumber,
        scheduledDate: invoice.trip?.scheduledDate?.toISOString(),
        actualStartDate: invoice.trip?.actualStartDate?.toISOString(),
        deliveredDate: invoice.trip?.deliveredDate?.toISOString(),
        status: invoice.trip?.status,
        price: invoice.trip?.price,
        notes: invoice.trip?.notes,
        temperature: {
          option: invoice.trip?.temperature?.option,
          value: invoice.trip?.temperature?.value,
          unit: invoice.trip?.temperature?.unit
        },
        vehicle: {
          capacity: invoice.trip?.vehicle?.capacity,
          description: invoice.trip?.vehicle?.description,
          vehicleType: {
            name: invoice.trip?.vehicle?.vehicleType?.name,
            nameAr: invoice.trip?.vehicle?.vehicleType?.nameAr
          }
        },
        driver: {
          name: invoice.trip?.driver?.user?.name,
          phone: invoice.trip?.driver?.user?.phone,
          email: invoice.trip?.driver?.user?.email
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        id: params.id
      },
      data: {
        subtotal: subtotal ? parseFloat(subtotal) : undefined,
        taxAmount: taxAmount ? parseFloat(taxAmount) : undefined,
        customsFee: customsFee ? parseFloat(customsFee) : undefined,
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if invoice can be deleted (only if not paid)
    const invoice = await db.invoice.findUnique({
      where: { id: params.id }
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
      where: { id: params.id }
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
