import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

// GET - Get all active tracking (Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    // Get all active trips with their latest tracking
    const activeTrips = await db.trip.findMany({
      where: activeOnly ? {
        status: "IN_PROGRESS",
        driverId: { not: null }
      } : {},
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        fromCity: true,
        toCity: true,
        vehicle: { include: { vehicleType: true } },
        trackingLogs: {
          orderBy: { timestamp: "desc" },
          take: 1
        }
      },
      orderBy: { scheduledDate: "desc" }
    })

    // Format response with latest location for each trip
    const trackingData = activeTrips.map(trip => ({
      trip: {
        id: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        fromCity: trip.fromCity.name,
        toCity: trip.toCity.name,
        vehicle: `${trip.vehicle.vehicleType?.name || trip.vehicle.vehicleTypeId} - ${trip.vehicle.capacity}`,
        scheduledDate: trip.scheduledDate,
        actualStartDate: trip.actualStartDate
      },
      customer: trip.customer,
      driver: trip.driver ? {
        id: trip.driver.id,
        name: trip.driver.user.name,
        email: trip.driver.user.email,
        phone: trip.driver.user.phone,
        trackingEnabled: trip.driver.trackingEnabled,
        isAvailable: trip.driver.isAvailable
      } : null,
      lastLocation: trip.trackingLogs[0] || null,
      trackingEnabled: trip.driver?.trackingEnabled || false
    }))

    return NextResponse.json(trackingData)
  } catch (error) {
    console.error("Error fetching tracking data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Toggle tracking for a driver/trip (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { driverId, trackingEnabled, customerId } = body

    if (driverId) {
      // Toggle tracking for a specific driver
      const updatedDriver = await db.driver.update({
        where: { id: driverId },
        data: { trackingEnabled },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })

      return NextResponse.json({
        message: `Tracking ${trackingEnabled ? 'enabled' : 'disabled'} for driver ${updatedDriver.user.name}`,
        driver: updatedDriver
      })
    }

    if (customerId) {
      // Toggle tracking visibility for a specific customer
      // This could be implemented as a system setting per customer
      await db.systemSetting.upsert({
        where: { key: `customer_tracking_${customerId}` },
        update: { value: trackingEnabled.toString() },
        create: {
          key: `customer_tracking_${customerId}`,
          value: trackingEnabled.toString(),
          isActive: true
        }
      })

      return NextResponse.json({
        message: `Tracking visibility ${trackingEnabled ? 'enabled' : 'disabled'} for customer`,
        customerId,
        trackingEnabled
      })
    }

    return NextResponse.json(
      { error: "Either driverId or customerId is required" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error updating tracking settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
