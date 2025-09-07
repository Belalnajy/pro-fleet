import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const cities = await db.city.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json({
      count: cities.length,
      cities: cities
    })
  } catch (error) {
    console.error("Error fetching cities:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.toString() },
      { status: 500 }
    )
  }
}
