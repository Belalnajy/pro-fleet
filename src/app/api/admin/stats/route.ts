import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current date ranges
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Get total trips
    const totalTrips = await db.trip.count()
    
    // Get active trips (IN_PROGRESS status)
    const activeTrips = await db.trip.count({
      where: {
        status: "IN_PROGRESS"
      }
    })

    // Get active drivers (users with DRIVER role who are active)
    const activeDrivers = await db.user.count({
      where: {
        role: "DRIVER",
        isActive: true
      }
    })

    // Get today's revenue from completed trips
    const todayRevenue = await db.trip.aggregate({
      where: {
        status: "DELIVERED",
        deliveredDate: {
          gte: todayStart
        }
      },
      _sum: {
        price: true
      }
    })

    // Get monthly revenue
    const monthlyRevenue = await db.trip.aggregate({
      where: {
        status: "DELIVERED",
        deliveredDate: {
          gte: monthStart
        }
      },
      _sum: {
        price: true
      }
    })

    // Get yearly revenue
    const yearlyRevenue = await db.trip.aggregate({
      where: {
        status: "DELIVERED",
        deliveredDate: {
          gte: yearStart
        }
      },
      _sum: {
        price: true
      }
    })

    // Get total expenses (this would need an expenses table in real app)
    // For now, we'll calculate as a percentage of revenue
    const totalExpenses = (yearlyRevenue._sum.price || 0) * 0.3 // 30% of revenue as expenses

    // Get total users
    const totalUsers = await db.user.count()

    // Get total vehicles
    const totalVehicles = await db.vehicle.count()

    // Get pending invoices (this would need an invoices table in real app)
    // For now, we'll use trips that are delivered but not yet invoiced
    const pendingInvoices = await db.trip.count({
      where: {
        status: "DELIVERED",
        // In a real app, you'd check if invoice exists for this trip
      }
    })

    const stats = {
      totalTrips,
      activeTrips,
      activeDrivers,
      todayRevenue: todayRevenue._sum.price || 0,
      monthlyRevenue: monthlyRevenue._sum.price || 0,
      yearlyRevenue: yearlyRevenue._sum.price || 0,
      totalExpenses: Math.round(totalExpenses),
      totalUsers,
      totalVehicles,
      pendingInvoices: Math.min(pendingInvoices, 15), // Cap at 15 for demo
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
