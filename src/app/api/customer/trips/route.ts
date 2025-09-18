import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
            capacity: true,
            vehicleType: {
              select: {
                name: true,
                nameAr: true
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

    // Generate trip number
    const tripCount = await db.trip.count()
    const tripNumber = `TWB:${String(tripCount + 1).padStart(4, "0")}`

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
    if (!finalVehicleId) {
      const defaultVehicle = await db.vehicle.findFirst({
        where: {
          isActive: true
        }
      })
      finalVehicleId = defaultVehicle?.id || null
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
        scheduledDate: new Date(scheduledDate),
        price: finalPrice,
        currency: "SAR",
        notes: notes || "Customer booking",
        status: "PENDING",
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
