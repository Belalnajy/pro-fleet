import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateInvoiceNumber } from "@/lib/invoice-number-generator"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.paymentStatus = status.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { trip: { tripNumber: { contains: search, mode: 'insensitive' } } },
        { trip: { customer: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    }

    // Get invoices with pagination
    const invoices = await db.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        trip: {
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true }
            },
            fromCity: { select: { name: true, nameAr: true } },
            toCity: { select: { name: true, nameAr: true } },
            driver: {
              include: {
                user: { select: { name: true } }
              }
            },
            vehicle: {
              select: {
                vehicleNumber: true,
                vehicleType: { 
                  select: { 
                    name: true, 
                    nameAr: true,
                    capacity: true 
                  } 
                }
              }
            },
            customsBroker: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    }) as any[]
    const totalCount = await db.invoice.count({ where })

    // Format invoices for frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tripNumber: invoice.trip?.tripNumber || 'N/A',
      customer: {
        id: invoice.trip?.customer?.id || invoice.customerId,
        name: invoice.customerName || invoice.trip?.customer?.name || 'عميل غير محدد',
        email: invoice.trip?.customer?.email || invoice.customerEmail,
        phone: invoice.trip?.customer?.phone
      },
      route: {
        from: invoice.trip?.fromCity?.nameAr || invoice.trip?.fromCity?.name || 'N/A',
        to: invoice.trip?.toCity?.nameAr || invoice.trip?.toCity?.name || 'N/A'
      },
      driver: invoice.trip?.driver?.user?.name || 'N/A',
      vehicle: {
        type: invoice.trip?.vehicle?.vehicleType?.nameAr || invoice.trip?.vehicle?.vehicleType?.name || 'N/A',
        capacity: invoice.trip?.vehicle?.vehicleType?.capacity || 0,
        vehicleNumber: invoice.trip?.vehicle?.vehicleNumber || 'N/A'
      },
      customsBroker: invoice.trip?.customsBroker?.user?.name || 'N/A',
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFee: 0, // Regular invoices don't have customs fees
      total: invoice.total,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      // Payment tracking fields
      amountPaid: invoice.amountPaid || 0,
      remainingAmount: invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0)),
      installmentCount: invoice.installmentCount,
      installmentsPaid: invoice.installmentsPaid || 0,
      installmentAmount: invoice.installmentAmount,
      nextInstallmentDate: invoice.nextInstallmentDate,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    }))

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
    })

  } catch (error) {
    console.error('Error fetching accountant invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/accountant/invoices - Create new invoice (with or without trip)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ACCOUNTANT") {
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
      
      // 🔍 DETAILED LOG: Trip data extraction (Accountant)
      console.log('🔍 [ACCOUNTANT INVOICE] Trip data extracted:', {
        tripId: trip?.id,
        tripNumber: trip?.tripNumber,
        customsBrokerId: trip?.customsBrokerId,
        customerName: trip?.customer?.name,
        tripStatus: trip?.status,
        hasCustomsBroker: !!trip?.customsBrokerId
      })
      
      if (trip?.customsBrokerId) {
        console.log('✅ [ACCOUNTANT INVOICE] Customs broker found in trip:', trip.customsBrokerId)
      } else {
        console.log('⚠️ [ACCOUNTANT INVOICE] No customs broker in trip')
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

    // Add tripId if provided (trip-based invoice)
    if (tripId) {
      invoiceData.tripId = tripId
    } else {
      // Manual invoice - add customer info directly
      invoiceData.customerId = customerId
      invoiceData.customerName = customer?.name
      invoiceData.customerEmail = customer?.email
    }

    // Add customsBrokerId if available
    if (customsBrokerId) {
      invoiceData.customsBrokerId = customsBrokerId
    }
    
    // 💾 DETAILED LOG: Invoice creation data (Accountant)
    console.log('💾 [ACCOUNTANT INVOICE] Creating invoice with data:', {
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
      console.log('✅ [ACCOUNTANT INVOICE] Invoice will be linked to customs broker:', customsBrokerId)
    } else {
      console.log('⚠️ [ACCOUNTANT INVOICE] Invoice will NOT have customs broker link')
    }

    // Create invoice
    // Create invoice with conditional include
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
    
    // 🎉 DETAILED LOG: Invoice created successfully (Accountant)
    console.log('🎉 [ACCOUNTANT INVOICE] Invoice created successfully:', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customsBrokerIdInInvoice: invoice.customsBrokerId,
      tripId: invoice.tripId,
      total: invoice.total,
      isLinkedToCustomsBroker: !!invoice.customsBrokerId
    })
    
    if (invoice.customsBrokerId) {
      console.log('✅ [ACCOUNTANT INVOICE] SUCCESS: Invoice is linked to customs broker:', invoice.customsBrokerId)
    } else {
      console.log('❌ [ACCOUNTANT INVOICE] WARNING: Invoice is NOT linked to any customs broker')
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
    console.error("❌ [ACCOUNTANT INVOICE] Error creating invoice:", error)
    console.error("❌ [ACCOUNTANT INVOICE] Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
