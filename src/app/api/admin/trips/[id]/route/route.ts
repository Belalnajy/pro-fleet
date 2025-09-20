import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: tripId } = params

    // Get the trip with all related data
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
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
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

    // Extract coordinates from multiple sources
    let startLat: number, startLng: number, endLat: number, endLng: number
    let startLocationName = trip.fromCity.name
    let endLocationName = trip.toCity.name
    
    // Try to extract location data from trip notes
    let locationData: { origin?: { lat: number, lng: number, name?: string }, destination?: { lat: number, lng: number, name?: string } } | null = null
    
    if (trip.notes) {
      try {
        const locationMatch = trip.notes.match(/Location Data: ({.*})/)
        if (locationMatch) {
          locationData = JSON.parse(locationMatch[1])
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    // Use location data from notes if available
    if (locationData?.origin) {
      startLat = locationData.origin.lat
      startLng = locationData.origin.lng
      if (locationData.origin.name) {
        startLocationName = locationData.origin.name
      }
    } else if (trip.fromCity.latitude && trip.fromCity.longitude) {
      // Use city coordinates from database
      startLat = trip.fromCity.latitude
      startLng = trip.fromCity.longitude
    } else {
      // Fallback to hardcoded coordinates for major Saudi cities
      const cityCoordinates: { [key: string]: [number, number] } = {
        'الرياض': [24.7136, 46.6753],
        'جدة': [21.3891, 39.8579],
        'مكة': [21.4225, 39.8262],
        'المدينة': [24.5247, 39.5692],
        'الدمام': [26.4207, 50.0888],
        'تبوك': [28.3998, 36.5700],
        'Riyadh': [24.7136, 46.6753],
        'Jeddah': [21.3891, 39.8579],
        'Mecca': [21.4225, 39.8262],
        'Medina': [24.5247, 39.5692],
        'Dammam': [26.4207, 50.0888],
        'Tabuk': [28.3998, 36.5700]
      }
      
      const startCoords = cityCoordinates[trip.fromCity.name] || [24.7136, 46.6753]
      startLat = startCoords[0]
      startLng = startCoords[1]
    }
    
    if (locationData?.destination) {
      endLat = locationData.destination.lat
      endLng = locationData.destination.lng
      if (locationData.destination.name) {
        endLocationName = locationData.destination.name
      }
    } else if (trip.toCity.latitude && trip.toCity.longitude) {
      endLat = trip.toCity.latitude
      endLng = trip.toCity.longitude
    } else {
      const cityCoordinates: { [key: string]: [number, number] } = {
        'الرياض': [24.7136, 46.6753],
        'جدة': [21.3891, 39.8579],
        'مكة': [21.4225, 39.8262],
        'المدينة': [24.5247, 39.5692],
        'الدمام': [26.4207, 50.0888],
        'تبوك': [28.3998, 36.5700],
        'Riyadh': [24.7136, 46.6753],
        'Jeddah': [21.3891, 39.8579],
        'Mecca': [21.4225, 39.8262],
        'Medina': [24.5247, 39.5692],
        'Dammam': [26.4207, 50.0888],
        'Tabuk': [28.3998, 36.5700]
      }
      
      const endCoords = cityCoordinates[trip.toCity.name] || [21.3891, 39.8579]
      endLat = endCoords[0]
      endLng = endCoords[1]
    }

    // Generate route points (combination of real tracking data and route simulation)
    const routePoints = generateRoutePoints(startLat, startLng, endLat, endLng, trip.status, trip.trackingLogs)

    const route = {
      id: `route-${trip.id}`,
      startPoint: {
        latitude: startLat,
        longitude: startLng,
        name: startLocationName,
        type: 'start' as const
      },
      endPoint: {
        latitude: endLat,
        longitude: endLng,
        name: endLocationName,
        type: 'end' as const
      },
      trackingPoints: routePoints,
      distance: calculateDistance(startLat, startLng, endLat, endLng),
      estimatedDuration: calculateDuration(startLat, startLng, endLat, endLng),
      status: trip.status,
      lastUpdate: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        fromCity: trip.fromCity.name,
        toCity: trip.toCity.name,
        customer: trip.customer,
        driver: trip.driver,
        vehicle: trip.vehicle,
        scheduledDate: trip.scheduledDate,
        actualStartDate: trip.actualStartDate,
        temperature: trip.temperature
      },
      route
    })

  } catch (error) {
    console.error("Error fetching admin route data:", error)
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
