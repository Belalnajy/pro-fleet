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
            name: true,
            email: true,
          }
        },
        vehicle: {
          select: {
            plateNumber: true,
            type: true
          }
        },
        fromCity: {
          select: {
            name: true,
            nameAr: true
          }
        },
        toCity: {
          select: {
            name: true,
            nameAr: true
          }
        },
        temperature: {
          select: {
            name: true,
            value: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data to match the frontend interface
    const transformedTrips = trips.map(trip => ({
      id: trip.id,
      tripNumber: trip.tripNumber,
      fromCityName: trip.fromCity.name,
      toCityName: trip.toCity.name,
      pickupAddress: trip.notes?.split('\n')[0]?.replace('Pickup: ', '') || "",
      deliveryAddress: trip.notes?.split('\n')[1]?.replace('Delivery: ', '') || "",
      cargoType: trip.notes?.split('\n')[2]?.split(' (')[0]?.replace('Cargo: ', '') || "General Cargo",
      cargoWeight: parseInt(trip.notes?.split('(')[1]?.split('kg')[0] || "1000"),
      cargoValue: trip.price,
      temperatureRequirement: trip.temperature?.name,
      specialInstructions: trip.notes,
      status: trip.status,
      scheduledPickupDate: trip.scheduledDate,
      actualPickupDate: trip.actualStartDate,
      estimatedDeliveryDate: trip.scheduledDate, // Using scheduled date as estimate
      actualDeliveryDate: trip.deliveredDate,
      totalPrice: trip.price,
      driverName: trip.driver?.name,
      vehiclePlateNumber: trip.vehicle?.plateNumber,
      createdAt: trip.createdAt,
    }))

    return NextResponse.json(transformedTrips)
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
      pickupAddress,
      deliveryAddress,
      cargoType,
      cargoWeight,
      cargoValue,
      temperatureRequirement,
      specialInstructions,
      scheduledPickupDate,
      estimatedDeliveryDate,
      vehicleTypeId,
    } = body

    // Validate required fields
    if (!fromCityId || !toCityId || !pickupAddress || !deliveryAddress || !scheduledPickupDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate trip number
    const tripCount = await db.trip.count()
    const tripNumber = `TRP${String(tripCount + 1).padStart(6, '0')}`

    // Get default temperature if not provided
    let temperatureId = null
    if (temperatureRequirement) {
      const temperature = await db.temperature.findFirst({
        where: {
          name: temperatureRequirement
        }
      })
      temperatureId = temperature?.id
    }

    if (!temperatureId) {
      // Get default temperature (ambient)
      const defaultTemp = await db.temperature.findFirst({
        where: {
          name: "Ambient"
        }
      })
      temperatureId = defaultTemp?.id
    }

    // Calculate estimated price based on distance and vehicle type
    // This is a simplified calculation - in a real app you'd use proper pricing rules
    const basePrice = 500 // Base price in SAR
    const weightMultiplier = cargoWeight ? (cargoWeight / 1000) * 50 : 50
    const estimatedPrice = basePrice + weightMultiplier

    // Create trip
    const trip = await db.trip.create({
      data: {
        tripNumber,
        customerId: session.user.id,
        fromCityId,
        toCityId,
        temperatureId: temperatureId!,
        scheduledDate: new Date(scheduledPickupDate),
        price: estimatedPrice,
        currency: "SAR",
        notes: `Pickup: ${pickupAddress}\nDelivery: ${deliveryAddress}\nCargo: ${cargoType} (${cargoWeight}kg)\nSpecial Instructions: ${specialInstructions || 'None'}`,
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
