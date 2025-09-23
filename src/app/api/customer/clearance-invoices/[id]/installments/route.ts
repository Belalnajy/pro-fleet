import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
    const { installmentCount, firstInstallmentDate } = await request.json()

    // Validate input
    if (!installmentCount || installmentCount < 2 || installmentCount > 12) {
      return NextResponse.json({ 
        error: "Invalid installment count (must be between 2 and 12)" 
      }, { status: 400 })
    }

    if (!firstInstallmentDate) {
      return NextResponse.json({ error: "First installment date is required" }, { status: 400 })
    }

    // Verify the clearance invoice belongs to the customer
    const clearanceInvoice = await db.customsClearanceInvoice.findFirst({
      where: {
        id: invoiceId,
        clearance: {
          invoice: {
            trip: {
              customerId: session.user.id
            }
          }
        }
      }
    })

    if (!clearanceInvoice) {
      return NextResponse.json({ error: "Clearance invoice not found" }, { status: 404 })
    }

    if (clearanceInvoice.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Cannot set installments for paid invoice" }, { status: 400 })
    }

    if (clearanceInvoice.installmentCount && clearanceInvoice.installmentCount > 0) {
      return NextResponse.json({ error: "Installment plan already exists" }, { status: 400 })
    }

    // Calculate installment amount
    const remainingAmount = clearanceInvoice.remainingAmount || clearanceInvoice.total
    const installmentAmount = Math.round((remainingAmount / installmentCount) * 100) / 100

    // Calculate next installment date
    const nextInstallmentDate = new Date(firstInstallmentDate)

    // Update invoice with installment plan
    const updatedInvoice = await db.customsClearanceInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: "INSTALLMENT",
        installmentCount: installmentCount,
        installmentsPaid: 0,
        installmentAmount: installmentAmount,
        nextInstallmentDate: nextInstallmentDate
      }
    })

    console.log(`✅ Installment plan set for clearance invoice ${invoiceId}: ${installmentCount} installments of ${installmentAmount}`)
    
    return NextResponse.json({
      message: "Installment plan set successfully",
      invoice: updatedInvoice
    })
  } catch (error) {
    console.error("Error setting clearance invoice installments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
