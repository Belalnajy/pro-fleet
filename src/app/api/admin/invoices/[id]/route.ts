import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/admin/invoices/[id] - Get specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: {
        id
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
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
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
      customsBroker: '', // Regular invoices don't have customs broker
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFee: 0, // Regular invoices don't have customs fee
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate?.toISOString() || '',
      paidDate: invoice.paidDate?.toISOString() || null,
      // New payment tracking fields
      amountPaid: invoice.amountPaid || 0,
      remainingAmount: invoice.remainingAmount !== null ? invoice.remainingAmount : (invoice.total - (invoice.amountPaid || 0)),
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
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/invoices/[id] - Update invoice status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const updateData: any = { paymentStatus: status }
    
    // Set paid date if status is PAID
    if (status === 'PAID') {
      updateData.paidDate = new Date()
    } else if (status !== 'PAID') {
      updateData.paidDate = null
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        trip: {
          include: {
            customer: true
          }
        }
      }
    })

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.paymentStatus,
      paidDate: invoice.paidDate?.toISOString() || null,
      updatedAt: invoice.updatedAt.toISOString()
    })
  } catch (error) {
    console.error("Error updating invoice status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/invoices/[id] - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    // Check if invoice can be deleted (only if not paid)
    const invoice = await db.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: "Cannot delete paid invoice" }, 
        { status: 400 }
      )
    }

    await db.invoice.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
