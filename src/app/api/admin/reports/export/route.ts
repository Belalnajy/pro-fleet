import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import * as XLSX from 'xlsx'

// Helper function to translate status to Arabic
function getStatusInArabic(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'في الانتظار',
    'IN_PROGRESS': 'قيد التنفيذ',
    'DELIVERED': 'تم التسليم',
    'CANCELLED': 'ملغية'
  }
  return statusMap[status] || status
}

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
      // Create comprehensive XLSX export
      const headers = [
        "رقم الرحلة",
        "العميل",
        "السائق",
        "المسار",
        "نوع المركبة",
        "سعة المركبة",
        "درجة الحرارة",
        "الحالة",
        "السعر (ريال)",
        "تاريخ الجدولة",
        "تاريخ البدء",
        "تاريخ التسليم",
        "تاريخ الإنشاء"
      ]
      
      const rows = trips.map(trip => [
        trip.tripNumber,
        trip.customer.name,
        trip.driver?.user?.name || "غير مخصص",
        `${trip.fromCity.name} ← ${trip.toCity.name}`,
        trip.vehicle?.vehicleType?.name || "غير محدد",
        trip.vehicle?.vehicleType?.capacity || "غير محدد",
        `${trip.temperature?.option || "غير محدد"} (${trip.temperature?.value || 0}°م)`,
        getStatusInArabic(trip.status),
        trip.price.toString(),
        trip.scheduledDate.toISOString().split('T')[0],
        trip.actualStartDate?.toISOString().split('T')[0] || "لم يبدأ",
        trip.deliveredDate?.toISOString().split('T')[0] || "لم يسلم",
        trip.createdAt.toISOString().split('T')[0]
      ])
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheetData = [headers, ...rows]
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // رقم الرحلة
        { wch: 25 }, // العميل
        { wch: 20 }, // السائق
        { wch: 30 }, // المسار
        { wch: 15 }, // نوع المركبة
        { wch: 12 }, // سعة المركبة
        { wch: 20 }, // درجة الحرارة
        { wch: 12 }, // الحالة
        { wch: 15 }, // السعر
        { wch: 15 }, // تاريخ الجدولة
        { wch: 15 }, // تاريخ البدء
        { wch: 15 }, // تاريخ التسليم
        { wch: 15 }  // تاريخ الإنشاء
      ]
      worksheet['!cols'] = columnWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الرحلات")
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new Response(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=profleet-reports-${range}-${new Date().toISOString().split('T')[0]}.xlsx`,
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
