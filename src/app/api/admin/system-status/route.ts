import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('📊 Fetching system status...')

    // Get total drivers count
    const totalDrivers = await db.driver.count({
      where: {
        user: {
          isActive: true,
          role: "DRIVER"
        }
      }
    })

    // Get drivers with vehicle types
    const driversWithVehicleTypes = await (db as any).driver.findMany({
      where: {
        user: {
          isActive: true,
          role: "DRIVER"
        },
        vehicleTypes: {
          some: {}
        }
      },
      select: {
        id: true
      }
    })

    // Get total vehicle types
    const totalVehicleTypes = await db.vehicleTypeModel.count({
      where: {
        isActive: true
      }
    })

    // Get vehicle types that have drivers assigned
    const vehicleTypesWithDrivers = await (db as any).vehicleTypeModel.findMany({
      where: {
        isActive: true,
        drivers: {
          some: {}
        }
      },
      select: {
        id: true
      }
    })

    // Get total relationships
    const totalRelationships = await (db as any).driverVehicleType.count()

    const systemStatus = {
      drivers: {
        total: totalDrivers,
        withVehicleTypes: driversWithVehicleTypes.length,
        withoutVehicleTypes: totalDrivers - driversWithVehicleTypes.length
      },
      vehicleTypes: {
        total: totalVehicleTypes,
        assigned: vehicleTypesWithDrivers.length,
        unassigned: totalVehicleTypes - vehicleTypesWithDrivers.length
      },
      relationships: {
        total: totalRelationships
      },
      lastUpdated: new Date().toISOString()
    }

    console.log('✅ System status:', systemStatus)

    return NextResponse.json(systemStatus)

  } catch (error) {
    console.error('❌ Error fetching system status:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
