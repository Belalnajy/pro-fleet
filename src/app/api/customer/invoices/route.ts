import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customer invoices API called - FIXED VERSION')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { userId: session.user.id, role: session.user.role } : 'No session')
    
    if (!session || session.user.role !== "CUSTOMER") {
      console.log('❌ Unauthorized access to customer invoices API')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch real invoices from the database
    // Include both trip-based invoices and direct customer invoices (manual invoices)
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          // Invoices with trips where the customer is the trip's customer
          {
            trip: {
              customerId: session.user.id
            }
          },
          // Direct customer invoices (manual invoices without a trip)
          {
            customerId: session.user.id,
            tripId: null
          }
        ]
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
            scheduledDate: true,
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
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform database invoices to match frontend interface
    const formattedInvoices = invoices.map((invoice) => {
      // For manual invoices (no trip), provide default values
      if (!invoice.trip) {
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tripId: null,
          tripNumber: null,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          customsFees: 0,
          totalAmount: invoice.total,
          status: invoice.paymentStatus,
          paymentStatus: invoice.paymentStatus,
          dueDate: invoice.dueDate.toISOString(),
          paidDate: invoice.paidDate?.toISOString() || null,
          amountPaid: invoice.amountPaid || 0,
          remainingAmount: invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0)),
          installmentCount: invoice.installmentCount || null,
          installmentsPaid: invoice.installmentsPaid || 0,
          installmentAmount: invoice.installmentAmount || null,
          nextInstallmentDate: invoice.nextInstallmentDate?.toISOString() || null,
          payments: [],
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
          currency: invoice.currency,
          taxRate: invoice.taxRate,
          notes: invoice.notes,
          // Default trip details for manual invoices
          trip: {
            fromCity: 'غير محدد',
            toCity: 'غير محدد',
            deliveredDate: null,
            scheduledDate: invoice.createdAt.toISOString()
          },
          customsBroker: null
        };
      }

      // For invoices with trips
      const invoiceWithRelations = invoice as typeof invoice & {
        trip: {
          id: string;
          tripNumber: string;
          fromCity: { name: string; nameAr: string | null };
          toCity: { name: string; nameAr: string | null };
          deliveredDate: Date | null;
          scheduledDate: Date;
          customsBroker: {
            id: string;
            licenseNumber: string | null;
            user: {
              name: string;
            };
          } | null;
        };
      };

      return {
        id: invoiceWithRelations.id,
        invoiceNumber: invoiceWithRelations.invoiceNumber,
        tripId: invoiceWithRelations.tripId,
        tripNumber: invoiceWithRelations.trip?.tripNumber || null,
        subtotal: invoiceWithRelations.subtotal,
        taxAmount: invoiceWithRelations.taxAmount,
        customsFees: 0, // Regular invoices don't have customs fees directly
        totalAmount: invoiceWithRelations.total,
        status: invoiceWithRelations.paymentStatus,
        paymentStatus: invoiceWithRelations.paymentStatus,
        dueDate: invoiceWithRelations.dueDate.toISOString(),
        paidDate: invoiceWithRelations.paidDate?.toISOString() || null,
        amountPaid: invoiceWithRelations.amountPaid || 0,
        remainingAmount: invoiceWithRelations.remainingAmount || (invoiceWithRelations.total - (invoiceWithRelations.amountPaid || 0)),
        installmentCount: invoiceWithRelations.installmentCount || null,
        installmentsPaid: invoiceWithRelations.installmentsPaid || 0,
        installmentAmount: invoiceWithRelations.installmentAmount || null,
        nextInstallmentDate: invoiceWithRelations.nextInstallmentDate?.toISOString() || null,
        payments: [],
        createdAt: invoiceWithRelations.createdAt.toISOString(),
        updatedAt: invoiceWithRelations.updatedAt.toISOString(),
        currency: invoiceWithRelations.currency,
        taxRate: invoiceWithRelations.taxRate,
        notes: invoiceWithRelations.notes,
        // Trip details for display
        trip: {
          fromCity: invoiceWithRelations.trip?.fromCity?.nameAr || invoiceWithRelations.trip?.fromCity?.name || 'غير محدد',
          toCity: invoiceWithRelations.trip?.toCity?.nameAr || invoiceWithRelations.trip?.toCity?.name || 'غير محدد',
          deliveredDate: invoiceWithRelations.trip?.deliveredDate?.toISOString(),
          scheduledDate: invoiceWithRelations.trip?.scheduledDate?.toISOString() || invoiceWithRelations.createdAt.toISOString()
        },
        customsBroker: invoiceWithRelations.trip?.customsBroker ? {
          name: invoiceWithRelations.trip.customsBroker.user.name,
          licenseNumber: invoiceWithRelations.trip.customsBroker.licenseNumber
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
