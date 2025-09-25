import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customer clearance invoices API called')
    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { userId: session.user.id, role: session.user.role } : 'No session')
    
    if (!session || session.user.role !== "CUSTOMER") {
      console.log('❌ Unauthorized access to customer clearance invoices API')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch customs clearance invoices for the customer
    const clearanceInvoices = await db.customsClearanceInvoice.findMany({
      where: {
        clearance: {
          invoice: {
            trip: {
              customerId: session.user.id
            }
          }
        }
      },
      include: {
        clearance: {
          include: {
            invoice: {
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
                }
              }
            }
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

    // Transform database clearance invoices to match frontend interface
    const formattedInvoices = clearanceInvoices.map((invoice) => {
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clearanceId: invoice.clearanceId,
        clearanceNumber: invoice.clearance.clearanceNumber,
        tripId: invoice.clearance.invoice.trip.id,
        tripNumber: invoice.clearance.invoice.trip.tripNumber,
        customsFee: invoice.customsFee,
        additionalFees: invoice.additionalFees,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.total,
        status: invoice.paymentStatus,
        paymentStatus: invoice.paymentStatus, // أضف paymentStatus أيضاً
        dueDate: invoice.dueDate.toISOString(),
        paidDate: invoice.paidDate?.toISOString() || null,
        // Payment tracking fields
        amountPaid: invoice.amountPaid || 0,
        remainingAmount: invoice.remainingAmount || (invoice.total - (invoice.amountPaid || 0)),
        installmentCount: invoice.installmentCount || null,
        installmentsPaid: invoice.installmentsPaid || 0,
        installmentAmount: invoice.installmentAmount || null,
        nextInstallmentDate: invoice.nextInstallmentDate?.toISOString() || null,
        payments: [], // Will be loaded separately if needed
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        currency: invoice.currency,
        taxRate: invoice.taxRate,
        notes: invoice.notes,
        // Trip details for display
        trip: {
          fromCity: invoice.clearance.invoice.trip.fromCity.nameAr || invoice.clearance.invoice.trip.fromCity.name,
          toCity: invoice.clearance.invoice.trip.toCity.nameAr || invoice.clearance.invoice.trip.toCity.name,
          deliveredDate: invoice.clearance.invoice.trip.deliveredDate?.toISOString(),
          scheduledDate: invoice.clearance.invoice.trip.scheduledDate.toISOString()
        },
        customsBroker: {
          name: invoice.customsBroker.user.name,
          licenseNumber: invoice.customsBroker.licenseNumber
        },
        clearance: {
          clearanceNumber: invoice.clearance.clearanceNumber,
          status: invoice.clearance.status,
          clearanceDate: invoice.clearance.actualCompletionDate?.toISOString(),
          estimatedClearanceDate: invoice.clearance.estimatedCompletionDate?.toISOString()
        }
      };
    })

    console.log(`✅ Found ${formattedInvoices.length} clearance invoices for customer`)
    return NextResponse.json(formattedInvoices)
  } catch (error) {
    console.error("Error fetching customer clearance invoices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
