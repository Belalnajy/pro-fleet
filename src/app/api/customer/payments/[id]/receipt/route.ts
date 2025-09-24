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

    // For now, return a simple text receipt until we implement PDF generation
    const receiptText = `
=== إيصال دفع ===
رقم الدفعة: ${id}
العميل: ${session.user.name}
التاريخ: ${new Date().toLocaleDateString('ar-SA')}

شكراً لكم
==================
    `

    return new NextResponse(receiptText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="receipt-${id}.txt"`
      }
    })

  } catch (error) {
    console.error("Error generating receipt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
