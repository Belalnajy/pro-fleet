import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { generateClearanceInvoiceNumber } from "@/lib/invoice-number-generator"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    console.log('🔍 [CLEARANCES] Fetching clearances for broker:', {
      brokerId: customsBroker.id,
      brokerName: customsBroker.user.name,
      userId: session.user.id
    })

    const where: any = {
      customsBrokerId: customsBroker.userId // Use customsBroker.userId to reference the User
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    const [clearances, total] = await Promise.all([
      prisma.customsClearance.findMany({
        where,
        include: {
          invoice: {
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
                  }
                }
              }
            }
          },
          documents: true,
          customsBroker: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.customsClearance.count({ where })
    ])

    return NextResponse.json({
      clearances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customs clearances:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the customs broker profile first
    const customsBroker = await prisma.customsBroker.findUnique({
      where: { userId: session.user.id }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { 
      invoiceId, 
      customsFee, 
      additionalFees, 
      notes, 
      estimatedCompletionDate,
      // New percentage fields
      customsFeeType,
      customsFeePercentage,
      additionalFeesType,
      additionalFeesPercentage
    } = body

    // Check if invoice exists and doesn't already have a clearance
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Check if clearance already exists for this invoice
    const existingClearance = await prisma.customsClearance.findFirst({
      where: { invoiceId }
    })

    if (existingClearance) {
      return NextResponse.json({ error: "Clearance already exists for this invoice" }, { status: 400 })
    }

    // Generate clearance number
    const clearanceCount = await prisma.customsClearance.count()
    const clearanceNumber = `CL-${String(clearanceCount + 1).padStart(6, '0')}`

    // Calculate actual fees based on type (fixed or percentage)
    let actualCustomsFee = 0
    let actualAdditionalFees = 0
    
    if (customsFeeType === 'PERCENTAGE' && customsFeePercentage > 0) {
      // Calculate customs fee as percentage of invoice total
      actualCustomsFee = (invoice.total * customsFeePercentage) / 100
    } else {
      actualCustomsFee = customsFee || 0
    }
    
    if (additionalFeesType === 'PERCENTAGE' && additionalFeesPercentage > 0) {
      // Calculate additional fees as percentage of invoice total
      actualAdditionalFees = (invoice.total * additionalFeesPercentage) / 100
    } else {
      actualAdditionalFees = additionalFees || 0
    }
    
    const totalFees = actualCustomsFee + actualAdditionalFees

    // Create clearance and clearance invoice in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the customs clearance
      const clearance = await tx.customsClearance.create({
        data: {
          clearanceNumber,
          invoiceId,
          customsBrokerId: customsBroker.userId,
          customsFee: actualCustomsFee,
          additionalFees: actualAdditionalFees,
          totalFees,
          // Store percentage calculation data
          customsFeeType: customsFeeType || 'FIXED',
          customsFeePercentage: customsFeePercentage || 0,
          additionalFeesType: additionalFeesType || 'FIXED',
          additionalFeesPercentage: additionalFeesPercentage || 0,
          notes,
          estimatedCompletionDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : null
        },
        include: {
          invoice: {
            include: {
              trip: {
                include: {
                  customer: true,
                  fromCity: true,
                  toCity: true
                }
              }
            }
          },
          documents: true
        }
      })

      // Generate clearance invoice number with new format: PRO-CLR- + YYYYMMDD + sequential number
      const clearanceInvoiceCount = await tx.customsClearanceInvoice.count()
      const clearanceInvoiceNumber = generateClearanceInvoiceNumber(clearanceInvoiceCount)

      // Calculate invoice amounts
      const subtotal = totalFees
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      // Create the clearance invoice
      const clearanceInvoice = await tx.customsClearanceInvoice.create({
        data: {
          invoiceNumber: clearanceInvoiceNumber,
          clearanceId: clearance.id,
          customsBrokerId: customsBroker.id, // Use customsBroker.id for CustomsClearanceInvoice
          customsFee: customsFee || 0,
          additionalFees: additionalFees || 0,
          subtotal,
          taxRate,
          taxAmount,
          total,
          remainingAmount: total, // Initially, full amount is remaining
          dueDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes
        }
      })

      return { clearance, clearanceInvoice }
    })

    return NextResponse.json(result.clearance, { status: 201 })
  } catch (error) {
    console.error('Error creating customs clearance:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
