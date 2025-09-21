import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { extractCustomsBrokerFromNotes } from "@/lib/customs-broker-helper"

// POST /api/admin/trips/sync-customs-brokers - Sync customs brokers from trip notes to invoices
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all invoices that don't have customs broker assigned but have trip notes
    const invoicesWithoutBroker = await db.invoice.findMany({
      where: {
        customsBrokerId: null,
        trip: {
          notes: {
            not: null
          }
        }
      },
      include: {
        trip: {
          select: {
            id: true,
            notes: true,
            tripNumber: true
          }
        }
      }
    })

    console.log(`Found ${invoicesWithoutBroker.length} invoices without customs broker`)

    let updatedCount = 0
    const results = []

    for (const invoice of invoicesWithoutBroker) {
      try {
        // Extract customs broker from trip notes
        const customsBrokerId = await extractCustomsBrokerFromNotes(invoice.trip.notes)
        
        if (customsBrokerId) {
          // Update invoice with customs broker
          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              customsBrokerId: customsBrokerId,
              updatedAt: new Date()
            }
          })
          
          updatedCount++
          results.push({
            invoiceNumber: invoice.invoiceNumber,
            tripNumber: invoice.trip.tripNumber,
            customsBrokerId: customsBrokerId,
            status: 'updated'
          })
          
          console.log(`Updated invoice ${invoice.invoiceNumber} with customs broker ${customsBrokerId}`)
        } else {
          results.push({
            invoiceNumber: invoice.invoiceNumber,
            tripNumber: invoice.trip.tripNumber,
            customsBrokerId: null,
            status: 'no_broker_found'
          })
        }
      } catch (error) {
        console.error(`Error processing invoice ${invoice.invoiceNumber}:`, error)
        results.push({
          invoiceNumber: invoice.invoiceNumber,
          tripNumber: invoice.trip.tripNumber,
          customsBrokerId: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Sync completed. Updated ${updatedCount} out of ${invoicesWithoutBroker.length} invoices.`,
      totalProcessed: invoicesWithoutBroker.length,
      updatedCount,
      results
    })

  } catch (error) {
    console.error("Error syncing customs brokers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
