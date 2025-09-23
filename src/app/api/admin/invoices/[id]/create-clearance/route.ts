import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoiceId = params.id

    // Get the invoice with trip and customs broker info
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true,
            customsBroker: true
          }
        },
        customsBroker: true
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (!invoice.customsBrokerId) {
      return NextResponse.json({ 
        error: "Invoice does not have a customs broker assigned" 
      }, { status: 400 })
    }

    // Check if clearance already exists for this invoice
    const existingClearance = await db.customsClearance.findFirst({
      where: { invoiceId }
    })

    if (existingClearance) {
      return NextResponse.json({ 
        error: "Clearance already exists for this invoice",
        clearance: existingClearance
      }, { status: 400 })
    }

    // Generate clearance number
    const clearanceCount = await db.customsClearance.count()
    const clearanceNumber = `CL-${String(clearanceCount + 1).padStart(6, '0')}`

    // Create automatic clearance
    const clearance = await db.customsClearance.create({
      data: {
        clearanceNumber,
        invoiceId,
        customsBrokerId: invoice.customsBrokerId,
        customsFee: 0, // Will be updated by customs broker
        additionalFees: 0,
        totalFees: 0,
        status: "PENDING",
        notes: `Auto-created clearance for invoice ${invoice.invoiceNumber}`,
        estimatedCompletionDate: null // Will be set by customs broker
      },
      // No include needed for simple response
    })

    console.log('🎉 [AUTO CLEARANCE] Created automatic clearance:', {
      clearanceId: clearance.id,
      clearanceNumber: clearance.clearanceNumber,
      invoiceNumber: invoice.invoiceNumber,
      customsBrokerId: clearance.customsBrokerId
    })

    return NextResponse.json({
      success: true,
      message: "Clearance created automatically",
      clearance: {
        id: clearance.id,
        clearanceNumber: clearance.clearanceNumber,
        invoiceId: clearance.invoiceId,
        customsBrokerId: clearance.customsBrokerId,
        status: clearance.status,
        createdAt: clearance.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("❌ [AUTO CLEARANCE] Error creating automatic clearance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
