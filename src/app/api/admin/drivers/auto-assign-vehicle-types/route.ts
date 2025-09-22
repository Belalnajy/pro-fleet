import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🚀 Starting auto-assignment of vehicle types to drivers...')

    // Get all drivers and vehicle types
    const drivers = await db.driver.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    const vehicleTypes = await db.vehicleTypeModel.findMany()

    console.log(`Found ${drivers.length} drivers and ${vehicleTypes.length} vehicle types`)

    if (drivers.length === 0) {
      return NextResponse.json({ 
        error: "No drivers found. Please create some drivers first." 
      }, { status: 400 })
    }

    if (vehicleTypes.length === 0) {
      return NextResponse.json({ 
        error: "No vehicle types found. Please create some vehicle types first." 
      }, { status: 400 })
    }

    // Clear existing relationships
    await (db as any).driverVehicleType.deleteMany()
    console.log('🧹 Cleared existing driver-vehicle-type relationships')

    let relationshipsCreated = 0
    const assignments: any[] = []

    // Assign vehicle types to drivers
    for (const driver of drivers) {
      // Each driver can operate 1-3 random vehicle types
      const numVehicleTypes = Math.floor(Math.random() * 3) + 1
      const shuffledVehicleTypes = [...vehicleTypes].sort(() => 0.5 - Math.random())
      const assignedVehicleTypes = shuffledVehicleTypes.slice(0, numVehicleTypes)

      for (const vehicleType of assignedVehicleTypes) {
        try {
          await (db as any).driverVehicleType.create({
            data: {
              driverId: driver.id,
              vehicleTypeId: vehicleType.id
            }
          })
          relationshipsCreated++
          assignments.push({
            driverName: driver.user.name,
            vehicleTypeName: vehicleType.nameAr || vehicleType.name
          })
          console.log(`✅ Assigned ${vehicleType.name} to ${driver.user.name}`)
        } catch (error) {
          console.log(`⚠️ Skipped duplicate assignment: ${vehicleType.name} to ${driver.user.name}`)
        }
      }
    }

    console.log(`🎉 Successfully created ${relationshipsCreated} driver-vehicle-type relationships`)

    // Get summary
    const summary = await db.driver.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        },
        vehicleTypes: {
          include: {
            vehicleType: {
              select: {
                name: true,
                nameAr: true
              }
            }
          }
        }
      }
    })

    const summaryData = summary.map(driver => ({
      driverName: driver.user.name,
      vehicleTypes: driver.vehicleTypes.map(vt => vt.vehicleType.nameAr || vt.vehicleType.name)
    }))

    return NextResponse.json({
      success: true,
      message: `Successfully created ${relationshipsCreated} driver-vehicle-type relationships`,
      stats: {
        driversCount: drivers.length,
        vehicleTypesCount: vehicleTypes.length,
        relationshipsCreated
      },
      assignments,
      summary: summaryData
    })

  } catch (error) {
    console.error('❌ Error in auto-assignment:', error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
