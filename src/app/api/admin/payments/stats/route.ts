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

    // Get completed trips to calculate payment stats
    const completedTrips = await db.trip.findMany({
      where: {
        status: "DELIVERED"
      },
      select: {
        price: true,
        currency: true,
        deliveredDate: true,
        createdAt: true,
      }
    })

    // Calculate basic stats
    const totalPayments = completedTrips.length
    const totalAmount = completedTrips.reduce((sum, trip) => sum + trip.price, 0)

    // Simulate different payment statuses for demo
    const pendingAmount = totalAmount * 0.15 // 15% pending
    const completedAmount = totalAmount * 0.75 // 75% completed
    const failedAmount = totalAmount * 0.05 // 5% failed
    const refundedAmount = totalAmount * 0.05 // 5% refunded

    // Calculate today's payments
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTrips = completedTrips.filter(trip => {
      const tripDate = new Date(trip.deliveredDate || trip.createdAt)
      return tripDate >= today
    })
    
    const todayPayments = todayTrips.length
    const todayAmount = todayTrips.reduce((sum, trip) => sum + trip.price, 0)

    // Calculate monthly growth (mock calculation)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const lastMonth = new Date(currentMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const currentMonthTrips = completedTrips.filter(trip => {
      const tripDate = new Date(trip.deliveredDate || trip.createdAt)
      return tripDate >= currentMonth
    })
    
    const lastMonthTrips = completedTrips.filter(trip => {
      const tripDate = new Date(trip.deliveredDate || trip.createdAt)
      return tripDate >= lastMonth && tripDate < currentMonth
    })
    
    const currentMonthAmount = currentMonthTrips.reduce((sum, trip) => sum + trip.price, 0)
    const lastMonthAmount = lastMonthTrips.reduce((sum, trip) => sum + trip.price, 0)
    
    const monthlyGrowth = lastMonthAmount > 0 
      ? ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 
      : 0

    const stats = {
      totalPayments,
      totalAmount,
      pendingAmount,
      completedAmount,
      failedAmount,
      refundedAmount,
      todayPayments,
      todayAmount,
      monthlyGrowth,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching payment stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
