import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateInvoiceNumber } from "@/lib/invoice-number-generator";
import { UserRole, TripStatus } from "@prisma/client";

// PATCH - Update trip status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "DRIVER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(TripStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Check if trip exists
    const existingTrip = await db.trip.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        driver: {
          select: {
            carPlateNumber: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Set timestamps based on status
    if (status === TripStatus.IN_PROGRESS && !existingTrip.actualStartDate) {
      updateData.actualStartDate = new Date();
    }

    if (status === TripStatus.DELIVERED && !existingTrip.deliveredDate) {
      updateData.deliveredDate = new Date();
    }

    // Update the trip status
    const updatedTrip = await db.trip.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        driver: {
          select: {
            carPlateNumber: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        vehicle: {
          include: {
            vehicleType: true
          }
        },
        fromCity: {
          select: {
            name: true
          }
        },
        toCity: {
          select: {
            name: true
          }
        },
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true
          }
        }
      }
    });

    // Auto-generate invoice if status changed to DELIVERED
    let invoiceResult: any = null;
    if (status === TripStatus.DELIVERED) {
      try {
        // Check if invoice already exists
        const existingInvoice = await db.invoice.findFirst({
          where: { tripId: id }
        });

        if (!existingInvoice) {
          // Generate invoice number
          const invoiceCount = await db.invoice.count();
          const invoiceNumber = generateInvoiceNumber(invoiceCount);

          // Calculate invoice amounts
          const subtotal = updatedTrip.price;
          const taxRate = 0.15; // 15% VAT
          const taxAmount = subtotal * taxRate;
          const total = subtotal + taxAmount;

          // Create invoice with customs broker from trip
          const invoiceData: any = {
            invoiceNumber,
            tripId: id,
            taxRate,
            taxAmount,
            subtotal,
            total,
            currency: 'SAR', // Default currency
            paymentStatus: 'PENDING',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            // Payment tracking fields
            amountPaid: 0,
            remainingAmount: total,
            installmentsPaid: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          // Add customsBrokerId from trip if available
          if ((existingTrip as any).customsBrokerId) {
            invoiceData.customsBrokerId = (existingTrip as any).customsBrokerId
            console.log('✅ [AUTO INVOICE] Adding customs broker to invoice:', (existingTrip as any).customsBrokerId)
          } else {
            console.log('⚠️ [AUTO INVOICE] No customs broker in trip')
          }
          
          console.log('💾 [AUTO INVOICE] Creating invoice with data:', {
            invoiceNumber,
            tripId: id,
            customsBrokerId: invoiceData.customsBrokerId || null,
            total,
            hasCustomsBroker: !!invoiceData.customsBrokerId
          })

          const invoice = await db.invoice.create({
            data: invoiceData
          });
          
          console.log('🎉 [AUTO INVOICE] Invoice created successfully:', {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customsBrokerIdInInvoice: (invoice as any).customsBrokerId,
            isLinkedToCustomsBroker: !!(invoice as any).customsBrokerId
          })

          invoiceResult = {
            invoiceGenerated: true,
            invoiceNumber: invoice.invoiceNumber,
            invoiceId: invoice.id
          };
        } else {
          invoiceResult = {
            invoiceGenerated: false,
            message: 'Invoice already exists',
            invoiceNumber: existingInvoice.invoiceNumber
          };
        }
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError);
        invoiceResult = {
          invoiceGenerated: false,
          error: 'Failed to generate invoice'
        };
      }
    }

    return NextResponse.json({ 
      trip: updatedTrip,
      message: `Trip status updated to ${status}`,
      invoice: invoiceResult
    });
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
