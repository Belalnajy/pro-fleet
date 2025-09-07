import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const [customers, drivers, vehicles, cities, temperatures] = await Promise.all([
      db.user.count({ where: { role: "CUSTOMER", isActive: true } }),
      db.user.count({ where: { role: "DRIVER", isActive: true } }),
      db.vehicle.count({ where: { isActive: true } }),
      db.city.count({ where: { isActive: true } }),
      db.temperatureSetting.count({ where: { isActive: true } }),
    ])

    return NextResponse.json({
      customers,
      drivers,
      vehicles,
      cities,
      temperatures,
      message: "Data counts from database"
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    )
  }
}
