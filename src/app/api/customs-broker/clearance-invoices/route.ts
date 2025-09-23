import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/customs-broker/clearance-invoices - Get customs clearance invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")

    const skip = (page - 1) * limit

    // Get the customs broker profile
    const customsBroker = await db.customsBroker.findUnique({
      where: { userId: session.user.id }
    })

    if (!customsBroker) {
      return NextResponse.json({ error: "Customs broker profile not found" }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      customsBrokerId: customsBroker.id
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clearance: { clearanceNumber: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (status && status !== 'all') {
      where.paymentStatus = status
    }

    // Get total count for pagination
    const totalCount = await db.customsClearanceInvoice.count({ where })
    const totalPages = Math.ceil(totalCount / limit)

    // Get paginated invoices
    const invoices = await db.customsClearanceInvoice.findMany({
      where,
      include: {
        clearance: {
          select: {
            clearanceNumber: true,
            status: true,
            customsFee: true,
            additionalFees: true,
            totalFees: true,
            customsFeeType: true,
            customsFeePercentage: true,
            additionalFeesType: true,
            additionalFeesPercentage: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
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
    const transformedInvoices = invoices.map(invoice => {
      // Use fees from clearance (new system) or fallback to invoice (old system)
      const customsFee = invoice.clearance?.customsFee || invoice.customsFee || 0
      const additionalFees = invoice.clearance?.additionalFees || invoice.additionalFees || 0
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clearanceId: invoice.clearanceId,
        customsBrokerId: invoice.customsBrokerId,
        customsFee: customsFee,
        additionalFees: additionalFees,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      paymentStatus: invoice.paymentStatus,
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString(),
      // Payment tracking fields
      amountPaid: invoice.amountPaid || 0,
      remainingAmount: invoice.remainingAmount !== null ? invoice.remainingAmount : (invoice.total - (invoice.amountPaid || 0)),
      installmentCount: invoice.installmentCount,
      installmentsPaid: invoice.installmentsPaid || 0,
      installmentAmount: invoice.installmentAmount,
      nextInstallmentDate: invoice.nextInstallmentDate?.toISOString(),
        payments: invoice.payments,
        notes: invoice.notes,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        clearance: {
          ...invoice.clearance,
          // Include fee calculation details for display
          customsFeeType: invoice.clearance?.customsFeeType || 'FIXED',
          customsFeePercentage: invoice.clearance?.customsFeePercentage || 0,
          additionalFeesType: invoice.clearance?.additionalFeesType || 'FIXED',
          additionalFeesPercentage: invoice.clearance?.additionalFeesPercentage || 0
        }
      }
    })

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
    console.error("Error fetching customs clearance invoices:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
