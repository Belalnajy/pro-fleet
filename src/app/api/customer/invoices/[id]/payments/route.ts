import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // Verify the invoice belongs to the customer
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        trip: {
          customerId: session.user.id
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Fetch payments for this invoice
    const payments = await db.payment.findMany({
      where: { invoiceId: invoiceId },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching invoice payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id
    const { amount, paymentMethod, reference, notes } = await request.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }

    // Verify the invoice belongs to the customer and get current state
    const invoice = await db.invoice.findFirst({
      where: {
        id: invoiceId,
        trip: {
          customerId: session.user.id
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 })
    }

    const currentAmountPaid = invoice.amountPaid || 0
    const remainingAmount = invoice.total - currentAmountPaid

    // Check if invoice is fully paid (remaining amount is 0 or less)
    if (remainingAmount <= 0) {
      return NextResponse.json({ 
        error: "Invoice is fully paid, no additional payments allowed" 
      }, { status: 400 })
    }

    if (amount > remainingAmount) {
      return NextResponse.json({ 
        error: "Payment amount exceeds remaining balance" 
      }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoiceId,
          amount: amount,
          paymentMethod: paymentMethod || "cash",
          reference: reference || null,
          notes: notes || null,
          paymentDate: new Date(),
          createdBy: session.user.id
        }
      })

      // Update invoice payment status
      const newAmountPaid = currentAmountPaid + amount
      const newRemainingAmount = invoice.total - newAmountPaid
      
      let newPaymentStatus = invoice.paymentStatus
      if (newRemainingAmount <= 0) {
        newPaymentStatus = "PAID"
      } else if (newAmountPaid > 0) {
        newPaymentStatus = "PARTIAL"
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaymentStatus,
          paidDate: newPaymentStatus === "PAID" ? new Date() : null
        }
      })

      return { payment, invoice: updatedInvoice }
    })

    console.log(`✅ Payment of ${amount} added to invoice ${invoiceId}`)
    
    return NextResponse.json({
      message: "Payment added successfully",
      payment: result.payment,
      invoice: result.invoice
    })
  } catch (error) {
    console.error("Error adding invoice payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
