import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/customs-broker/clearance-invoices/[id] - Get customs clearance invoice details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    // Get the invoice with all related data
    const invoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id,
        customsBrokerId: customsBroker.id
      },
      include: {
        clearance: {
          select: {
            clearanceNumber: true,
            status: true,
            notes: true,
            customsFee: true,
            additionalFees: true,
            totalFees: true,
            customsFeeType: true,
            customsFeePercentage: true,
            additionalFeesType: true,
            additionalFeesPercentage: true
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

    // Use fees from clearance (new system) or fallback to invoice (old system)
    const customsFee = invoice.clearance?.customsFee || invoice.customsFee || 0
    const additionalFees = invoice.clearance?.additionalFees || invoice.additionalFees || 0

    // Transform data to match frontend interface
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clearanceId: invoice.clearanceId,
      customsBrokerId: invoice.customsBrokerId,
      customsFee: customsFee,
      additionalFees: additionalFees,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString(),
      // Payment tracking fields
      amountPaid: invoice.amountPaid || 0,
      remainingAmount: invoice.remainingAmount !== null ? invoice.remainingAmount : (invoice.total - (invoice.amountPaid || 0)),
      installmentCount: invoice.installmentCount,
      installmentsPaid: invoice.installmentsPaid,
      installmentAmount: invoice.installmentAmount,
      nextInstallmentDate: invoice.nextInstallmentDate?.toISOString(),
      payments: invoice.payments,
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      clearance: {
        ...invoice.clearance,
        // Include fee calculation details for display
        customsFeeType: invoice.clearance?.customsFeeType || 'FIXED',
        customsFeePercentage: invoice.clearance?.customsFeePercentage || 0,
        additionalFeesType: invoice.clearance?.additionalFeesType || 'FIXED',
        additionalFeesPercentage: invoice.clearance?.additionalFeesPercentage || 0
      }
    }

    return NextResponse.json(transformedInvoice)
  } catch (error) {
    console.error("Error fetching customs clearance invoice details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/customs-broker/clearance-invoices/[id] - Update customs clearance invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { paymentStatus, amountPaid, remainingAmount, installmentCount, installmentsPaid, installmentAmount, nextInstallmentDate, notes } = body

    // Verify the invoice belongs to this broker
    const existingInvoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id,
        customsBrokerId: customsBroker.id
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Update the invoice
    const updatedInvoice = await db.customsClearanceInvoice.update({
      where: { id },
      data: {
        ...(paymentStatus && { paymentStatus }),
        ...(amountPaid !== undefined && { amountPaid }),
        ...(remainingAmount !== undefined && { remainingAmount }),
        ...(installmentCount !== undefined && { installmentCount }),
        ...(installmentsPaid !== undefined && { installmentsPaid }),
        ...(installmentAmount !== undefined && { installmentAmount }),
        ...(nextInstallmentDate && { nextInstallmentDate: new Date(nextInstallmentDate) }),
        ...(notes !== undefined && { notes }),
        ...(paymentStatus === 'PAID' && { paidDate: new Date() })
      },
      include: {
        clearance: {
          select: {
            clearanceNumber: true,
            status: true,
            notes: true,
            customsFee: true,
            additionalFees: true,
            totalFees: true,
            customsFeeType: true,
            customsFeePercentage: true,
            additionalFeesType: true,
            additionalFeesPercentage: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Use fees from clearance (new system) or fallback to invoice (old system)
    const customsFee = updatedInvoice.clearance?.customsFee || updatedInvoice.customsFee || 0
    const additionalFees = updatedInvoice.clearance?.additionalFees || updatedInvoice.additionalFees || 0

    // Transform data to match frontend interface
    const transformedInvoice = {
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      clearanceId: updatedInvoice.clearanceId,
      customsBrokerId: updatedInvoice.customsBrokerId,
      customsFee: customsFee,
      additionalFees: additionalFees,
      subtotal: updatedInvoice.subtotal,
      taxAmount: updatedInvoice.taxAmount,
      total: updatedInvoice.total,
      currency: updatedInvoice.currency,
      paymentStatus: updatedInvoice.paymentStatus,
      dueDate: updatedInvoice.dueDate.toISOString(),
      paidDate: updatedInvoice.paidDate?.toISOString(),
      // Payment tracking fields
      amountPaid: updatedInvoice.amountPaid || 0,
      remainingAmount: updatedInvoice.remainingAmount !== null ? updatedInvoice.remainingAmount : (updatedInvoice.total - (updatedInvoice.amountPaid || 0)),
      installmentCount: updatedInvoice.installmentCount,
      installmentsPaid: updatedInvoice.installmentsPaid,
      installmentAmount: updatedInvoice.installmentAmount,
      nextInstallmentDate: updatedInvoice.nextInstallmentDate?.toISOString(),
      payments: updatedInvoice.payments,
      notes: updatedInvoice.notes,
      createdAt: updatedInvoice.createdAt.toISOString(),
      updatedAt: updatedInvoice.updatedAt.toISOString(),
      clearance: {
        ...updatedInvoice.clearance,
        // Include fee calculation details for display
        customsFeeType: updatedInvoice.clearance?.customsFeeType || 'FIXED',
        customsFeePercentage: updatedInvoice.clearance?.customsFeePercentage || 0,
        additionalFeesType: updatedInvoice.clearance?.additionalFeesType || 'FIXED',
        additionalFeesPercentage: updatedInvoice.clearance?.additionalFeesPercentage || 0
      }
    }

    return NextResponse.json(transformedInvoice)
  } catch (error) {
    console.error("Error updating customs clearance invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
