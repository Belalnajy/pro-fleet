import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/accountant/invoices/[id]/payments - Get payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const payments = await db.payment.findMany({
      where: {
        invoiceId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/accountant/invoices/[id]/payments - Add new payment
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
    const { amount, paymentMethod, reference, notes } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Get current invoice
    const invoice = await db.invoice.findUnique({
      where: { id }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if invoice is already fully paid
    if (invoice.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      )
    }

    // Calculate current totals
    const currentAmountPaid = invoice.amountPaid || 0
    const currentRemainingAmount = invoice.total - currentAmountPaid
    
    // Check if remaining amount is 0 or less
    if (currentRemainingAmount <= 0) {
      return NextResponse.json(
        { error: 'Invoice is fully paid, no additional payments allowed' },
        { status: 400 }
      )
    }
    
    // Check if payment amount exceeds remaining balance
    if (amount > currentRemainingAmount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      )
    }
    const newAmountPaid = currentAmountPaid + amount
    const remainingAmount = Math.max(0, invoice.total - newAmountPaid)

    // Determine new payment status
    let newPaymentStatus = invoice.paymentStatus
    if (newAmountPaid >= invoice.total) {
      newPaymentStatus = 'PAID'
    } else if (newAmountPaid > 0) {
      if (invoice.installmentCount && invoice.installmentCount > 0) {
        newPaymentStatus = 'INSTALLMENT'
      } else {
        newPaymentStatus = 'PARTIAL'
      }
    }

    // Update installments if applicable
    let installmentsPaid = invoice.installmentsPaid || 0
    let nextInstallmentDate = invoice.nextInstallmentDate

    if (invoice.installmentCount && invoice.installmentAmount) {
      const newInstallmentsPaid = Math.floor(newAmountPaid / invoice.installmentAmount)
      installmentsPaid = Math.min(newInstallmentsPaid, invoice.installmentCount)
      
      // Calculate next installment date if not fully paid
      if (installmentsPaid < invoice.installmentCount && newPaymentStatus !== 'PAID') {
        const currentDate = new Date()
        currentDate.setMonth(currentDate.getMonth() + 1) // Next month
        nextInstallmentDate = currentDate
      } else {
        nextInstallmentDate = null
      }
    }

    // Create payment record and update invoice in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount,
          paymentMethod: paymentMethod || 'cash',
          reference,
          notes,
          createdBy: session.user.id
        }
      })

      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount,
          paymentStatus: newPaymentStatus,
          installmentsPaid,
          nextInstallmentDate,
          paidDate: newPaymentStatus === 'PAID' ? new Date() : invoice.paidDate
        }
      })

      return { payment, invoice: updatedInvoice }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error adding payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
