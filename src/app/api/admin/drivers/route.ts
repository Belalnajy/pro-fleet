import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Transform data to match frontend interface
    const transformedDrivers = drivers.map(driver => ({
      id: driver.driverProfile?.id || driver.id, // Use Driver ID, fallback to User ID
      userId: driver.id, // Keep User ID for reference
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      carPlateNumber: driver.driverProfile?.carPlateNumber || "",
      nationality: driver.driverProfile?.nationality || "",
      carRegistration: driver.driverProfile?.carRegistration || "",
      licenseExpiry: driver.driverProfile?.licenseExpiry,
      isAvailable: driver.driverProfile?.isAvailable ?? true,
    }))

    return NextResponse.json(transformedDrivers)
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
