import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST - إرسال موقع GPS الحالي للسائق
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tripId, latitude, longitude, speed, heading } = body

    if (!tripId || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: tripId, latitude, longitude" },
        { status: 400 }
      )
    }

    // التحقق من وجود السائق
    const driverProfile = await db.driver.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!driverProfile) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    // التحقق من أن الرحلة تنتمي للسائق وأنها نشطة
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        driverId: driverProfile.id,
        status: "IN_PROGRESS"
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or not active for this driver" },
        { status: 404 }
      )
    }

    // حفظ بيانات التتبع في قاعدة البيانات
    const trackingLog = await db.trackingLog.create({
      data: {
        tripId: tripId,
        driverId: driverProfile.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        timestamp: new Date()
      }
    })

    // تحديث حالة التتبع للسائق
    await db.driver.update({
      where: { id: driverProfile.id },
      data: {
        trackingEnabled: true,
        currentLocation: `${parseFloat(latitude)},${parseFloat(longitude)}`
      }
    })

    console.log(`GPS location saved for driver ${driverProfile.id} on trip ${tripId}:`, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed,
      heading
    })

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      trackingLog: {
        id: trackingLog.id,
        latitude: trackingLog.latitude,
        longitude: trackingLog.longitude,
        speed: trackingLog.speed,
        heading: trackingLog.heading,
        timestamp: trackingLog.timestamp
      }
    })

  } catch (error) {
    console.error("Error saving GPS location:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - جلب آخر مواقع التتبع للسائق
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json(
        { error: "Missing tripId parameter" },
        { status: 400 }
      )
    }

    // التحقق من وجود السائق
    const driverProfile = await db.driver.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!driverProfile) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    // التحقق من أن الرحلة تنتمي للسائق
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        driverId: driverProfile.id
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found for this driver" },
        { status: 404 }
      )
    }

    // جلب آخر 50 نقطة تتبع للرحلة
    const trackingLogs = await db.trackingLog.findMany({
      where: {
        tripId: tripId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      tripId,
      trackingLogs: trackingLogs.map(log => ({
        id: log.id,
        latitude: log.latitude,
        longitude: log.longitude,
        speed: log.speed,
        heading: log.heading,
        timestamp: log.timestamp
      }))
    })

  } catch (error) {
    console.error("Error fetching tracking logs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
