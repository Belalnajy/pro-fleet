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

    // Get the trip with cities
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        fromCity: {
          select: {
            id: true,
            name: true
          }
        },
        toCity: {
          select: {
            id: true,
            name: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        vehicle: {
          select: {
            type: true,
            capacity: true
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

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.driverId !== driverProfile.id) {
      return NextResponse.json(
        { error: "Trip is not assigned to you" },
        { status: 403 }
      )
    }

    // Generate simulated route points between start and end
    // Using default coordinates for Saudi cities
    const cityCoordinates: Record<string, {lat: number, lng: number}> = {
      'الرياض': { lat: 24.7136, lng: 46.6753 },
      'جدة': { lat: 21.3891, lng: 39.8579 },
      'مكة': { lat: 21.3891, lng: 39.8579 },
      'المدينة': { lat: 24.5247, lng: 39.5692 },
      'الدمام': { lat: 26.4207, lng: 50.0888 },
      'تبوك': { lat: 28.3998, lng: 36.5700 }
    }
    
    const startCoords = cityCoordinates[trip.fromCity.name] || { lat: 24.7136, lng: 46.6753 }
    const endCoords = cityCoordinates[trip.toCity.name] || { lat: 21.3891, lng: 39.8579 }
    
    const startLat = startCoords.lat
    const startLng = startCoords.lng
    const endLat = endCoords.lat
    const endLng = endCoords.lng

    // Generate intermediate points for the route (simulated path)
    const routePoints = generateRoutePoints(startLat, startLng, endLat, endLng, trip.status)

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
          name: trip.fromCity.name,
          type: 'start'
        },
        endPoint: {
          latitude: endLat,
          longitude: endLng,
          name: trip.toCity.name,
          type: 'end'
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

// Generate simulated route points between start and end
function generateRoutePoints(
  startLat: number, 
  startLng: number, 
  endLat: number, 
  endLng: number,
  status: string
): Array<{
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  type: 'tracking' | 'current';
}> {
  const points: Array<{
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
    type: 'tracking' | 'current';
  }> = []
  const numPoints = 10 // Number of intermediate points
  
  // Calculate the progress based on trip status
  let progress = 0
  if (status === 'IN_PROGRESS') {
    progress = Math.random() * 0.8 + 0.1 // 10% to 90% progress
  } else if (status === 'DELIVERED') {
    progress = 1 // 100% complete
  }
  
  const currentTime = new Date()
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints
    
    // Linear interpolation between start and end points
    const lat = startLat + (endLat - startLat) * ratio
    const lng = startLng + (endLng - startLng) * ratio
    
    // Add some randomness to make it look more realistic
    const randomLat = lat + (Math.random() - 0.5) * 0.01
    const randomLng = lng + (Math.random() - 0.5) * 0.01
    
    // Only add points up to current progress
    if (ratio <= progress) {
      const pointTime = new Date(currentTime.getTime() - (numPoints - i) * 10 * 60 * 1000) // 10 minutes apart
      
      points.push({
        id: `point-${i}`,
        latitude: randomLat,
        longitude: randomLng,
        timestamp: pointTime.toISOString(),
        speed: Math.random() * 20 + 40, // 40-60 km/h
        heading: calculateBearing(
          i > 0 ? points[i-1].latitude : startLat,
          i > 0 ? points[i-1].longitude : startLng,
          randomLat,
          randomLng
        ),
        type: i === Math.floor(progress * numPoints) ? 'current' : 'tracking'
      })
    }
  }
  
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
