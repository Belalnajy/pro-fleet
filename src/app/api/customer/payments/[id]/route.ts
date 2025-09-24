import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock payment details based on ID
    const mockPaymentDetails = {
      id,
      amount: 1000,
      paymentMethod: "bank_transfer",
      paymentDate: "2025-01-20T10:00:00Z",
      reference: "REF-001",
      notes: "دفعة أولى",
      status: "PAID",
      createdAt: "2025-01-20T10:00:00Z",
      invoice: {
        id: "invoice-1",
        invoiceNumber: "PRO-INV-20250923019",
        invoiceType: "REGULAR" as const,
        tripNumber: "TRP-001",
        total: 2746.2,
        paidAmount: 1000,
        remainingAmount: 1746.2,
        paymentStatus: "PARTIAL",
        dueDate: "2025-02-20T00:00:00Z",
        route: {
          from: "الرياض",
          to: "جدة"
        },
        customer: {
          name: session.user.name || "عميل",
          email: session.user.email || "",
          phone: "+966501234567"
        }
      }
    }

    return NextResponse.json(mockPaymentDetails)

  } catch (error) {
    console.error("Error fetching payment details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
