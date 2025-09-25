import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const range = req.nextUrl.searchParams.get("range") || "last30days"
    const status = req.nextUrl.searchParams.get("status")
    const customerId = req.nextUrl.searchParams.get("customerId")
    const driverId = req.nextUrl.searchParams.get("driverId")
    const vehicleTypeId = req.nextUrl.searchParams.get("vehicleTypeId")
    const paymentStatus = req.nextUrl.searchParams.get("paymentStatus")

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

    // Build filter conditions
    const tripFilters: any = {
      createdAt: {
        gte: startDate
      }
    }

    if (status) tripFilters.status = status
    if (customerId) tripFilters.customerId = customerId
    if (driverId) tripFilters.driverId = driverId
    if (vehicleTypeId) {
      tripFilters.vehicle = {
        vehicleTypeId: vehicleTypeId
      }
    }

    const invoiceFilters: any = {
      createdAt: {
        gte: startDate
      }
    }

    if (paymentStatus) invoiceFilters.paymentStatus = paymentStatus

    // Get all trips with relations
    const trips = await db.trip.findMany({
      where: tripFilters,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        vehicle: {
          include: {
            vehicleType: {
              select: {
                name: true,
                nameAr: true,
                capacity: true
              }
            }
          }
        },
        fromCity: {
          select: {
            name: true,
            nameAr: true
          }
        },
        toCity: {
          select: {
            name: true,
            nameAr: true
          }
        },
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Get invoices for financial data
    const invoices = await db.invoice.findMany({
      where: invoiceFilters,
      include: {
        trip: {
          include: {
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Calculate Monthly Revenue
    const monthlyData = new Map()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    trips.forEach(trip => {
      const date = new Date(trip.createdAt)
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          revenue: 0,
          trips: 0,
          expenses: 0,
          profit: 0
        })
      }
      
      const data = monthlyData.get(monthKey)
      data.revenue += trip.price
      data.trips += 1
      // Estimate expenses as 65% of revenue
      data.expenses = Math.round(data.revenue * 0.65)
      data.profit = data.revenue - data.expenses
    })

    const monthlyRevenue = Array.from(monthlyData.values())
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ')
        const [monthB, yearB] = b.month.split(' ')
        const dateA = new Date(`${monthA} 1, ${yearA}`)
        const dateB = new Date(`${monthB} 1, ${yearB}`)
        return dateA.getTime() - dateB.getTime()
      })

    // Calculate City Statistics
    const cityData = new Map()
    trips.forEach(trip => {
      const cityKey = `${trip.fromCity.name} → ${trip.toCity.name}`
      
      if (!cityData.has(cityKey)) {
        cityData.set(cityKey, {
          city: cityKey,
          trips: 0,
          revenue: 0,
          avgPrice: 0
        })
      }
      
      const data = cityData.get(cityKey)
      data.trips += 1
      data.revenue += trip.price
      data.avgPrice = Math.round(data.revenue / data.trips)
    })

    const cityStats = Array.from(cityData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate Vehicle Type Statistics
    const vehicleData = new Map()
    trips.filter(trip => trip.vehicle?.vehicleType).forEach(trip => {
      const vehicleType = trip.vehicle!.vehicleType!.name
      
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
      data.efficiency = Math.round((data.revenue / data.usage) * 100) / 100
    })

    const vehicleTypeStats = Array.from(vehicleData.values())
      .sort((a, b) => b.usage - a.usage)

    // Calculate Customer Statistics
    const customerData = new Map()
    trips.forEach(trip => {
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
      data.avgOrderValue = Math.round(data.revenue / data.trips)
    })

    const customerStats = Array.from(customerData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15)

    // Calculate Daily Statistics for last 30 days
    const dailyData = new Map()
    const last30Days = Array.from({length: 30}, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().slice(0, 10)
    }).reverse()

    // Initialize all days with zero values
    last30Days.forEach(date => {
      dailyData.set(date, {
        date: date,
        trips: 0,
        revenue: 0,
        newCustomers: 0
      })
    })

    // Fill in actual data
    trips.forEach(trip => {
      const date = trip.createdAt.toISOString().slice(0, 10)
      if (dailyData.has(date)) {
        const data = dailyData.get(date)
        data.trips += 1
        data.revenue += trip.price
      }
    })

    // Calculate new customers per day (simplified - count unique customers per day)
    const customersByDay = new Map()
    trips.forEach(trip => {
      const date = trip.createdAt.toISOString().slice(0, 10)
      if (!customersByDay.has(date)) {
        customersByDay.set(date, new Set())
      }
      customersByDay.get(date).add(trip.customer.id)
    })

    customersByDay.forEach((customers, date) => {
      if (dailyData.has(date)) {
        dailyData.get(date).newCustomers = customers.size
      }
    })

    const dailyStats = Array.from(dailyData.values())

    // Calculate KPI Data
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.price, 0)
    const totalTrips = trips.length
    const uniqueCustomers = new Set(trips.map(trip => trip.customer.id)).size
    const averageOrderValue = totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0
    
    // Calculate growth rate (compare with previous period)
    const previousPeriodStart = new Date(startDate)
    const periodDuration = now.getTime() - startDate.getTime()
    previousPeriodStart.setTime(startDate.getTime() - periodDuration)
    
    const previousTrips = await db.trip.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })
    
    const previousRevenue = previousTrips.reduce((sum, trip) => sum + trip.price, 0)
    const growthRate = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100 * 100) / 100
      : 0

    const kpiData = {
      totalRevenue,
      totalTrips,
      activeCustomers: uniqueCustomers,
      averageOrderValue,
      growthRate
    }

    // Additional data for enhanced reports
    const performanceMetrics = {
      totalRevenue,
      totalTrips,
      avgOrderValue: averageOrderValue,
      customerRetention: 75.5, // This would need more complex calculation
      profitMargin: 35, // Based on estimated expenses
      growthRate
    }

    // Top Routes
    const topRoutes = cityStats.map(city => ({
      route: city.city,
      trips: city.trips,
      revenue: city.revenue,
      popularity: Math.round((city.trips / totalTrips) * 100 * 100) / 100
    }))

    // Driver Performance
    const driverData = new Map()
    trips.filter(trip => trip.driver?.user).forEach(trip => {
      const driverName = trip.driver!.user.name
      
      if (!driverData.has(driverName)) {
        driverData.set(driverName, {
          driver: driverName,
          trips: 0,
          revenue: 0,
          rating: 4.0 + Math.random() * 1.0 // Mock rating for now
        })
      }
      
      const data = driverData.get(driverName)
      data.trips += 1
      data.revenue += trip.price
    })

    const driverPerformance = Array.from(driverData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Payment Statistics
    const paymentStats = {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.paymentStatus === 'PAID').length,
      partialInvoices: invoices.filter(inv => inv.paymentStatus === 'PARTIAL').length,
      installmentInvoices: invoices.filter(inv => inv.paymentStatus === 'INSTALLMENT').length,
      pendingInvoices: invoices.filter(inv => inv.paymentStatus === 'PENDING').length,
      sentInvoices: invoices.filter(inv => inv.paymentStatus === 'SENT').length,
      cancelledInvoices: invoices.filter(inv => inv.paymentStatus === 'CANCELLED').length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
      paidAmount: invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
      remainingAmount: invoices.reduce((sum, inv) => sum + (inv.remainingAmount || (inv.total - (inv.amountPaid || 0))), 0),
      collectionRate: invoices.length > 0 ? Math.round((invoices.filter(inv => inv.paymentStatus === 'PAID').length / invoices.length) * 100 * 100) / 100 : 0
    }

    // Payment Status Distribution for Charts
    const paymentStatusDistribution = [
      { status: 'مدفوعة', count: paymentStats.paidInvoices, amount: invoices.filter(inv => inv.paymentStatus === 'PAID').reduce((sum, inv) => sum + inv.total, 0) },
      { status: 'جزئية', count: paymentStats.partialInvoices, amount: invoices.filter(inv => inv.paymentStatus === 'PARTIAL').reduce((sum, inv) => sum + inv.total, 0) },
      { status: 'أقساط', count: paymentStats.installmentInvoices, amount: invoices.filter(inv => inv.paymentStatus === 'INSTALLMENT').reduce((sum, inv) => sum + inv.total, 0) },
      { status: 'معلقة', count: paymentStats.pendingInvoices, amount: invoices.filter(inv => inv.paymentStatus === 'PENDING').reduce((sum, inv) => sum + inv.total, 0) },
      { status: 'مرسلة', count: paymentStats.sentInvoices, amount: invoices.filter(inv => inv.paymentStatus === 'SENT').reduce((sum, inv) => sum + inv.total, 0) }
    ]

    const reportData = {
      monthlyRevenue,
      cityStats,
      vehicleTypeStats,
      customerStats,
      dailyStats,
      performanceMetrics,
      topRoutes,
      driverPerformance,
      paymentStats,
      paymentStatusDistribution
    }

    return NextResponse.json({
      reportData,
      kpiData,
      range
    })

  } catch (error) {
    console.error("Error fetching report data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
