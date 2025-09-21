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

    // Get financial data
    const invoices = await db.invoice.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        trip: {
          include: {
            customer: true,
            driver: {
              include: {
                user: true
              }
            },
            fromCity: true,
            toCity: true,
            vehicle: {
              include: {
                vehicleType: true
              }
            },
            temperature: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (format === "excel") {
      // Generate CSV format for Excel
      const csvHeaders = [
        "Invoice Number",
        "Trip Number", 
        "Customer",
        "Route",
        "Amount",
        "Tax",
        "Customs Fee",
        "Total",
        "Status",
        "Created Date",
        "Due Date",
        "Paid Date"
      ]

      const csvData = invoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.trip?.tripNumber || "N/A",
        invoice.trip?.customer?.companyName || "N/A",
        `${invoice.trip?.fromCity?.name || "N/A"} - ${invoice.trip?.toCity?.name || "N/A"}`,
        invoice.subtotal.toString(),
        invoice.taxAmount.toString(),
        invoice.customsFee?.toString() || "0",
        invoice.total.toString(),
        invoice.paymentStatus,
        invoice.createdAt.toISOString().split('T')[0],
        invoice.dueDate.toISOString().split('T')[0],
        invoice.paidDate?.toISOString().split('T')[0] || "N/A"
      ])

      const csvContent = [
        csvHeaders.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    if (format === "pdf") {
      // Generate PDF report summary
      const totalRevenue = invoices
        .filter(inv => inv.paymentStatus === 'PAID')
        .reduce((sum, inv) => sum + inv.total, 0)
      
      const totalPending = invoices
        .filter(inv => inv.paymentStatus === 'PENDING' || inv.paymentStatus === 'SENT')
        .reduce((sum, inv) => sum + inv.total, 0)

      const statusBreakdown = invoices.reduce((acc, inv) => {
        acc[inv.paymentStatus] = (acc[inv.paymentStatus] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topCustomers = invoices
        .reduce((acc, inv) => {
          const customerName = inv.trip?.customer?.companyName || "Unknown"
          if (!acc[customerName]) {
            acc[customerName] = { count: 0, revenue: 0 }
          }
          acc[customerName].count++
          if (inv.paymentStatus === 'PAID') {
            acc[customerName].revenue += inv.total
          }
          return acc
        }, {} as Record<string, { count: number; revenue: number }>)

      const pdfContent = `
FINANCIAL REPORT
Generated: ${new Date().toLocaleDateString()}
Period: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}

SUMMARY:
- Total Revenue (Paid): ${totalRevenue.toFixed(2)} SAR
- Pending Payments: ${totalPending.toFixed(2)} SAR
- Total Invoices: ${invoices.length}

INVOICE STATUS BREAKDOWN:
${Object.entries(statusBreakdown)
  .map(([status, count]) => `- ${status}: ${count} invoices`)
  .join('\n')}

TOP CUSTOMERS:
${Object.entries(topCustomers)
  .sort(([,a], [,b]) => b.revenue - a.revenue)
  .slice(0, 10)
  .map(([customer, data]) => `- ${customer}: ${data.count} invoices, ${data.revenue.toFixed(2)} SAR`)
  .join('\n')}

DETAILED INVOICE LIST:
${invoices.slice(0, 50).map(inv => 
  `${inv.invoiceNumber} | ${inv.trip?.customer?.companyName || 'N/A'} | ${inv.total.toFixed(2)} SAR | ${inv.paymentStatus}`
).join('\n')}
${invoices.length > 50 ? `\n... and ${invoices.length - 50} more invoices` : ''}
      `

      return new NextResponse(pdfContent, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 })

  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    )
  }
}
