import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/admin/invoices - Fetch all invoices
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await db.invoice.findMany({
      include: {
        trip: {
          include: {
            customer: true, // customer is User directly
            fromCity: true,
            toCity: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend interface
    const transformedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.trip?.customer?.id || '',
      customerName: invoice.trip?.customer?.name || 'Unknown Customer',
      tripId: invoice.tripId,
      tripNumber: invoice.trip?.tripNumber || null,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFees: invoice.customsFee,
      totalAmount: invoice.total,
      status: invoice.paymentStatus, // PENDING, PAID, OVERDUE, CANCELLED
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      currency: invoice.currency,
      notes: invoice.notes
    }))

    return NextResponse.json(transformedInvoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, tripId, subtotal, taxAmount, customsFees, dueDate, notes } = body

    // Validate required fields - tripId is required in the schema
    if (!tripId || !subtotal || !taxAmount || !dueDate) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: "tripId, subtotal, taxAmount, and dueDate are required" 
      }, { status: 400 })
    }

    // Check if trip exists and get customer info
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        customer: true // customer is User directly
      }
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Check if invoice already exists for this trip
    const existingInvoice = await db.invoice.findUnique({
      where: { tripId }
    })

    if (existingInvoice) {
      return NextResponse.json({ 
        error: "Invoice already exists for this trip",
        invoiceNumber: existingInvoice.invoiceNumber 
      }, { status: 409 })
    }

    // Generate invoice number
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    let invoiceNumber = "INV-000001"
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1])
      invoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`
    }

    // Calculate total
    const total = subtotal + taxAmount + (customsFees || 0)

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        tripId, // tripId is required
        customsFee: customsFees || 0,
        taxRate: taxAmount / subtotal, // Calculate tax rate
        taxAmount,
        subtotal,
        total,
        currency: 'SAR',
        paymentStatus: 'PENDING',
        dueDate: new Date(dueDate),
        notes: notes || null
      },
      include: {
        trip: {
          include: {
            customer: true // customer is User directly
          }
        }
      }
    })

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: trip.customer.id,
      customerName: trip.customer.name,
      tripId: invoice.tripId,
      tripNumber: trip.tripNumber,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFees: invoice.customsFee,
      totalAmount: invoice.total,
      status: invoice.paymentStatus,
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      currency: invoice.currency,
      notes: invoice.notes
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
