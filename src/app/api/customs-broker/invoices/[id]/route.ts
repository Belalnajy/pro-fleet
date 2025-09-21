import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Get trip data (using trip ID as invoice ID for simplicity)
    const trip = await prisma.trip.findUnique({
      where: { id }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Format response data as mock invoice
    const formattedInvoice = {
      id: trip.id,
      invoiceNumber: `INV-${trip.tripNumber}`,
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      customer: {
        id: trip.customerId,
        name: 'عميل',
        companyName: 'شركة',
        email: 'customer@example.com'
      },
      route: {
        from: 'المدينة المنورة',
        to: 'الرياض'
      },
      vehicle: {
        type: "شاحنة",
        capacity: "10 طن"
      },
      temperature: "عادي",
      driver: {
        id: trip.driverId,
        name: "سائق"
      },
      subtotal: trip.price || 0,
      taxAmount: (trip.price || 0) * 0.15,
      customsFee: 0,
      total: (trip.price || 0) * 1.15,
      currency: "SAR",
      paymentStatus: "PENDING",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidDate: null,
      notes: trip.notes,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
      customsBroker: null
    }

    return NextResponse.json(formattedInvoice)

  } catch (error) {
    console.error("Error fetching customs broker invoice:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { customsFee, notes } = body

    // Validate input
    if (customsFee !== undefined && (isNaN(customsFee) || customsFee < 0)) {
      return NextResponse.json({ error: "Invalid customs fee amount" }, { status: 400 })
    }

    // Get current trip (using trip ID as invoice ID for simplicity)
    const trip = await prisma.trip.findUnique({
      where: { id }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // For now, just return updated mock data with the new customs fee
    const newCustomsFee = customsFee !== undefined ? parseFloat(customsFee.toString()) : 0
    const subtotal = trip.price || 0
    const taxAmount = (subtotal + newCustomsFee) * 0.15
    const total = subtotal + newCustomsFee + taxAmount

    // Format response data as updated mock invoice
    const formattedInvoice = {
      id: trip.id,
      invoiceNumber: `INV-${trip.tripNumber}`,
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      customer: {
        id: trip.customerId,
        name: 'عميل',
        companyName: 'شركة',
        email: 'customer@example.com'
      },
      route: {
        from: 'المدينة المنورة',
        to: 'الرياض'
      },
      vehicle: {
        type: "شاحنة",
        capacity: "10 طن"
      },
      temperature: "عادي",
      driver: {
        id: trip.driverId,
        name: "سائق"
      },
      subtotal: subtotal,
      taxAmount: taxAmount,
      customsFee: newCustomsFee,
      total: total,
      currency: "SAR",
      paymentStatus: "PENDING",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidDate: null,
      notes: notes || trip.notes,
      createdAt: trip.createdAt,
      updatedAt: new Date(),
      customsBroker: null
    }

    return NextResponse.json(formattedInvoice)

  } catch (error) {
    console.error("Error updating customs broker invoice:", error)
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    )
  }
}
