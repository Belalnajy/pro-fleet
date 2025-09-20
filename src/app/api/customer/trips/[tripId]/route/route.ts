import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = params

    // Get the trip and verify it belongs to the customer
    const trip = await db.trip.findFirst({
      where: { 
        id: tripId,
        customerId: session.user.id // Ensure customer can only see their own trips
      },
      include: {
        fromCity: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            latitude: true,
            longitude: true
          }
        },
        toCity: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            latitude: true,
            longitude: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        vehicle: {
          include: {
            vehicleType: {
              select: {
                id: true,
                name: true,
                nameAr: true
              }
            }
          }
        },
        temperature: {
          select: {
            id: true,
            option: true,
            value: true,
            unit: true
          }
        },
        trackingLogs: {
          orderBy: { timestamp: "asc" }, // Oldest first for route display
          take: 15 // Limit to 15 points to reduce map clutter
        }
      }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // City coordinates mapping (fallback if database doesn't have coordinates)
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'الرياض': { lat: 24.7136, lng: 46.6753 },
      'جدة': { lat: 21.3891, lng: 39.8579 },
      'مكة المكرمة': { lat: 21.4225, lng: 39.8262 },
      'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
      'الدمام': { lat: 26.4207, lng: 50.0888 },
      'تبوك': { lat: 28.3998, lng: 36.5700 },
      'أبها': { lat: 18.2164, lng: 42.5053 },
      'الطائف': { lat: 21.2703, lng: 40.4178 },
      'بريدة': { lat: 26.3260, lng: 43.9750 },
      'خميس مشيط': { lat: 18.3000, lng: 42.7300 }
    }

    // Get start and end coordinates
    const startCoords = trip.fromCity.latitude && trip.fromCity.longitude 
      ? { lat: trip.fromCity.latitude, lng: trip.fromCity.longitude }
      : cityCoordinates[trip.fromCity.nameAr || ''] || cityCoordinates[trip.fromCity.name || ''] || { lat: 24.7136, lng: 46.6753 }

    const endCoords = trip.toCity.latitude && trip.toCity.longitude
      ? { lat: trip.toCity.latitude, lng: trip.toCity.longitude }
      : cityCoordinates[trip.toCity.nameAr || ''] || cityCoordinates[trip.toCity.name || ''] || { lat: 21.3891, lng: 39.8579 }

    // Generate route points using real tracking data and simulated route
    const routePoints = generateRoutePoints(
      startCoords.lat,
      startCoords.lng,
      endCoords.lat,
      endCoords.lng,
      trip.status,
      trip.trackingLogs
    )

    // Calculate distance and duration
    const distance = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng)
    const estimatedDuration = calculateDuration(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng)

    const response = {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      status: trip.status,
      route: {
        start: {
          name: trip.fromCity.name,
          nameAr: trip.fromCity.nameAr,
          coordinates: startCoords,
          type: 'start' as const
        },
        end: {
          name: trip.toCity.name,
          nameAr: trip.toCity.nameAr,
          coordinates: endCoords,
          type: 'end' as const
        },
        distance: Math.round(distance),
        estimatedDuration: Math.round(estimatedDuration * 60), // Convert to minutes
        points: routePoints
      },
      driver: trip.driver ? {
        id: trip.driver.id,
        name: trip.driver.user.name,
        phone: trip.driver.user.phone,
        trackingEnabled: trip.driver.trackingEnabled
      } : null,
      vehicle: trip.vehicle ? {
        type: trip.vehicle.vehicleType?.nameAr || trip.vehicle.vehicleType?.name || 'غير محدد',
        capacity: trip.vehicle.capacity
      } : null,
      temperature: trip.temperature ? {
        name: trip.temperature.option,
        value: trip.temperature.value,
        unit: trip.temperature.unit
      } : null,
      dates: {
        scheduled: trip.scheduledDate,
        actualStart: trip.actualStartDate,
        delivered: trip.deliveredDate
      },
      lastUpdate: trip.trackingLogs[trip.trackingLogs.length - 1]?.timestamp || null
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Error fetching customer route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Generate route points with real tracking data only
function generateRoutePoints(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number,
  status: string,
  trackingLogs: any[]
): Array<{
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  type: 'start' | 'end' | 'tracking' | 'current';
}> {
  const points: Array<{
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
    type: 'start' | 'end' | 'tracking' | 'current';
  }> = []

  // Add start point
  points.push({
    id: 'start',
    latitude: startLat,
    longitude: startLng,
    timestamp: new Date().toISOString(),
    type: 'start' as const
  })

  // Add real tracking points if available
  if (trackingLogs && trackingLogs.length > 0) {
    // Add historical tracking points (all except the last one)
    trackingLogs.slice(0, -1).forEach((log, index) => {
      points.push({
        id: `tracking-${index}`,
        latitude: log.latitude,
        longitude: log.longitude,
        timestamp: log.timestamp,
        speed: log.speed,
        heading: log.heading,
        type: 'tracking' as const
      })
    })

    // Add current location (last tracking point)
    const lastLog = trackingLogs[trackingLogs.length - 1]
    points.push({
      id: 'current',
      latitude: lastLog.latitude,
      longitude: lastLog.longitude,
      timestamp: lastLog.timestamp,
      speed: lastLog.speed,
      heading: lastLog.heading,
      type: 'current' as const
    })
  }

  // Add end point
  points.push({
    id: 'end',
    latitude: endLat,
    longitude: endLng,
    timestamp: new Date().toISOString(),
    type: 'end' as const
  })

  return points
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate estimated duration in hours
function calculateDuration(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const distance = calculateDistance(lat1, lng1, lat2, lng2)
  const averageSpeed = 80 // km/h
  return distance / averageSpeed
}
