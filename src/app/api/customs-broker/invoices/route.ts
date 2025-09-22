import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Get the customs broker profile first
    const customsBroker = await prisma.customsBroker.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }
    
    // 🔍 DETAILED LOG: Customs broker fetching invoices
    console.log('🔍 [CUSTOMS BROKER INVOICES] Fetching invoices for broker:', {
      brokerId: customsBroker.id,
      brokerName: customsBroker.user.name,
      userId: session.user.id,
      searchQuery: search,
      page,
      limit
    })

    // Get invoices assigned to this customs broker
    const invoices = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id,
        invoiceNumber: {
          contains: search,
          mode: "insensitive"
        }
      },
      include: {
        trip: {
          include: {
            customer: true,
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
        createdAt: "desc"
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.invoice.count({
      where: {
        customsBrokerId: customsBroker.id,
        invoiceNumber: {
          contains: search,
          mode: "insensitive"
        }
      }
    })
    
    // 📊 DETAILED LOG: Invoices fetched for customs broker
    console.log('📊 [CUSTOMS BROKER INVOICES] Invoices fetched:', {
      brokerName: customsBroker.user.name,
      totalInvoicesFound: totalCount,
      invoicesInThisPage: invoices.length,
      page,
      limit,
      searchQuery: search
    })
    
    if (invoices.length > 0) {
      console.log('✅ [CUSTOMS BROKER INVOICES] Sample invoices:')
      invoices.slice(0, 3).forEach((inv, index) => {
        console.log(`   ${index + 1}. ${inv.invoiceNumber} - ${inv.trip?.customer?.name} - ${inv.total} SAR`)
      })
    } else {
      console.log('⚠️ [CUSTOMS BROKER INVOICES] No invoices found for this broker')
    }

    // Format invoice data for this customs broker
    const invoicesData: any[] = []

    for (const invoice of invoices) {
      const trip = invoice.trip
      
      // Format invoice data
      invoicesData.push({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tripId: trip?.id || null,
        tripNumber: trip?.tripNumber || 'غير محدد',
        customer: {
          id: trip?.customerId || null,
          name: trip?.customer?.name || 'عميل غير محدد',
          companyName: 'شركة غير محددة',
          email: trip?.customer?.email || 'customer@example.com'
        },
        route: {
          from: trip?.fromCity?.name || 'غير محدد',
          to: trip?.toCity?.name || 'غير محدد'
        },
        vehicle: {
          type: trip?.vehicle?.vehicleType?.name || "غير محدد",
          capacity: trip?.vehicle?.capacity || "غير محدد"
        },
        temperature: trip?.temperature?.option || "عادي",
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        customsFee: invoice.customsFee,
        total: invoice.total,
        currency: invoice.currency,
        paymentStatus: invoice.paymentStatus,
        status: "pending", // Will be updated after checking clearances
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        notes: invoice.notes,
        createdAt: trip?.createdAt || invoice.createdAt,
        updatedAt: invoice.updatedAt,
        customsBroker: customsBroker.id,
        hasCustomsClearance: false // Will be updated after checking clearances
      })
    }

    return NextResponse.json({
      invoices: invoicesData,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching customs broker invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}
