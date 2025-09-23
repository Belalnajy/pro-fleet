import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/customs-broker/clearance-invoices/[id]/installments - Set up installment plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { installmentCount, startDate } = body

    // Validate required fields
    if (!installmentCount || installmentCount < 2 || installmentCount > 12) {
      return NextResponse.json({ 
        error: "Installment count must be between 2 and 12" 
      }, { status: 400 })
    }

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    // Get current invoice details
    const invoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id,
        customsBrokerId: customsBroker.id
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if invoice can be converted to installments
    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json({ 
        error: "Cannot set up installments for a paid invoice" 
      }, { status: 400 })
    }

    // Calculate installment amount
    const remainingAmount = invoice.remainingAmount || invoice.total
    const installmentAmount = remainingAmount / installmentCount

    // Calculate first installment date
    const firstInstallmentDate = startDate ? new Date(startDate) : new Date()
    firstInstallmentDate.setMonth(firstInstallmentDate.getMonth() + 1)

    // Update invoice with installment plan
    const updatedInvoice = await db.customsClearanceInvoice.update({
      where: { id },
      data: {
        paymentStatus: 'INSTALLMENT',
        installmentCount,
        installmentAmount,
        nextInstallmentDate: firstInstallmentDate,
        installmentsPaid: 0,
        updatedAt: new Date()
      }
    })

    // Return updated invoice data
    const updatedInvoiceData = {
      id: updatedInvoice.id,
      amountPaid: updatedInvoice.amountPaid || 0,
      remainingAmount: updatedInvoice.remainingAmount || updatedInvoice.total,
      paymentStatus: updatedInvoice.paymentStatus,
      installmentCount: updatedInvoice.installmentCount,
      installmentsPaid: updatedInvoice.installmentsPaid || 0,
      installmentAmount: updatedInvoice.installmentAmount,
      nextInstallmentDate: updatedInvoice.nextInstallmentDate?.toISOString()
    }

    return NextResponse.json({
      message: "Installment plan set up successfully",
      invoice: updatedInvoiceData
    })
  } catch (error) {
    console.error("Error setting up installment plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/customs-broker/clearance-invoices/[id]/installments - Update installment plan
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

    const body = await request.json()
    const { installmentCount } = body

    // Validate required fields
    if (!installmentCount || installmentCount < 2 || installmentCount > 12) {
      return NextResponse.json({ 
        error: "Installment count must be between 2 and 12" 
      }, { status: 400 })
    }

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    // Get current invoice details
    const invoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id,
        customsBrokerId: customsBroker.id
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if invoice has installment plan
    if (invoice.paymentStatus !== 'INSTALLMENT') {
      return NextResponse.json({ 
        error: "Invoice does not have an installment plan" 
      }, { status: 400 })
    }

    // Check if any payments have been made
    if ((invoice.installmentsPaid || 0) > 0) {
      return NextResponse.json({ 
        error: "Cannot modify installment plan after payments have been made" 
      }, { status: 400 })
    }

    // Calculate new installment amount
    const remainingAmount = invoice.remainingAmount || invoice.total
    const installmentAmount = remainingAmount / installmentCount

    // Update invoice with new installment plan
    const updatedInvoice = await db.customsClearanceInvoice.update({
      where: { id },
      data: {
        installmentCount,
        installmentAmount,
        updatedAt: new Date()
      }
    })

    // Return updated invoice data
    const updatedInvoiceData = {
      id: updatedInvoice.id,
      amountPaid: updatedInvoice.amountPaid || 0,
      remainingAmount: updatedInvoice.remainingAmount || updatedInvoice.total,
      paymentStatus: updatedInvoice.paymentStatus,
      installmentCount: updatedInvoice.installmentCount,
      installmentsPaid: updatedInvoice.installmentsPaid || 0,
      installmentAmount: updatedInvoice.installmentAmount,
      nextInstallmentDate: updatedInvoice.nextInstallmentDate?.toISOString()
    }

    return NextResponse.json({
      message: "Installment plan updated successfully",
      invoice: updatedInvoiceData
    })
  } catch (error) {
    console.error("Error updating installment plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
