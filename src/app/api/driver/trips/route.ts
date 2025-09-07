import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Get trips assigned to this driver or available for assignment
    const trips = await db.trip.findMany({
      where: {
        OR: [
          { driverId: driverProfile.id }, // Trips assigned to this driver
          { driverId: null, status: "PENDING" } // Available trips
        ]
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        driver: {
          select: {
            carPlateNumber: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        vehicle: {
          select: {
            type: true,
            capacity: true
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
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true
          }
        }
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { scheduledDate: "asc" }
      ]
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error("Error fetching driver trips:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Accept or decline a trip
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tripId, action } = body // action: "accept" or "decline"

    if (!tripId || !action) {
      return NextResponse.json(
        { error: "Missing tripId or action" },
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

    // Get the trip
    const trip = await db.trip.findUnique({
      where: { id: tripId }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if trip is available for assignment
    if (trip.status !== "PENDING") {
      return NextResponse.json(
        { error: "Trip is not available for assignment" },
        { status: 400 }
      )
    }

    if (action === "accept") {
      // Assign trip to driver
      const updatedTrip = await db.trip.update({
        where: { id: tripId },
        data: {
          driverId: driverProfile.id,
          status: "IN_PROGRESS",
          actualStartDate: new Date()
        },
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
          }
        }
      })

      console.log(`Trip ${tripId} accepted by driver ${driverProfile.id}`)
      return NextResponse.json({ 
        message: "Trip accepted successfully",
        trip: updatedTrip
      })

    } else if (action === "decline") {
      // For now, we'll just log the decline
      // In a real system, you might want to track declined trips
      console.log(`Trip ${tripId} declined by driver ${driverProfile.id}`)
      
      return NextResponse.json({ 
        message: "Trip declined"
      })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'decline'" },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("Error updating trip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
