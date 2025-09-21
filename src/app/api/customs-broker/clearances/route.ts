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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = {
      customsBrokerId: session.user.id
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

    const body = await request.json()
    const { invoiceId, customsFee, additionalFees, notes, estimatedCompletionDate } = body

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

    const totalFees = (customsFee || 0) + (additionalFees || 0)

    const clearance = await prisma.customsClearance.create({
      data: {
        clearanceNumber,
        invoiceId,
        customsBrokerId: session.user.id,
        customsFee: customsFee || 0,
        additionalFees: additionalFees || 0,
        totalFees,
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

    return NextResponse.json(clearance, { status: 201 })
  } catch (error) {
    console.error('Error creating customs clearance:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
