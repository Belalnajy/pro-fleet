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
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 })
    }

    // Update payment status
    const updatedInvoice = await db.customsClearanceInvoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus: "PAID",
        paidDate: new Date()
      }
    })

    console.log(`✅ Clearance invoice ${invoiceId} marked as paid`)
    
    return NextResponse.json({
      message: "Payment processed successfully",
      invoice: updatedInvoice
    })
  } catch (error) {
    console.error("Error processing clearance invoice payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
