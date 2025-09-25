import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateInvoiceNumber } from "@/lib/invoice-number-generator"
// import { extractCustomsBrokerFromNotes } from "@/lib/customs-broker-helper"

// Inline function to ensure it works
async function extractCustomsBrokerFromNotes(notes: string | null): Promise<string | null> {
  console.log('🔍 [INLINE] Starting extraction with notes:', notes)
  
  if (!notes) {
    console.log('🔍 [INLINE] No notes provided')
    return null
  }

  try {
    const patterns = [
      /Customs Broker:\s*([^.]+)/i,
      /المخلص الجمركي:\s*([^.]+)/i
    ]

    let brokerName: string | null = null
    
    for (const pattern of patterns) {
      const match = notes.match(pattern)
      console.log('🔍 [INLINE] Pattern match:', pattern, '→', match ? match[1] : 'No match')
      
      if (match && match[1] && match[1].trim() !== 'غير محدد' && match[1].trim() !== 'None') {
        brokerName = match[1].trim()
        console.log('🔍 [INLINE] Found broker name:', brokerName)
        break
      }
    }

    if (!brokerName) {
      console.log('🔍 [INLINE] No broker name extracted')
      return null
    }

    // Find the customs broker by name
    const customsBrokers = await db.customsBroker.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    console.log('🔍 [INLINE] Available brokers:', customsBrokers.map(b => b.user.name))
    
    const foundBroker = customsBrokers.find(broker => 
      broker.user.name.toLowerCase() === brokerName.toLowerCase()
    )
    
    if (foundBroker) {
      console.log('🔍 [INLINE] Found matching broker:', foundBroker.user.name, 'ID:', foundBroker.id)
      return foundBroker.id
    } else {
      console.log('🔍 [INLINE] No matching broker found for:', brokerName)
      return null
    }

  } catch (error) {
    console.error('🔍 [INLINE] Error extracting customs broker:', error)
    return null
  }
}

// GET /api/admin/invoices - Fetch all invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.paymentStatus = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { 'trip.tripNumber': { contains: search, mode: 'insensitive' } },
        { 'trip.customer.name': { contains: search, mode: 'insensitive' } },
        { 'trip.fromCity.name': { contains: search, mode: 'insensitive' } },
        { 'trip.toCity.name': { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count for pagination
    const totalCount = await db.invoice.count({ where })
    const totalPages = Math.ceil(totalCount / limit)

    // Get paginated invoices
    const invoices = await db.invoice.findMany({
      where,
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
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
      customsFees: 0, // Regular invoices don't have customs fees
      totalAmount: invoice.total,
      paymentStatus: invoice.paymentStatus, // PENDING, PAID, OVERDUE, CANCELLED
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString() || null,
      // Payment tracking fields
      amountPaid: invoice.amountPaid || 0,
      remainingAmount: invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0)),
      installmentCount: invoice.installmentCount,
      installmentsPaid: invoice.installmentsPaid || 0,
      installmentAmount: invoice.installmentAmount,
      nextInstallmentDate: invoice.nextInstallmentDate?.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      currency: invoice.currency,
      notes: invoice.notes
    }))

    return NextResponse.json({
      invoices: transformedInvoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit
      }
    })
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
    const { customerId, tripId, customsBrokerId: manualCustomsBrokerId, subtotal, taxAmount, customsFees, dueDate, notes } = body

    // Validate required fields - either tripId or customerId must be provided
    if (!subtotal || !taxAmount || !dueDate) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: "subtotal, taxAmount, and dueDate are required" 
      }, { status: 400 })
    }

    if (!tripId && !customerId) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: "Either tripId or customerId must be provided" 
      }, { status: 400 })
    }

    let trip: any = null
    let customer: any = null
    let customsBrokerId: string | null = null

    // If tripId is provided, get trip and customer info
    if (tripId) {
      trip = await db.trip.findUnique({
        where: { id: tripId },
        include: {
          customer: true
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

      customer = trip?.customer
      customsBrokerId = trip?.customsBrokerId
      
      // 🔍 DETAILED LOG: Trip data extraction
      console.log('🔍 [INVOICE CREATION] Trip data extracted:', {
        tripId: trip?.id,
        tripNumber: trip?.tripNumber,
        customsBrokerId: trip?.customsBrokerId,
        customerName: trip?.customer?.name,
        tripStatus: trip?.status,
        hasCustomsBroker: !!trip?.customsBrokerId
      })
      
      if (trip?.customsBrokerId) {
        console.log('✅ [INVOICE CREATION] Customs broker found in trip:', trip.customsBrokerId)
      } else {
        console.log('⚠️ [INVOICE CREATION] No customs broker in trip')
      }
    } else {
      // If only customerId is provided (manual invoice)
      customer = await db.user.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }
    }

    // Use manual customsBrokerId if provided, otherwise use the one from trip
    if (manualCustomsBrokerId) {
      customsBrokerId = manualCustomsBrokerId
    }

    // Generate invoice number with new format: PRO-INV- + YYYYMMDD + sequential number
    const invoiceCount = await db.invoice.count()
    const invoiceNumber = generateInvoiceNumber(invoiceCount)

    // Calculate total (regular invoices don't have customs fees)
    const total = subtotal + taxAmount

    // Create invoice data
    const invoiceData: any = {
      invoiceNumber,
      taxRate: taxAmount / subtotal, // Calculate tax rate
      taxAmount,
      subtotal,
      total,
      currency: 'SAR',
      paymentStatus: 'PENDING',
      dueDate: new Date(dueDate),
      notes: notes || null,
      // Payment tracking fields
      amountPaid: 0,
      remainingAmount: total
    }

    // Add tripId if provided
    if (tripId) {
      invoiceData.tripId = tripId
    }

    // Add customsBrokerId if available
    if (customsBrokerId) {
      invoiceData.customsBrokerId = customsBrokerId
    }
    
    // 💾 DETAILED LOG: Invoice creation data
    console.log('💾 [INVOICE CREATION] Creating invoice with data:', {
      invoiceNumber,
      tripId,
      customsBrokerId,
      total,
      subtotal,
      taxAmount,
      customsFees,
      customerName: customer?.name,
      willHaveCustomsBroker: !!customsBrokerId
    })
    
    if (customsBrokerId) {
      console.log('✅ [INVOICE CREATION] Invoice will be linked to customs broker:', customsBrokerId)
    } else {
      console.log('⚠️ [INVOICE CREATION] Invoice will NOT have customs broker link')
    }

    // Create invoice
    const includeOptions: any = {}
    if (tripId) {
      includeOptions.trip = {
        include: {
          customer: true
        }
      }
    }
    
    const invoice = await db.invoice.create({
      data: invoiceData,
      include: includeOptions
    })
    
    // 🎉 DETAILED LOG: Invoice created successfully
    console.log('🎉 [INVOICE CREATION] Invoice created successfully:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customsBrokerIdInInvoice: invoice.customsBrokerId,
      tripId: invoice.tripId,
      total: invoice.total,
      isLinkedToCustomsBroker: !!invoice.customsBrokerId
    })
    
    if (invoice.customsBrokerId) {
      console.log('✅ [INVOICE CREATION] SUCCESS: Invoice is linked to customs broker:', invoice.customsBrokerId)
      
      // Auto-create customs clearance if customs broker is assigned
      try {
        console.log('🔄 [AUTO CLEARANCE] Creating automatic clearance for invoice:', invoice.invoiceNumber)
        
        // Generate clearance number
        const clearanceCount = await db.customsClearance.count()
        const clearanceNumber = `CL-${String(clearanceCount + 1).padStart(6, '0')}`

        const clearance = await db.customsClearance.create({
          data: {
            clearanceNumber,
            invoiceId: invoice.id,
            customsBrokerId: invoice.customsBrokerId,
            customsFee: 0, // Will be updated by customs broker
            additionalFees: 0,
            totalFees: 0,
            status: "PENDING",
            notes: `Auto-created clearance for invoice ${invoice.invoiceNumber}`,
            estimatedCompletionDate: null // Will be set by customs broker
          }
        })
        
        console.log('🎉 [AUTO CLEARANCE] Created automatic clearance:', {
          clearanceId: clearance.id,
          clearanceNumber: clearance.clearanceNumber,
          invoiceNumber: invoice.invoiceNumber
        })
      } catch (clearanceError) {
        console.error('❌ [AUTO CLEARANCE] Failed to create automatic clearance:', clearanceError)
        // Don't fail the invoice creation if clearance creation fails
      }
    } else {
      console.log('❌ [INVOICE CREATION] WARNING: Invoice is NOT linked to any customs broker')
    }

    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: customer?.id,
      customerName: customer?.name,
      tripId: invoice.tripId,
      tripNumber: trip?.tripNumber || null,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFees: 0, // Regular invoices don't have customs fees
      totalAmount: invoice.total,
      status: invoice.paymentStatus,
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      currency: invoice.currency,
      notes: invoice.notes
    })
  } catch (error) {
    console.error("❌ [INVOICE CREATION] Error creating invoice:", error)
    console.error("❌ [INVOICE CREATION] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
