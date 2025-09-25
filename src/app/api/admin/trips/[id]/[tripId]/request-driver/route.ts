import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = params
    const { driverId } = await request.json()

    // Get trip details
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        fromCity: true,
        toCity: true,
        customer: true
      }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Get driver details
    const driver = await db.driver.findUnique({
      where: { id: driverId },
      include: {
        user: true
      }
    })

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Check if request already exists
    const existingRequest = await db.tripRequest.findUnique({
      where: {
        tripId_driverId: {
          tripId,
          driverId
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: "Request already sent to this driver" }, { status: 400 })
    }

    // Create trip request (expires in 15 minutes)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    const tripRequest = await db.tripRequest.create({
      data: {
        tripId,
        driverId,
        expiresAt
      }
    })

    // Update trip status
    await db.trip.update({
      where: { id: tripId },
      data: { status: 'DRIVER_REQUESTED' }
    })

    // Create notification for driver
    await createNotification({
      userId: driver.userId,
      type: 'TRIP_REQUEST_RECEIVED',
      title: `طلب رحلة جديدة ${trip.tripNumber}`,
      message: `من ${trip.fromCity.name} إلى ${trip.toCity.name} - ${trip.price} ${trip.currency}`,
      data: {
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        requestId: tripRequest.id,
        expiresAt: expiresAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Trip request sent to driver",
      request: tripRequest
    })

  } catch (error) {
    console.error("Error sending trip request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
