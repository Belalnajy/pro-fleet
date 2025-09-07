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

    const temperatures = await db.temperatureSetting.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        option: true,
        value: true,
        unit: true,
      },
      orderBy: {
        value: "asc"
      }
    })

    return NextResponse.json(temperatures)
  } catch (error) {
    console.error("Error fetching temperatures:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
