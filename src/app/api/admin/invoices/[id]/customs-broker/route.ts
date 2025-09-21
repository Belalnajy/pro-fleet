import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH /api/admin/invoices/[id]/customs-broker - Update customs broker for invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { customsBrokerId } = await request.json()
    const invoiceId = params.id

    // Validate invoice exists
    const existingInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        trip: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Validate customs broker exists if provided
    if (customsBrokerId) {
      const customsBroker = await db.customsBroker.findUnique({
        where: { id: customsBrokerId },
        include: {
          user: true
        }
      })

      if (!customsBroker) {
        return NextResponse.json({ error: "Customs broker not found" }, { status: 404 })
      }
    }

    // Update invoice with customs broker
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: {
        customsBrokerId: customsBrokerId || null,
        updatedAt: new Date()
      },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        },
        customsBroker: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedInvoice.id,
      invoiceNumber: updatedInvoice.invoiceNumber,
      customsBrokerId: updatedInvoice.customsBrokerId,
      customsBroker: updatedInvoice.customsBroker ? {
        id: updatedInvoice.customsBroker.id,
        name: updatedInvoice.customsBroker.user.name,
        email: updatedInvoice.customsBroker.user.email,
        licenseNumber: updatedInvoice.customsBroker.licenseNumber
      } : null,
      message: "Customs broker updated successfully"
    })

  } catch (error) {
    console.error("Error updating customs broker for invoice:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
