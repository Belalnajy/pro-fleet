import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 [CUSTOMER CLEARANCES] Fetching clearances for customer:', session.user.id)

    // Get clearances for this customer's invoices
    const clearances = await db.customsClearance.findMany({
      where: {
        invoice: {
          trip: {
            customerId: session.user.id
          }
        }
      },
      include: {
        invoice: {
          include: {
            trip: {
              include: {
                fromCity: true,
                toCity: true
              }
            }
          }
        },
        customsBroker: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform data for frontend
    const formattedClearances = clearances.map((clearance) => ({
      id: clearance.id,
      clearanceNumber: clearance.clearanceNumber,
      status: clearance.status,
      customsFee: clearance.customsFee,
      additionalFees: clearance.additionalFees,
      totalFees: clearance.totalFees,
      notes: clearance.notes,
      estimatedCompletionDate: clearance.estimatedCompletionDate?.toISOString() || null,
      actualCompletionDate: clearance.actualCompletionDate?.toISOString() || null,
      createdAt: clearance.createdAt.toISOString(),
      updatedAt: clearance.updatedAt.toISOString(),
      // Invoice details
      invoice: {
        id: clearance.invoice.id,
        invoiceNumber: clearance.invoice.invoiceNumber,
        total: clearance.invoice.total,
        currency: clearance.invoice.currency,
        paymentStatus: clearance.invoice.paymentStatus,
        trip: {
          id: clearance.invoice.trip?.id,
          tripNumber: clearance.invoice.trip?.tripNumber,
          fromCity: clearance.invoice.trip?.fromCity?.nameAr || clearance.invoice.trip?.fromCity?.name,
          toCity: clearance.invoice.trip?.toCity?.nameAr || clearance.invoice.trip?.toCity?.name
        }
      },
      // Customs broker details
      customsBroker: {
        name: clearance.customsBroker?.name || 'غير محدد'
      }
    }))

    console.log('📊 [CUSTOMER CLEARANCES] Found clearances:', {
      customerId: session.user.id,
      totalClearances: formattedClearances.length,
      statuses: formattedClearances.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })

    return NextResponse.json(formattedClearances)
  } catch (error) {
    console.error("❌ [CUSTOMER CLEARANCES] Error fetching clearances:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
