import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole, TripStatus } from "@prisma/client";

// PUT - Update trip status with auto-invoice generation
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = params.id;
    const body = await req.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(TripStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get current trip
    const currentTrip = await db.trip.findUnique({
      where: { id: tripId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        driver: {
          include: { 
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
        },
        fromCity: true,
        toCity: true,
        vehicle: {
          include: {
            vehicleType: true
          }
        },
        invoice: true,
      },
    });

    if (!currentTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Get driver profile if user is a driver
    let driverProfile: { id: string } | null = null;
    if (session.user.role === UserRole.DRIVER) {
      driverProfile = await db.driver.findFirst({
        where: { userId: session.user.id },
        select: { id: true }
      });
    }

    // Check permissions
    const canUpdate =
      session.user.role === UserRole.ADMIN ||
      (session.user.role === UserRole.DRIVER &&
        driverProfile &&
        currentTrip.driverId === driverProfile.id) ||
      (session.user.role === UserRole.CUSTOMER &&
        currentTrip.customerId === session.user.id);

    if (!canUpdate) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prepare update data
    let updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    // Handle status-specific updates
    switch (status) {
      case TripStatus.IN_PROGRESS:
        if (!currentTrip.actualStartDate) {
          updateData.actualStartDate = new Date();
        }
        // Only drivers can set trips to IN_PROGRESS
        if (session.user.role === UserRole.DRIVER && !currentTrip.driverId && driverProfile) {
          updateData.driverId = driverProfile.id;
        }
        break;

      case TripStatus.DELIVERED:
        if (!currentTrip.deliveredDate) {
          updateData.deliveredDate = new Date();
        }
        // Ensure actualStartDate is set if not already
        if (!currentTrip.actualStartDate) {
          updateData.actualStartDate =
            currentTrip.actualStartDate || new Date();
        }
        break;

      case TripStatus.CANCELLED:
        // Only clear driver assignment if admin or customer cancels
        if (
          session.user.role === UserRole.ADMIN ||
          session.user.role === UserRole.CUSTOMER
        ) {
          updateData.driverId = null;
        }
        updateData.actualStartDate = null;
        updateData.deliveredDate = null;
        break;

      case TripStatus.PENDING:
        // Reset trip to pending state
        updateData.actualStartDate = null;
        updateData.deliveredDate = null;
        break;
    }

    // Update trip in transaction
    const result = await db.$transaction(async (tx) => {
      // Update the trip
      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          driver: {
            include: { 
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
          },
          fromCity: true,
          toCity: true,
          vehicle: {
            include: {
              vehicleType: true
            }
          },
          invoice: true,
        },
      });

      let invoice: any = null;

      // Auto-generate invoice if trip is delivered and no invoice exists
      if (status === TripStatus.DELIVERED && !(currentTrip as any).invoice) {
        const subtotal = updatedTrip.price;
        const taxRate = 0.15; // 15% VAT
        const taxAmount = subtotal * taxRate;
        const customsFee = Math.floor(Math.random() * 300) + 50;
        const total = subtotal + taxAmount + customsFee;

        const invoiceNumber = `INV-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;
        const deliveryDate = updatedTrip.deliveredDate || new Date();
        const dueDate = new Date(deliveryDate);
        dueDate.setDate(dueDate.getDate() + 30);

        invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            tripId: updatedTrip.id,
            customsFee,
            taxRate,
            taxAmount,
            subtotal,
            total,
            currency: updatedTrip.currency,
            paymentStatus: "PENDING" as const,
            dueDate,
            notes: `Auto-generated invoice for trip ${updatedTrip.tripNumber}`,
          },
        });

        console.log(
          `📧 Auto-generated invoice ${invoiceNumber} for delivered trip ${updatedTrip.tripNumber}`
        );
      }

      return { trip: updatedTrip, invoice };
    });

    // Log the status change
    console.log(
      `📊 Trip ${currentTrip.tripNumber} status changed from ${currentTrip.status} to ${status} by ${session.user.name} (${session.user.role})`
    );

    // Prepare response
    const response: any = {
      message: `Trip status updated to ${status}`,
      trip: {
        id: result.trip.id,
        tripNumber: result.trip.tripNumber,
        status: result.trip.status,
        fromCity: (result.trip as any).fromCity?.name || "Unknown",
        toCity: (result.trip as any).toCity?.name || "Unknown",
        scheduledDate: result.trip.scheduledDate,
        actualStartDate: result.trip.actualStartDate,
        deliveredDate: result.trip.deliveredDate,
        customer: (result.trip as any).customer?.name || "Unknown",
        driver: (result.trip as any).driver?.user?.name || null,
      },
    };

    if (result.invoice) {
      response.invoice = {
        id: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        total: result.invoice.total,
        currency: result.invoice.currency,
        dueDate: result.invoice.dueDate,
        message: "Invoice automatically generated",
      };
    }

    // In a real app, you would emit Socket.IO events here for real-time updates
    // io.to(`trip-${tripId}`).emit('status-update', response)
    // io.to(`user-${currentTrip.customerId}`).emit('trip-update', response)

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
