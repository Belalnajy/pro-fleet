import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For now, return a simple CSV export
    const csvData = `رقم الدفعة,رقم الفاتورة,نوع الفاتورة,المبلغ,طريقة الدفع,تاريخ الدفع
payment-1,PRO-INV-20250923019,فاتورة عادية,1000,تحويل بنكي,2025-01-20
payment-2,PRO-CLR-20250923001,تخليص جمركي,500,نقداً,2025-01-19`

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="customer-payments-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error("Error exporting customer payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
