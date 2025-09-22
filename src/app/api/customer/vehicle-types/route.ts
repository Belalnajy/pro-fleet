import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch active vehicle types for customers
    const vehicleTypes = await db.vehicleTypeModel.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        capacity: true,
        description: true,
        isRefrigerated: true
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(vehicleTypes)
  } catch (error) {
    console.error("Error fetching vehicle types:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
