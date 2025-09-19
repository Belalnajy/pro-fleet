import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const format = req.nextUrl.searchParams.get("format") || "excel"
    const range = req.nextUrl.searchParams.get("range") || "last30days"

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case "last7days":
        startDate.setDate(now.getDate() - 7)
        break
      case "last30days":
        startDate.setDate(now.getDate() - 30)
        break
      case "last3months":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "last90days":
        startDate.setDate(now.getDate() - 90)
        break
      case "last6months":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "lastyear":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get real trips data
    const trips = await db.trip.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
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
                name: true
              }
            }
          }
        },
        vehicle: {
          include: {
            vehicleType: {
              select: {
                name: true,
                capacity: true
              }
            }
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
            value: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    if (format === "excel") {
      // Create comprehensive CSV export
      const headers = [
        "Trip Number",
        "Customer",
        "Driver",
        "Route",
        "Vehicle Type",
        "Vehicle Capacity",
        "Temperature",
        "Status",
        "Price (SAR)",
        "Scheduled Date",
        "Start Date",
        "Delivery Date",
        "Created Date"
      ]
      
      const rows = trips.map(trip => [
        trip.tripNumber,
        trip.customer.name,
        trip.driver?.user?.name || "Unassigned",
        `${trip.fromCity.name} → ${trip.toCity.name}`,
        trip.vehicle?.vehicleType?.name || "Unknown",
        trip.vehicle?.vehicleType?.capacity || "Unknown",
        `${trip.temperature?.option || "Unknown"} (${trip.temperature?.value || 0}°C)`,
        trip.status,
        trip.price.toString(),
        trip.scheduledDate.toISOString().split('T')[0],
        trip.actualStartDate?.toISOString().split('T')[0] || "Not Started",
        trip.deliveredDate?.toISOString().split('T')[0] || "Not Delivered",
        trip.createdAt.toISOString().split('T')[0]
      ])
      
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
      
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=profleet-reports-${range}-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    }

    if (format === "pdf") {
      // Generate comprehensive PDF report content
      const totalRevenue = trips.reduce((sum, trip) => sum + trip.price, 0)
      const totalTrips = trips.length
      const avgOrderValue = totalTrips > 0 ? totalRevenue / totalTrips : 0
      
      const statusCounts = trips.reduce((acc, trip) => {
        acc[trip.status] = (acc[trip.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const topCustomers = trips.reduce((acc, trip) => {
        const customer = trip.customer.name
        if (!acc[customer]) {
          acc[customer] = { trips: 0, revenue: 0 }
        }
        acc[customer].trips += 1
        acc[customer].revenue += trip.price
        return acc
      }, {} as Record<string, { trips: number; revenue: number }>)
      
      const content = `ProFleet Reports - ${range.toUpperCase()}\n` +
        `Generated: ${new Date().toISOString()}\n\n` +
        `SUMMARY STATISTICS:\n` +
        `Total Revenue: ${totalRevenue.toLocaleString()} SAR\n` +
        `Total Trips: ${totalTrips}\n` +
        `Average Order Value: ${avgOrderValue.toFixed(2)} SAR\n\n` +
        `TRIP STATUS BREAKDOWN:\n` +
        Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join('\n') + '\n\n' +
        `TOP CUSTOMERS:\n` +
        Object.entries(topCustomers)
          .sort(([,a], [,b]) => b.revenue - a.revenue)
          .slice(0, 10)
          .map(([customer, data]) => `${customer}: ${data.trips} trips, ${data.revenue.toLocaleString()} SAR`)
          .join('\n') + '\n\n' +
        `DETAILED TRIP DATA:\n` +
        trips.slice(0, 50).map(trip => 
          `${trip.tripNumber} | ${trip.customer.name} | ${trip.fromCity.name} → ${trip.toCity.name} | ${trip.status} | ${trip.price} SAR`
        ).join('\n')
      
      return new Response(content, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename=profleet-report-${range}-${new Date().toISOString().split('T')[0]}.txt`,
        },
      })
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    
  } catch (error) {
    console.error("Error exporting report data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
