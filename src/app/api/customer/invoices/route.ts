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

    // For now, we'll generate mock invoices based on completed trips
    // In a real application, you'd have a proper invoices table
    const completedTrips = await db.trip.findMany({
      where: {
        customerId: session.user.id,
        status: "DELIVERED"
      },
      include: {
        fromCity: {
          select: {
            name: true
          }
        },
        toCity: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        deliveredDate: "desc"
      }
    })

    // Transform trips into invoice format
    const invoices = completedTrips.map((trip, index) => {
      const subtotal = trip.price
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate
      const customsFees = subtotal * 0.02 // 2% customs fees
      const totalAmount = subtotal + taxAmount + customsFees

      // Simulate different invoice statuses
      const statuses = ['SENT', 'PAID', 'OVERDUE']
      const randomStatus = statuses[index % statuses.length]

      return {
        id: `inv-${trip.id}`,
        invoiceNumber: `INV${String(index + 1).padStart(6, '0')}`,
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        subtotal: subtotal,
        taxAmount: taxAmount,
        customsFees: customsFees,
        totalAmount: totalAmount,
        status: randomStatus,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        paidDate: randomStatus === 'PAID' ? new Date().toISOString() : null,
        createdAt: trip.deliveredDate || trip.createdAt,
        updatedAt: trip.updatedAt,
      }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching customer invoices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
