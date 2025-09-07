import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const temperatures = await db.temperatureSetting.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        option: true,
        value: true,
        unit: true,
        isActive: true,
      },
      orderBy: {
        value: "asc"
      }
    })

    return NextResponse.json({
      count: temperatures.length,
      temperatures: temperatures
    })
  } catch (error) {
    console.error("Error fetching temperatures:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.toString() },
      { status: 500 }
    )
  }
}
