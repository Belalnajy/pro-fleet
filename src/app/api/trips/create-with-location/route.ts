import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { TripStatus } from "@prisma/client"

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

interface CreateTripRequest {
  customerId?: string
  driverId?: string
  vehicleId: string
  fromCityId?: string
  toCityId?: string
  temperatureId: string
  scheduledDate: string
  price: number
  notes?: string
  originLocation?: LocationData
  destinationLocation?: LocationData
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: CreateTripRequest = await request.json()
    const {
      customerId,
      driverId,
      vehicleId,
      fromCityId,
      toCityId,
      temperatureId,
      scheduledDate,
      price,
      notes,
      originLocation,
      destinationLocation
    } = body

    // Validate required fields
    if (!vehicleId || !temperatureId || !scheduledDate || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate that we have either location data or city IDs
    if ((!originLocation || !destinationLocation) && (!fromCityId || !toCityId)) {
      return NextResponse.json(
        { error: "Either location data or city IDs are required" },
        { status: 400 }
      )
    }

    // Generate unique trip number
    const tripNumber = `TRP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Determine customer ID (for admin creating trips for customers vs customers creating their own)
    let finalCustomerId = customerId
    if (!finalCustomerId) {
      // If no customerId provided, assume the current user is the customer
      const userProfile = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { customerProfile: true }
      })

      if (!userProfile?.customerProfile) {
        return NextResponse.json(
          { error: "User is not a customer" },
          { status: 400 }
        )
      }
      finalCustomerId = userProfile.customerProfile.id
    }

    // Handle city creation/lookup for location-based trips
    let finalFromCityId = fromCityId
    let finalToCityId = toCityId

    if (originLocation && !finalFromCityId) {
      // Try to find existing city or create new one
      const cityName = originLocation.name || originLocation.address || `Location ${originLocation.lat.toFixed(4)}, ${originLocation.lng.toFixed(4)}`
      
      let city = await prisma.city.findFirst({
        where: {
          name: cityName
        }
      })

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            nameAr: cityName,
            country: "Saudi Arabia",
            isActive: true
          }
        })
      }
      finalFromCityId = city.id
    }

    if (destinationLocation && !finalToCityId) {
      // Try to find existing city or create new one
      const cityName = destinationLocation.name || destinationLocation.address || `Location ${destinationLocation.lat.toFixed(4)}, ${destinationLocation.lng.toFixed(4)}`
      
      let city = await prisma.city.findFirst({
        where: {
          name: cityName
        }
      })

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            nameAr: cityName,
            country: "Saudi Arabia",
            isActive: true
          }
        })
      }
      finalToCityId = city.id
    }

    // Create the trip
    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        customerId: finalCustomerId,
        driverId: driverId || null,
        vehicleId,
        fromCityId: finalFromCityId!,
        toCityId: finalToCityId!,
        temperatureId,
        scheduledDate: new Date(scheduledDate),
        price,
        currency: "SAR",
        status: TripStatus.PENDING,
        notes: notes ? `${notes}${originLocation && destinationLocation ? '\n\nLocation Data: ' + JSON.stringify({origin: originLocation, destination: destinationLocation}) : ''}` : (originLocation && destinationLocation ? `Location Data: ${JSON.stringify({origin: originLocation, destination: destinationLocation})}` : null)
      },
      include: {
        customer: true,
        driver: true,
        vehicle: {
          include: {
            vehicleType: true
          }
        },
        fromCity: true,
        toCity: true
      }
    })

    return NextResponse.json({
      success: true,
      trip,
      message: "Trip created successfully"
    })

  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    )
  }
}
