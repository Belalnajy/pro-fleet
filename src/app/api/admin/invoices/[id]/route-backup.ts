import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/admin/invoices/[id] - Get specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: params.id },
      include: {
        trip: {
          include: {
            customer: true, // customer is User directly
            fromCity: true,
            toCity: true,
            driver: {
              include: {
                user: true
              }
            },
            vehicle: {
              include: {
                vehicleType: true
              }
            }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.trip?.customer?.id || '',
      customerName: invoice.trip?.customer?.user?.name || 'Unknown Customer',
      tripId: invoice.tripId,
      tripNumber: invoice.trip?.tripNumber || null,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFees: invoice.customsFee,
      totalAmount: invoice.total,
      status: invoice.paymentStatus,
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      currency: invoice.currency,
      notes: invoice.notes,
      trip: invoice.trip
    })
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/admin/invoices/[id] - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { subtotal, taxAmount, customsFees, dueDate, notes, status } = body

    // Calculate total if amounts are provided
    let updateData: any = {}
    
    if (subtotal !== undefined) updateData.subtotal = subtotal
    if (taxAmount !== undefined) updateData.taxAmount = taxAmount
    if (customsFees !== undefined) updateData.customsFee = customsFees
    if (dueDate) updateData.dueDate = new Date(dueDate)
    if (notes !== undefined) updateData.notes = notes
    if (status) updateData.paymentStatus = status

    // Calculate total if any amount fields are updated
    if (subtotal !== undefined || taxAmount !== undefined || customsFees !== undefined) {
      const currentInvoice = await db.invoice.findUnique({
        where: { id: params.id }
      })
      
      if (!currentInvoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      }

      updateData.total = (subtotal || currentInvoice.subtotal) + 
                        (taxAmount || currentInvoice.taxAmount) + 
                        (customsFees || currentInvoice.customsFee)
    }

    // Set paid date if status is changed to PAID
    if (status === 'PAID') {
      updateData.paidDate = new Date()
    } else if (status && status !== 'PAID') {
      updateData.paidDate = null
    }

    const invoice = await db.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        trip: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.trip?.customer?.id || '',
      customerName: invoice.trip?.customer?.user?.name || 'Unknown Customer',
      tripId: invoice.tripId,
      tripNumber: invoice.trip?.tripNumber || null,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFees: invoice.customsFee,
      totalAmount: invoice.total,
      status: invoice.paymentStatus,
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString()
    })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/invoices/[id] - Update invoice status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      where: { id: params.id },
      data: updateData,
      include: {
        trip: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if invoice exists
    const invoice = await db.invoice.findUnique({
      where: { id: params.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Don't allow deletion of paid invoices
    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json({ error: "Cannot delete paid invoices" }, { status: 400 })
    }

    await db.invoice.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
