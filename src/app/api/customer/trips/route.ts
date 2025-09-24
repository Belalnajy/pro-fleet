import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateTripNumber } from "@/lib/trip-number-generator"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trips = await db.trip.findMany({
      where: {
        customerId: session.user.id
      },
      include: {
        driver: {
          select: {
            carPlateNumber: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            vehicleNumber: true,
            vehicleType: {
              select: {
                name: true,
                nameAr: true,
                capacity: true
              }
            }
          }
        },
        fromCity: {
          select: {
            name: true,
          }
        },
        toCity: {
          select: {
            name: true,
          }
        },
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true,
          }
        },
        customsBroker: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Return trips with relations for my-trips page
    return NextResponse.json(trips)
  } catch (error) {
    console.error("Error fetching customer trips:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      fromCityId,
      toCityId,
      temperatureId,
      scheduledDate,
      price,
      notes,
      vehicleId,
      vehicleTypeId,
      customsBrokerId,
      driverId,
    } = body

    console.log('Received trip data:', body)

    // Validate required fields
    if (!fromCityId || !toCityId || !scheduledDate) {
      console.log('Missing required fields:', { fromCityId, toCityId, scheduledDate })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate trip number with new format: PRO + YYYYMMDD + sequential number
    const tripCount = await db.trip.count()
    const tripNumber = generateTripNumber(tripCount)

    // Use provided data or get defaults
    let finalTemperatureId = temperatureId
    if (!finalTemperatureId) {
      const defaultTemp = await db.temperatureSetting.findFirst({
        where: {
          option: "AMBIENT"
        }
      })
      finalTemperatureId = defaultTemp?.id || null
    }

    let finalVehicleId = vehicleId
    let targetVehicleTypeId = vehicleTypeId
    
    if (!finalVehicleId) {
      // If vehicleTypeId is provided, use it; otherwise get first available
      if (!targetVehicleTypeId) {
        const defaultVehicleType = await db.vehicleTypeModel.findFirst({
          where: { isActive: true }
        })
        targetVehicleTypeId = defaultVehicleType?.id
      }
      
      if (targetVehicleTypeId) {
        // Find or create a vehicle for this vehicle type
        let vehicle = await db.vehicle.findFirst({
          where: {
            vehicleTypeId: targetVehicleTypeId,
            isActive: true
          }
        })
        
        if (!vehicle) {
          // Get vehicle type details for creating vehicle
          const vehicleType = await db.vehicleTypeModel.findUnique({
            where: { id: targetVehicleTypeId }
          })
          
          if (vehicleType) {
            vehicle = await db.vehicle.create({
              data: {
                vehicleTypeId: targetVehicleTypeId,
                vehicleNumber: `AUTO-${Date.now()}`,
                isActive: true
              }
            })
          }
        }
        
        finalVehicleId = vehicle?.id || null
      }
    }

    const finalPrice = price || 500 // Use provided price or default

    // Validate that we have required IDs
    if (!finalTemperatureId) {
      console.error('No temperature ID available')
      return NextResponse.json(
        { error: "Temperature setting not found" },
        { status: 400 }
      )
    }

    if (!finalVehicleId) {
      console.error('No vehicle ID available')
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 400 }
      )
    }

    console.log('Creating trip with:', {
      tripNumber,
      customerId: session.user.id,
      fromCityId,
      toCityId,
      temperatureId: finalTemperatureId,
      vehicleId: finalVehicleId,
      driverId: driverId || null,
      customsBrokerId: customsBrokerId || null,
      scheduledDate,
      price: finalPrice
    })

    // Create trip
    const trip = await db.trip.create({
      data: {
        tripNumber,
        customerId: session.user.id,
        fromCityId,
        toCityId,
        temperatureId: finalTemperatureId!,
        vehicleId: finalVehicleId!,
        driverId: driverId || null, // Include driver ID if provided
        customsBrokerId: customsBrokerId || null, // Include customs broker ID if provided
        scheduledDate: new Date(scheduledDate),
        price: finalPrice,
        currency: "SAR",
        notes: notes || "Customer booking",
        status: driverId ? "ASSIGNED" : "PENDING", // Set status based on driver assignment
      },
      include: {
        fromCity: {
          select: {
            name: true
          }
        },
        toCity: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error("Error creating customer trip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
