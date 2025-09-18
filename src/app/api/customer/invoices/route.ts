import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customer invoices API called')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { userId: session.user.id, role: session.user.role } : 'No session')
    
    if (!session || session.user.role !== "CUSTOMER") {
      console.log('❌ Unauthorized access to customer invoices API')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch real invoices from the database
    const invoices = await db.invoice.findMany({
      where: {
        trip: {
          customerId: session.user.id
        }
      },
      include: {
        trip: {
          select: {
            id: true,
            tripNumber: true,
            fromCity: {
              select: {
                name: true,
                nameAr: true
              }
            },
            toCity: {
              select: {
                name: true,
                nameAr: true
              }
            },
            deliveredDate: true,
            scheduledDate: true
          }
        },
        customsBroker: {
          select: {
            id: true,
            licenseNumber: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform database invoices to match frontend interface
    const formattedInvoices = invoices.map((invoice) => {
      // Type assertion to access included relations
      const invoiceWithRelations = invoice as typeof invoice & {
        trip: {
          id: string;
          tripNumber: string;
          fromCity: { name: string; nameAr: string | null };
          toCity: { name: string; nameAr: string | null };
          deliveredDate: Date | null;
          scheduledDate: Date;
        };
        customsBroker: {
          id: string;
          licenseNumber: string | null;
          user: {
            name: string;
          };
        } | null;
      };

      return {
        id: invoiceWithRelations.id,
        invoiceNumber: invoiceWithRelations.invoiceNumber,
        tripId: invoiceWithRelations.tripId,
        tripNumber: invoiceWithRelations.trip.tripNumber,
        subtotal: invoiceWithRelations.subtotal,
        taxAmount: invoiceWithRelations.taxAmount,
        customsFees: invoiceWithRelations.customsFee,
        totalAmount: invoiceWithRelations.total,
        status: invoiceWithRelations.paymentStatus,
        dueDate: invoiceWithRelations.dueDate.toISOString(),
        paidDate: invoiceWithRelations.paidDate?.toISOString() || null,
        createdAt: invoiceWithRelations.createdAt.toISOString(),
        updatedAt: invoiceWithRelations.updatedAt.toISOString(),
        currency: invoiceWithRelations.currency,
        taxRate: invoiceWithRelations.taxRate,
        notes: invoiceWithRelations.notes,
        // Trip details for display
        trip: {
          fromCity: invoiceWithRelations.trip.fromCity.nameAr || invoiceWithRelations.trip.fromCity.name,
          toCity: invoiceWithRelations.trip.toCity.nameAr || invoiceWithRelations.trip.toCity.name,
          deliveredDate: invoiceWithRelations.trip.deliveredDate?.toISOString(),
          scheduledDate: invoiceWithRelations.trip.scheduledDate.toISOString()
        },
        customsBroker: invoiceWithRelations.customsBroker ? {
          name: invoiceWithRelations.customsBroker.user.name,
          licenseNumber: invoiceWithRelations.customsBroker.licenseNumber
        } : null
      };
    })

    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error("Error fetching customer invoices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
