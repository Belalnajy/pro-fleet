import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// POST - Auto-generate invoice when trip is delivered
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "ACCOUNTANT", "DRIVER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tripId } = body

    if (!tripId) {
      return NextResponse.json(
        { error: "tripId is required" },
        { status: 400 }
      )
    }

    // Get trip details
    const trip: any = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        customer: {
          include: {
            user: true
          }
        },
        driver: {
          include: {
            user: true
          }
        },
        fromCity: true,
        toCity: true,
        vehicle: true,
        invoice: true // Check if invoice already exists
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    if (trip.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Invoice can only be generated for delivered trips" },
        { status: 400 }
      )
    }

    if (trip.invoice) {
      return NextResponse.json(
        { error: "Invoice already exists for this trip" },
        { status: 400 }
      )
    }

    // Calculate invoice amounts
    const subtotal = trip.price
    const taxRate = 0.15 // 15% VAT
    const taxAmount = subtotal * taxRate
    
    // Random customs fee (in real app, this would be calculated based on cargo type)
    const customsFee = Math.floor(Math.random() * 300) + 50
    
    const total = subtotal + taxAmount + customsFee

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    // Set due date (30 days from delivery)
    const dueDate = new Date(trip.deliveredDate!)
    dueDate.setDate(dueDate.getDate() + 30)

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        tripId: trip.id,
        customsFee,
        taxRate,
        taxAmount,
        subtotal,
        total,
        currency: trip.currency,
        paymentStatus: "PENDING",
        dueDate,
        notes: `Auto-generated invoice for trip ${trip.tripNumber} from ${trip.fromCity?.name ?? ""} to ${trip.toCity?.name ?? ""}`,
      },
      include: {
        trip: {
          include: {
            customer: {
              include: {
                user: true
              }
            },
            fromCity: true,
            toCity: true,
            vehicle: true
          }
        }
      }
    })

    // Log the invoice generation
    console.log(`📧 Invoice ${invoiceNumber} auto-generated for trip ${trip.tripNumber}`)

    // In a real app, you would send email notification here
    // await sendInvoiceEmail(invoice)

    return NextResponse.json({
      message: "Invoice generated successfully",
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        paymentStatus: invoice.paymentStatus,
        trip: {
          tripNumber: trip.tripNumber,
          fromCity: trip.fromCity?.name ?? "",
          toCity: trip.toCity?.name ?? "",
          customer: trip.customer?.user?.name ?? ""
        }
      }
    })
  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get all auto-generated invoices
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    let whereClause: any = {}
    
    if (status) {
      whereClause.paymentStatus = status.toUpperCase()
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            fromCity: true,
            toCity: true,
            vehicle: true
          }
        },
        customsBroker: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
