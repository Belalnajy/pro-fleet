import { db } from "@/lib/db"
import { createNotification } from "@/lib/notifications"

export async function autoAssignDriversToTrip(tripId: string) {
  try {
    console.log(`🚛 Auto-assigning drivers to trip: ${tripId}`)

    // Get trip details
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        fromCity: true,
        toCity: true,
        customer: true,
        vehicle: {
          include: {
            vehicleType: true
          }
        }
      }
    })

    if (!trip) {
      console.log(`❌ Trip ${tripId} not found`)
      return { success: false, error: "Trip not found" }
    }

    // Find available drivers with matching vehicle type
    const availableDrivers = await db.driver.findMany({
      where: {
        isAvailable: true,
        vehicleTypes: {
          some: {
            vehicleTypeId: trip.vehicle.vehicleTypeId
          }
        }
      },
      include: {
        user: true,
        vehicleTypes: {
          include: {
            vehicleType: true
          }
        }
      }
    })

    if (availableDrivers.length === 0) {
      console.log(`⚠️ No available drivers found for trip ${tripId}`)
      return { success: false, error: "No available drivers found" }
    }

    console.log(`👥 Found ${availableDrivers.length} available drivers`)

    // Create trip requests for all available drivers
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // 15 minutes to respond

    const tripRequests = []
    const notifications = []

    for (const driver of availableDrivers) {
      // Check if request already exists
      const existingRequest = await db.tripRequest.findUnique({
        where: {
          tripId_driverId: {
            tripId,
            driverId: driver.id
          }
        }
      })

      if (!existingRequest) {
        // Create trip request
        const tripRequest = await db.tripRequest.create({
          data: {
            tripId,
            driverId: driver.id,
            expiresAt
          }
        })

        tripRequests.push(tripRequest)

        // Create notification for driver
        const notification = await createNotification({
          userId: driver.userId,
          type: 'TRIP_REQUEST_RECEIVED',
          title: `طلب رحلة جديدة ${trip.tripNumber}`,
          message: `من ${trip.fromCity.name} إلى ${trip.toCity.name} - ${trip.price} ${trip.currency}`,
          data: {
            tripId: trip.id,
            tripNumber: trip.tripNumber,
            requestId: tripRequest.id,
            expiresAt: expiresAt.toISOString(),
            fromCity: trip.fromCity.name,
            toCity: trip.toCity.name,
            price: trip.price,
            currency: trip.currency
          }
        })

        notifications.push(notification)

        console.log(`✅ Sent request to driver: ${driver.user.name}`)
      } else {
        console.log(`⚠️ Request already exists for driver: ${driver.user.name}`)
      }
    }

    // Update trip status
    await db.trip.update({
      where: { id: tripId },
      data: { status: 'DRIVER_REQUESTED' }
    })

    console.log(`🎉 Successfully sent ${tripRequests.length} trip requests`)

    return {
      success: true,
      message: `Trip requests sent to ${tripRequests.length} drivers`,
      requestsSent: tripRequests.length,
      driversNotified: availableDrivers.map(d => d.user.name)
    }

  } catch (error) {
    console.error("Error auto-assigning drivers:", error)
    return {
      success: false,
      error: "Failed to auto-assign drivers"
    }
  }
}

export async function expireOldTripRequests() {
  try {
    console.log("🕐 Checking for expired trip requests...")

    const now = new Date()

    // Find expired requests
    const expiredRequests = await db.tripRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now
        }
      },
      include: {
        trip: true,
        driver: {
          include: { user: true }
        }
      }
    })

    if (expiredRequests.length === 0) {
      console.log("✅ No expired requests found")
      return { expiredCount: 0 }
    }

    // Update expired requests
    await db.tripRequest.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: 'EXPIRED',
        respondedAt: now
      }
    })

    // Create notifications for expired requests
    for (const request of expiredRequests) {
      await createNotification({
        userId: request.driver.userId,
        type: 'TRIP_REQUEST_EXPIRED',
        title: `انتهت صلاحية طلب الرحلة ${request.trip.tripNumber}`,
        message: `لم تتم الاستجابة للطلب في الوقت المحدد`,
        data: {
          tripId: request.tripId,
          tripNumber: request.trip.tripNumber,
          requestId: request.id
        }
      })
    }

    console.log(`⏰ Expired ${expiredRequests.length} trip requests`)

    return { expiredCount: expiredRequests.length }

  } catch (error) {
    console.error("Error expiring trip requests:", error)
    return { expiredCount: 0, error: error.message }
  }
}
