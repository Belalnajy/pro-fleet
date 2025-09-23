import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/accountant/invoices/[id]/installments - Set up installment plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { installmentCount, firstInstallmentDate } = body

    if (!installmentCount || installmentCount < 2) {
      return NextResponse.json({ error: "Installment count must be at least 2" }, { status: 400 })
    }

    // Get current invoice
    const invoice = await db.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json({ error: "Cannot set installments for paid invoice" }, { status: 400 })
    }

    // Calculate installment amount
    const remainingAmount = invoice.remainingAmount || invoice.total
    const installmentAmount = remainingAmount / installmentCount

    // Set next installment date
    const nextDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date()
    if (!firstInstallmentDate) {
      nextDate.setMonth(nextDate.getMonth() + 1) // Default to next month
    }

    // Update invoice with installment plan
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        installmentCount,
        installmentAmount,
        nextInstallmentDate: nextDate,
        paymentStatus: 'INSTALLMENT'
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error setting up installments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/accountant/invoices/[id]/installments - Update installment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { installmentCount, nextInstallmentDate } = body

    // Get current invoice
    const invoice = await db.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json({ error: "Cannot update installments for paid invoice" }, { status: 400 })
    }

    // Calculate new installment amount if count changed
    const remainingAmount = invoice.remainingAmount || invoice.total
    const newInstallmentAmount = installmentCount ? remainingAmount / installmentCount : invoice.installmentAmount

    // Update invoice
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        ...(installmentCount && { installmentCount }),
        ...(newInstallmentAmount && { installmentAmount: newInstallmentAmount }),
        ...(nextInstallmentDate && { nextInstallmentDate: new Date(nextInstallmentDate) })
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating installments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
