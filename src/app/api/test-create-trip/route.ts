import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateTripNumber } from "@/lib/trip-number-generator"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Received body:", JSON.stringify(body, null, 2))
    
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
    } = body

    // Validate required fields
    if (!customerId) throw new Error("customerId is required")
    if (!vehicleId) throw new Error("vehicleId is required")
    if (!fromCityId) throw new Error("fromCityId is required")
    if (!toCityId) throw new Error("toCityId is required")
    if (!temperatureId) throw new Error("temperatureId is required")
    if (!scheduledDate) throw new Error("scheduledDate is required")
    if (!price) throw new Error("price is required")

    console.log("Validation passed")

    // Check if related records exist
    const customer = await db.user.findUnique({ where: { id: customerId } })
    if (!customer) throw new Error(`Customer not found: ${customerId}`)
    console.log("Customer found:", customer.name)

    const vehicle = await db.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle) throw new Error(`Vehicle not found: ${vehicleId}`)
    console.log("Vehicle found:", vehicle.capacity)

    const fromCity = await db.city.findUnique({ where: { id: fromCityId } })
    if (!fromCity) throw new Error(`From city not found: ${fromCityId}`)
    console.log("From city found:", fromCity.name)

    const toCity = await db.city.findUnique({ where: { id: toCityId } })
    if (!toCity) throw new Error(`To city not found: ${toCityId}`)
    console.log("To city found:", toCity.name)

    const temperature = await db.temperatureSetting.findUnique({ where: { id: temperatureId } })
    if (!temperature) throw new Error(`Temperature not found: ${temperatureId}`)
    console.log("Temperature found:", temperature.option)

    let actualDriverId: string | null = null
    if (driverId) {
      // First try as Driver ID
      let driver = await db.driver.findUnique({ 
        where: { id: driverId },
        include: { user: true }
      })
      
      if (!driver) {
        // If not found, try as User ID
        const user = await db.user.findUnique({ 
          where: { id: driverId },
          include: { driverProfile: true }
        })
        if (user && user.role === 'DRIVER' && user.driverProfile) {
          actualDriverId = user.driverProfile.id
          console.log("Driver found via User ID:", user.name, user.driverProfile.carPlateNumber)
        } else {
          throw new Error(`Driver not found: ${driverId}`)
        }
      } else {
        actualDriverId = driver.id
        console.log("Driver found via Driver ID:", driver.user.name, driver.carPlateNumber)
      }
    }

    // Generate trip number with new format: PRO + YYYYMMDD + sequential number
    const tripCount = await db.trip.count()
    const tripNumber = generateTripNumber(tripCount)
    console.log("Generated trip number:", tripNumber)

    const trip = await db.trip.create({
      data: {
        tripNumber,
        customerId,
        driverId: actualDriverId,
        vehicleId,
        fromCityId,
        toCityId,
        temperatureId,
        scheduledDate: new Date(scheduledDate),
        price: parseFloat(price),
        currency: "SAR",
        notes,
      },
    })

    console.log("Trip created successfully:", trip.id)

    return NextResponse.json({
      message: "Trip created successfully",
      trip,
    })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.message || error?.toString() },
      { status: 500 }
    )
  }
}
