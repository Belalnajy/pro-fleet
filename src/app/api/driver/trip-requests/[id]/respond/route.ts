import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotification, createDriverResponseNotification } from "@/lib/notifications"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requestId = params.id
    const { action, notes } = await request.json() // action: 'accept' or 'reject'

    // Get driver profile
    const driver = await db.driver.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!driver) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    // Get trip request
    const tripRequest = await db.tripRequest.findUnique({
      where: { id: requestId },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        },
        driver: {
          include: { user: true }
        }
      }
    })

    if (!tripRequest) {
      return NextResponse.json({ error: "Trip request not found" }, { status: 404 })
    }

    // Check if request belongs to this driver
    if (tripRequest.driverId !== driver.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if request is still pending
    if (tripRequest.status !== 'PENDING') {
      return NextResponse.json({ error: "Request already responded to" }, { status: 400 })
    }

    // Check if request has expired
    if (new Date() > tripRequest.expiresAt) {
      await db.tripRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json({ error: "Request has expired" }, { status: 400 })
    }

    const accepted = action === 'accept'
    const now = new Date()

    // Update trip request
    await db.tripRequest.update({
      where: { id: requestId },
      data: {
        status: accepted ? 'ACCEPTED' : 'REJECTED',
        respondedAt: now,
        notes
      }
    })

    if (accepted) {
      // Accept: Assign driver to trip
      await db.trip.update({
        where: { id: tripRequest.tripId },
        data: {
          driverId: driver.id,
          status: 'DRIVER_ACCEPTED',
          assignedAt: now
        }
      })

      // Reject all other pending requests for this trip
      await db.tripRequest.updateMany({
        where: {
          tripId: tripRequest.tripId,
          id: { not: requestId },
          status: 'PENDING'
        },
        data: {
          status: 'EXPIRED',
          respondedAt: now
        }
      })
    } else {
      // Reject: Update trip status
      await db.trip.update({
        where: { id: tripRequest.tripId },
        data: { status: 'DRIVER_REJECTED' }
      })
    }

    // Create notification for customer
    await createDriverResponseNotification(
      tripRequest.trip.customerId,
      tripRequest.trip.tripNumber,
      driver.user.name,
      accepted,
      tripRequest.tripId
    )

    return NextResponse.json({
      success: true,
      message: accepted ? "Trip request accepted" : "Trip request rejected",
      action,
      tripRequest
    })

  } catch (error) {
    console.error("Error responding to trip request:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
