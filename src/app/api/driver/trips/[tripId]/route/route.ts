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
    
    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId } = params

    // Get driver profile
    const driverProfile = await db.driver.findFirst({
      where: {
        userId: session.user.id
      }
    })

    if (!driverProfile) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    // Get the trip with cities and notes (which may contain location data)
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        fromCity: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true
          }
        },
        toCity: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        vehicle: {
          include: {
            vehicleType: true
          }
        },
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true
          }
        },
        trackingLogs: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // Limit to last 10 tracking points only
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

    // Extract coordinates from multiple sources:
    // 1. Location data from trip notes (if trip was created with location picker)
    // 2. City coordinates from database (if available)
    // 3. Fallback to hardcoded coordinates
    
    let startLat: number, startLng: number, endLat: number, endLng: number
    let startLocationName = trip.fromCity.name
    let endLocationName = trip.toCity.name
    
    // Try to extract location data from trip notes
    let locationData: { origin?: { lat: number, lng: number, name?: string }, destination?: { lat: number, lng: number, name?: string } } | null = null
    
    if (trip.notes) {
      try {
        // Look for "Location Data:" in notes
        const locationMatch = trip.notes.match(/Location Data: ({.*})/)
        if (locationMatch) {
          locationData = JSON.parse(locationMatch[1])
        }
      } catch (error) {
        console.log("Could not parse location data from notes:", error)
      }
    }
    
    // Set start coordinates
    if (locationData?.origin) {
      startLat = locationData.origin.lat
      startLng = locationData.origin.lng
      if (locationData.origin.name) {
        startLocationName = locationData.origin.name
      }
    } else if (trip.fromCity.latitude && trip.fromCity.longitude) {
      // Use coordinates from database
      startLat = trip.fromCity.latitude
      startLng = trip.fromCity.longitude
    } else {
      // Fallback to hardcoded coordinates
      const cityCoordinates: Record<string, {lat: number, lng: number}> = {
        'Riyadh': { lat: 24.7136, lng: 46.6753 },
        'Jeddah': { lat: 21.3891, lng: 39.8579 },
        'Mecca': { lat: 21.3891, lng: 39.8579 },
        'Medina': { lat: 24.5247, lng: 39.5692 },
        'Dammam': { lat: 26.4207, lng: 50.0888 },
        'Tabuk': { lat: 28.3998, lng: 36.5700 },
        'الرياض': { lat: 24.7136, lng: 46.6753 },
        'جدة': { lat: 21.3891, lng: 39.8579 },
        'مكة': { lat: 21.3891, lng: 39.8579 },
        'المدينة': { lat: 24.5247, lng: 39.5692 },
        'الدمام': { lat: 26.4207, lng: 50.0888 },
        'تبوك': { lat: 28.3998, lng: 36.5700 }
      }
      const startCoords = cityCoordinates[trip.fromCity.name] || { lat: 24.7136, lng: 46.6753 }
      startLat = startCoords.lat
      startLng = startCoords.lng
    }
    
    // Set end coordinates
    if (locationData?.destination) {
      endLat = locationData.destination.lat
      endLng = locationData.destination.lng
      if (locationData.destination.name) {
        endLocationName = locationData.destination.name
      }
    } else if (trip.toCity.latitude && trip.toCity.longitude) {
      // Use coordinates from database
      endLat = trip.toCity.latitude
      endLng = trip.toCity.longitude
    } else {
      // Fallback to hardcoded coordinates
      const cityCoordinates: Record<string, {lat: number, lng: number}> = {
        'Riyadh': { lat: 24.7136, lng: 46.6753 },
        'Jeddah': { lat: 21.3891, lng: 39.8579 },
        'Mecca': { lat: 21.3891, lng: 39.8579 },
        'Medina': { lat: 24.5247, lng: 39.5692 },
        'Dammam': { lat: 26.4207, lng: 50.0888 },
        'Tabuk': { lat: 28.3998, lng: 36.5700 },
        'الرياض': { lat: 24.7136, lng: 46.6753 },
        'جدة': { lat: 21.3891, lng: 39.8579 },
        'مكة': { lat: 21.3891, lng: 39.8579 },
        'المدينة': { lat: 24.5247, lng: 39.5692 },
        'الدمام': { lat: 26.4207, lng: 50.0888 },
        'تبوك': { lat: 28.3998, lng: 36.5700 }
      }
      const endCoords = cityCoordinates[trip.toCity.name] || { lat: 21.3891, lng: 39.8579 }
      endLat = endCoords.lat
      endLng = endCoords.lng
    }

    // Generate route points with real tracking data
    const routePoints = generateRoutePoints(startLat, startLng, endLat, endLng, trip.status, trip.trackingLogs)

    return NextResponse.json({
      trip: {
        id: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        fromCity: trip.fromCity,
        toCity: trip.toCity,
        customer: trip.customer,
        vehicle: trip.vehicle,
        temperature: trip.temperature,
        price: trip.price,
        scheduledDate: trip.scheduledDate,
        actualStartDate: trip.actualStartDate,
        deliveredDate: trip.deliveredDate
      },
      route: {
        startPoint: {
          latitude: startLat,
          longitude: startLng,
          name: startLocationName,
          type: 'start',
          isCustomLocation: !!locationData?.origin
        },
        endPoint: {
          latitude: endLat,
          longitude: endLng,
          name: endLocationName,
          type: 'end',
          isCustomLocation: !!locationData?.destination
        },
        trackingPoints: routePoints,
        totalDistance: calculateDistance(startLat, startLng, endLat, endLng),
        estimatedDuration: calculateDuration(startLat, startLng, endLat, endLng)
      }
    })

  } catch (error) {
    console.error("Error fetching trip route:", error)
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

  // Always add start point (origin city)
  points.push({
    id: 'start',
    latitude: startLat,
    longitude: startLng,
    timestamp: new Date().toISOString(),
    type: 'start'
  })

  // Add real tracking points only (no simulation)
  if (trackingLogs && trackingLogs.length > 0) {
    // Sort tracking logs by timestamp (oldest first)
    const sortedLogs = [...trackingLogs].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    sortedLogs.forEach((log, index) => {
      points.push({
        id: log.id,
        latitude: log.latitude,
        longitude: log.longitude,
        timestamp: log.timestamp,
        speed: log.speed,
        heading: log.heading,
        // The last tracking point is the current location
        type: index === sortedLogs.length - 1 ? 'current' : 'tracking'
      })
    })
  }

  // Always add end point (destination city)
  points.push({
    id: 'end',
    latitude: endLat,
    longitude: endLng,
    timestamp: new Date().toISOString(),
    type: 'end'
  })

  return points
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Calculate estimated duration in hours
function calculateDuration(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const distance = calculateDistance(lat1, lng1, lat2, lng2)
  const averageSpeed = 50 // km/h
  return distance / averageSpeed
}

// Calculate bearing between two points
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  
  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}
