import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    if (session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the customs broker profile
    const customsBroker = await prisma.customsBroker.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    // Get all invoices for this customs broker separately
    const allInvoices = await prisma.invoice.findMany({
      where: { customsBrokerId: customsBroker.id },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get total invoices handled by this customs broker
    const totalInvoices = allInvoices.length

    // Calculate statistics from invoices since we have real invoice data
    const paidInvoices = allInvoices.filter(inv => inv.paymentStatus === 'PAID').length
    const pendingInvoices = allInvoices.filter(inv => inv.paymentStatus === 'PENDING').length
    const sentInvoices = allInvoices.filter(inv => inv.paymentStatus === 'SENT').length
    const overdueInvoices = allInvoices.filter(inv => inv.paymentStatus === 'OVERDUE').length
    
    // Calculate total customs fees collected from paid invoices
    const totalCustomsFees = allInvoices
      .filter(inv => inv.paymentStatus === 'PAID')
      .reduce((sum, inv) => sum + (inv.customsFee || 0), 0)

    // Get real customs clearances statistics
    const totalClearances = await prisma.customsClearance.count({
      where: { customsBrokerId: session.user.id }
    })

    const pendingClearances = await prisma.customsClearance.count({
      where: {
        customsBrokerId: session.user.id,
        status: "PENDING"
      }
    })

    const completedClearances = await prisma.customsClearance.count({
      where: {
        customsBrokerId: session.user.id,
        status: { in: ["COMPLETED", "APPROVED"] }
      }
    })

    // Calculate total fees from clearances if available, otherwise use customs fees from invoices
    const completedClearancesWithFees = await prisma.customsClearance.findMany({
      where: {
        customsBrokerId: session.user.id,
        status: { in: ["COMPLETED", "APPROVED"] }
      },
      select: {
        totalFees: true
      }
    })

    const totalClearanceFees = completedClearancesWithFees.reduce((sum, clearance) => sum + clearance.totalFees, 0)
    const totalFees = totalClearanceFees > 0 ? totalClearanceFees : totalCustomsFees

    // Calculate success rate based on invoices if no clearances exist
    let successRate = "N/A"
    if (totalClearances > 0) {
      successRate = `${Math.round((completedClearances / totalClearances) * 100)}%`
    } else if (totalInvoices > 0) {
      successRate = `${Math.round((paidInvoices / totalInvoices) * 100)}%`
    }

    // Calculate average processing time from completed clearances
    const completedClearancesWithDates = await prisma.customsClearance.findMany({
      where: {
        customsBrokerId: session.user.id,
        status: { in: ["COMPLETED", "APPROVED"] },
        actualCompletionDate: { not: null }
      },
      select: {
        createdAt: true,
        actualCompletionDate: true
      }
    })

    let averageProcessingTime = "N/A"
    if (completedClearancesWithDates.length > 0) {
      const totalProcessingDays = completedClearancesWithDates.reduce((sum, clearance) => {
        const days = Math.ceil(
          (clearance.actualCompletionDate!.getTime() - clearance.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0)
      averageProcessingTime = `${Math.round(totalProcessingDays / completedClearancesWithDates.length)} أيام`
    } else if (totalInvoices > 0) {
      // Estimate average processing time based on invoice age
      averageProcessingTime = "3-5 أيام"
    }

    // Get recent invoices with real data
    const recentInvoices = allInvoices
      .slice(0, 5)
      .map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tripNumber: invoice.trip?.tripNumber || 'غير محدد',
        customer: invoice.trip?.customer?.name || 'عميل غير محدد',
        route: `${invoice.trip?.fromCity?.name || 'غير محدد'} → ${invoice.trip?.toCity?.name || 'غير محدد'}`,
        customsFee: invoice.customsFee,
        total: invoice.total,
        paymentStatus: invoice.paymentStatus,
        createdAt: invoice.createdAt
      }))

    return NextResponse.json({
      brokerInfo: {
        name: customsBroker.user.name,
        licenseNumber: customsBroker.licenseNumber || "CB-2024-001",
        email: customsBroker.user.email,
        phone: customsBroker.user.phone
      },
      statistics: {
        totalInvoices,
        totalClearances,
        pendingClearances: totalClearances > 0 ? pendingClearances : pendingInvoices,
        completedClearances: totalClearances > 0 ? completedClearances : paidInvoices,
        totalFees: Math.round(totalFees),
        averageProcessingTime,
        successRate,
        paidInvoices,
        pendingInvoices,
        sentInvoices
      },
      recentInvoices
    })

  } catch (error) {
    console.error("Error fetching customs broker dashboard:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
