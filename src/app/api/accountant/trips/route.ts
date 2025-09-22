import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const hasInvoice = searchParams.get('hasInvoice')

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }

    // Filter trips without invoices if requested
    if (hasInvoice === 'false') {
      where.invoice = null
    }

    const trips = await db.trip.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 trips for performance
    })

    return NextResponse.json({
      trips: trips.map(trip => ({
        id: trip.id,
        tripNumber: trip.tripNumber,
        customer: trip.customer,
        fromCity: trip.fromCity,
        toCity: trip.toCity,
        price: trip.price,
        status: trip.status
      }))
    })

  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
