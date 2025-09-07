import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const drivers = await db.user.findMany({
      where: {
        role: "DRIVER",
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        driverProfile: {
          select: {
            id: true,
            carPlateNumber: true,
            nationality: true,
            carRegistration: true,
            licenseExpiry: true,
            isAvailable: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json({
      count: drivers.length,
      drivers: drivers,
      transformed: drivers.map(driver => ({
        id: driver.driverProfile?.id || driver.id,
        userId: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        carPlateNumber: driver.driverProfile?.carPlateNumber || "",
        nationality: driver.driverProfile?.nationality || "",
        carRegistration: driver.driverProfile?.carRegistration || "",
        licenseExpiry: driver.driverProfile?.licenseExpiry,
        isAvailable: driver.driverProfile?.isAvailable ?? true,
      }))
    })
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.toString() },
      { status: 500 }
    )
  }
}
