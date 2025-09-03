import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

// GET - Get tracking logs for a trip
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tripId = searchParams.get("tripId")
    const driverId = searchParams.get("driverId")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Build query based on user role and parameters
    let whereClause: any = {}

    if (tripId) {
      whereClause.tripId = tripId
    }

    if (driverId) {
      whereClause.driverId = driverId
    }

    // Role-based access control
    if (session.user.role === UserRole.CUSTOMER) {
      // Customers can only see tracking for their own trips
      const customerTrips = await db.trip.findMany({
        where: { customerId: session.user.id },
        select: { id: true }
      })
      
      const tripIds = customerTrips.map(trip => trip.id)
      whereClause.tripId = { in: tripIds }
    } else if (session.user.role === UserRole.DRIVER) {
      // Drivers can only see their own tracking logs
      whereClause.driverId = session.user.driverProfile?.id
    }
    // Admin and other roles can see all tracking logs

    const trackingLogs = await db.trackingLog.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            customer: {
              select: { id: true, name: true, email: true }
            },
            fromCity: true,
            toCity: true,
            vehicle: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: limit
    })

    return NextResponse.json(trackingLogs)
  } catch (error) {
    console.error("Error fetching tracking logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Add new tracking log (for drivers)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tripId, latitude, longitude, speed, heading } = body

    // Validate required fields
    if (!tripId || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: tripId, latitude, longitude" },
        { status: 400 }
      )
    }

    // Verify the trip belongs to this driver
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        driverId: session.user.driverProfile?.id,
        status: "IN_PROGRESS"
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or not assigned to this driver" },
        { status: 404 }
      )
    }

    // Create tracking log
    const trackingLog = await db.trackingLog.create({
      data: {
        tripId,
        driverId: session.user.driverProfile.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        timestamp: new Date()
      },
      include: {
        trip: {
          include: {
            customer: {
              select: { id: true, name: true, email: true }
            },
            fromCity: true,
            toCity: true
          }
        }
      }
    })

    // Emit real-time update via Socket.IO (we'll implement this later)
    // io.to(`trip-${tripId}`).emit('location-update', trackingLog)

    return NextResponse.json({
      message: "Tracking log created successfully",
      trackingLog
    })
  } catch (error) {
    console.error("Error creating tracking log:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
