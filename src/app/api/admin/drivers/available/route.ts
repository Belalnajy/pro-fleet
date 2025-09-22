import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'CUSTOMER'].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleTypeId = searchParams.get('vehicleTypeId')
    const temperatureId = searchParams.get('temperatureId')
    
    console.log('📊 Available drivers API called with:', {
      vehicleTypeId,
      temperatureId,
      userRole: session.user.role
    })

    let whereClause: any = {
      isAvailable: true,
      user: {
        isActive: true,
        role: "DRIVER"
      }
    }

    // If vehicle type is specified, filter drivers who can handle this vehicle type
    // For now, if no driver-vehicle-type relationships exist, show all drivers
    if (vehicleTypeId) {
      // Check if any driver-vehicle-type relationships exist
      const hasRelationships = await (db as any).driverVehicleType.count()
      
      if (hasRelationships > 0) {
        // Use proper filtering if relationships exist
        whereClause.vehicleTypes = {
          some: {
            vehicleTypeId: vehicleTypeId
          }
        }
        console.log('✅ Using vehicle type filtering. Found', hasRelationships, 'relationships.')
      } else {
        // If no relationships exist, show all available drivers
        console.log('⚠️ No driver-vehicle-type relationships found. Showing all available drivers.')
        console.log('💡 Tip: Go to /ar/admin/auto-assign to create relationships automatically.')
      }
    }

    const availableDrivers = await (db as any).driver.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        carPlateNumber: true,
        nationality: true,
        isAvailable: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        vehicleTypes: {
          include: {
            vehicleType: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                capacity: true,
                isRefrigerated: true
              }
            }
          }
        },
        // Check if driver has any active trips
        trips: {
          where: {
            status: {
              in: ["ASSIGNED", "IN_PROGRESS", "EN_ROUTE_PICKUP", "AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "AT_DESTINATION"]
            }
          },
          select: {
            id: true,
            status: true,
            tripNumber: true
          }
        }
      },
      orderBy: {
        user: {
          name: "asc"
        }
      }
    })

    // Transform data and add availability status
    const transformedDrivers = availableDrivers.map(driver => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone,
      carPlateNumber: driver.carPlateNumber,
      nationality: driver.nationality,
      isAvailable: driver.isAvailable,
      hasActiveTrip: driver.trips.length > 0,
      activeTrip: driver.trips[0] || null,
      vehicleTypes: driver.vehicleTypes.map(dvt => ({
        id: dvt.vehicleType.id,
        name: dvt.vehicleType.name,
        nameAr: dvt.vehicleType.nameAr,
        capacity: dvt.vehicleType.capacity,
        isRefrigerated: dvt.vehicleType.isRefrigerated
      })),
      // Driver is truly available if: isAvailable = true AND no active trips
      isTrulyAvailable: driver.isAvailable && driver.trips.length === 0
    }))

    // Additional filtering based on temperature requirements
    let filteredDrivers = transformedDrivers

    if (temperatureId) {
      const temperatureSetting = await db.temperatureSetting.findUnique({
        where: { id: temperatureId }
      })

      if (temperatureSetting && (temperatureSetting.option as string) === "FROZEN") {
        // For frozen goods, only show drivers with refrigerated vehicle types
        filteredDrivers = transformedDrivers.filter(driver => 
          driver.vehicleTypes.some(vt => vt.isRefrigerated)
        )
      }
    }

    console.log('✅ Returning drivers:', {
      totalFound: availableDrivers.length,
      afterTransform: transformedDrivers.length,
      afterFiltering: filteredDrivers.length,
      available: filteredDrivers.filter(d => d.isTrulyAvailable).length,
      busy: filteredDrivers.filter(d => !d.isTrulyAvailable).length
    })
    
    return NextResponse.json({
      drivers: filteredDrivers,
      total: filteredDrivers.length,
      available: filteredDrivers.filter(d => d.isTrulyAvailable).length,
      busy: filteredDrivers.filter(d => !d.isTrulyAvailable).length,
      filters: {
        vehicleTypeId,
        temperatureId
      }
    })
  } catch (error) {
    console.error("Error fetching available drivers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
