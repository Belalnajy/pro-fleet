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

    const vehicles = await db.vehicle.findMany({
      where: { isActive: true },
      select: {
        id: true,
        vehicleTypeId: true,
        capacity: true,
        vehicleType: { select: { name: true, nameAr: true } },
      },
      orderBy: { vehicleTypeId: "asc" }
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error("Error fetching vehicles:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
