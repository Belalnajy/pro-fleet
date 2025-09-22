import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { TripStatus } from "@prisma/client"

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tripId, status } = body

    if (!tripId || !status) {
      return NextResponse.json(
        { error: "Missing tripId or status" },
        { status: 400 }
      )
    }

    // Validate status
    if (!Object.values(TripStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Get driver profile
    const driverProfile = await db.driver.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!driverProfile) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    // Get the trip and verify it belongs to this driver
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.driverId !== driverProfile.id) {
      return NextResponse.json(
        { error: "Trip is not assigned to you" },
        { status: 403 }
      )
    }

    // Validate status transition
    const validTransitions: Record<TripStatus, TripStatus[]> = {
      [TripStatus.PENDING]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
      [TripStatus.IN_PROGRESS]: [TripStatus.DELIVERED, TripStatus.CANCELLED],
      [TripStatus.DELIVERED]: [], // Final state
      [TripStatus.CANCELLED]: [], // Final state
    }

    if (!validTransitions[trip.status].includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${trip.status} to ${status}` },
        { status: 400 }
      )
    }

    // Update trip status
    const updateData: any = {
      status: status,
    }

    // Set timestamps based on status
    if (status === TripStatus.IN_PROGRESS && !trip.actualStartDate) {
      updateData.actualStartDate = new Date()
    } else if (status === TripStatus.DELIVERED) {
      updateData.deliveredDate = new Date()
    }

    const updatedTrip = await db.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        fromCity: {
          select: {
            name: true
          }
        },
        toCity: {
          select: {
            name: true
          }
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
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true
          }
        }
      }
    })

    console.log(`Trip ${tripId} status updated to ${status} by driver ${driverProfile.id}`)

    // TODO: Send notification to customer about status change
    // This could be email, SMS, or push notification

    return NextResponse.json({ 
      message: "Trip status updated successfully",
      trip: updatedTrip
    })

  } catch (error) {
    console.error("Error updating trip status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
