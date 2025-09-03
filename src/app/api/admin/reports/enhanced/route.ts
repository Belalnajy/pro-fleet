import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "month"

    // Get trips data
    const trips = await db.trip.findMany({
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        driver: {
          select: {
            name: true,
            email: true
          }
        },
        vehicle: {
          select: {
            plateNumber: true,
            type: true
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "quarter":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    const filteredTrips = trips.filter(trip => 
      new Date(trip.createdAt) >= startDate
    )

    // Enhanced Monthly Revenue with Profit Analysis
    const monthlyData = new Map()
    filteredTrips.forEach(trip => {
      const month = new Date(trip.createdAt).toISOString().slice(0, 7)
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          month,
          revenue: 0,
          trips: 0,
          expenses: 0,
          profit: 0,
          avgOrderValue: 0
        })
      }
      const data = monthlyData.get(month)
      data.revenue += trip.price
      data.trips += 1
      data.expenses += trip.price * 0.7 // Assume 70% expenses
      data.profit = data.revenue - data.expenses
      data.avgOrderValue = data.revenue / data.trips
    })

    const monthlyRevenue = Array.from(monthlyData.values()).sort((a, b) => 
      a.month.localeCompare(b.month)
    )

    // Enhanced City Statistics with Performance Metrics
    const cityData = new Map()
    filteredTrips.forEach(trip => {
      const cityPair = `${trip.fromCity.name} → ${trip.toCity.name}`
      if (!cityData.has(cityPair)) {
        cityData.set(cityPair, {
          route: cityPair,
          trips: 0,
          revenue: 0,
          avgPrice: 0,
          popularity: 0
        })
      }
      const data = cityData.get(cityPair)
      data.trips += 1
      data.revenue += trip.price
      data.avgPrice = data.revenue / data.trips
    })

    // Calculate popularity score
    const totalTrips = filteredTrips.length
    cityData.forEach(data => {
      data.popularity = (data.trips / totalTrips) * 100
    })

    const topRoutes = Array.from(cityData.values())
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10)

    // Driver Performance Analysis
    const driverData = new Map()
    filteredTrips.filter(trip => trip.driver).forEach(trip => {
      const driverName = trip.driver!.name
      if (!driverData.has(driverName)) {
        driverData.set(driverName, {
          driver: driverName,
          trips: 0,
          revenue: 0,
          rating: 4.2 + Math.random() * 0.8, // Mock rating
          efficiency: 0
        })
      }
      const data = driverData.get(driverName)
      data.trips += 1
      data.revenue += trip.price
      data.efficiency = data.revenue / data.trips
    })

    const driverPerformance = Array.from(driverData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Vehicle Type Analysis
    const vehicleData = new Map()
    filteredTrips.filter(trip => trip.vehicle).forEach(trip => {
      const vehicleType = trip.vehicle!.type || 'Unknown'
      if (!vehicleData.has(vehicleType)) {
        vehicleData.set(vehicleType, {
          type: vehicleType,
          usage: 0,
          revenue: 0,
          efficiency: 0
        })
      }
      const data = vehicleData.get(vehicleType)
      data.usage += 1
      data.revenue += trip.price
      data.efficiency = data.revenue / data.usage
    })

    const vehicleTypeStats = Array.from(vehicleData.values())

    // Customer Analysis
    const customerData = new Map()
    filteredTrips.forEach(trip => {
      const customerName = trip.customer.name
      if (!customerData.has(customerName)) {
        customerData.set(customerName, {
          customer: customerName,
          trips: 0,
          revenue: 0,
          avgOrderValue: 0
        })
      }
      const data = customerData.get(customerName)
      data.trips += 1
      data.revenue += trip.price
      data.avgOrderValue = data.revenue / data.trips
    })

    const customerStats = Array.from(customerData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15)

    // Daily Statistics for Trend Analysis
    const dailyData = new Map()
    const last30Days = Array.from({length: 30}, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().slice(0, 10)
    }).reverse()

    last30Days.forEach(date => {
      dailyData.set(date, {
        date,
        trips: 0,
        revenue: 0,
        newCustomers: 0
      })
    })

    filteredTrips.forEach(trip => {
      const date = trip.createdAt.toISOString().slice(0, 10)
      if (dailyData.has(date)) {
        const data = dailyData.get(date)
        data.trips += 1
        data.revenue += trip.price
      }
    })

    const dailyStats = Array.from(dailyData.values())

    // Performance Metrics
    const totalRevenue = filteredTrips.reduce((sum, trip) => sum + trip.price, 0)
    const totalTripsCount = filteredTrips.length
    const avgOrderValue = totalTripsCount > 0 ? totalRevenue / totalTripsCount : 0
    
    // Mock additional metrics
    const customerRetention = 75.5 // Mock percentage
    const profitMargin = 25.8 // Mock percentage
    const growthRate = 12.3 // Mock percentage

    const performanceMetrics = {
      totalRevenue,
      totalTrips: totalTripsCount,
      avgOrderValue,
      customerRetention,
      profitMargin,
      growthRate
    }

    const enhancedReportData = {
      monthlyRevenue,
      cityStats: topRoutes,
      vehicleTypeStats,
      customerStats,
      dailyStats,
      performanceMetrics,
      topRoutes,
      driverPerformance
    }

    return NextResponse.json(enhancedReportData)
  } catch (error) {
    console.error("Error fetching enhanced report data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
