import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { TripStatus } from "@prisma/client";
import { generateInvoiceNumber } from "@/lib/invoice-number-generator";
import {
  createTripCancelledNotification,
  createInvoiceNotification
} from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const { id: tripId } = params;

    // Get trip details
    const trip = await db.trip.findUnique({
      where: {
        id: tripId
      },
      include: {
        customer: true
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "الرحلة غير موجودة" }, { status: 404 });
    }

    // Authorize: ensure the trip belongs to the current customer
    if (trip.customerId !== session.user.id) {
      return NextResponse.json(
        { error: "غير مصرح لك بإلغاء هذه الرحلة" },
        { status: 403 }
      );
    }

    // Check if trip can be cancelled - Allow cancellation for PENDING, DRIVER_REQUESTED, and ASSIGNED
    const cancellableStatuses = [
      TripStatus.PENDING,
      "DRIVER_REQUESTED" as any,
      TripStatus.ASSIGNED
    ];
    if (!cancellableStatuses.includes(trip.status as any)) {
      return NextResponse.json(
        { error: "لا يمكن إلغاء هذه الرحلة بعد بدء التنفيذ" },
        { status: 400 }
      );
    }

    // Get system settings for cancellation policy
    const settingsRecords = await db.systemSetting.findMany();
    const settings = settingsRecords.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    const freeCancellationMinutes = parseInt(
      settings["operations.freeCancellationMinutes"] || "10"
    );
    const cancellationFeePercentage = parseFloat(
      settings["operations.cancellationFeePercentage"] || "20"
    );

    // Calculate time difference
    const now = new Date();
    const tripCreated = new Date(trip.createdAt);
    const minutesDifference = Math.floor(
      (now.getTime() - tripCreated.getTime()) / (1000 * 60)
    );

    // Determine if cancellation fee applies
    const isFreeCancel = minutesDifference <= freeCancellationMinutes;
    const cancellationFee = isFreeCancel
      ? 0
      : (trip.price * cancellationFeePercentage) / 100;

    // Update trip status to cancelled
    const updatedTrip = await db.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        deliveredDate: now, // Using deliveredDate as cancellation date
        notes: trip.notes
          ? `${trip.notes}\n\nتم الإلغاء في: ${now.toLocaleString(
              "ar-SA"
            )} - رسوم الإلغاء: ${cancellationFee} ريال`
          : `تم الإلغاء في: ${now.toLocaleString(
              "ar-SA"
            )} - رسوم الإلغاء: ${cancellationFee} ريال`
      },
      include: {
        fromCity: true,
        toCity: true,
        customer: true,
        driver: {
          include: {
            user: true
          }
        },
        vehicle: {
          include: {
            vehicleType: true
          }
        },
        temperature: true
      }
    });

    // Create cancellation fee invoice if applicable
    if (cancellationFee > 0) {
      // Generate new format invoice number
      const invoiceCount = await db.invoice.count();
      const invoiceNumber = generateInvoiceNumber(invoiceCount);

      const invoice = await db.invoice.create({
        data: {
          invoiceNumber,
          trip: {
            connect: { id: trip.id }
          },
          subtotal: cancellationFee,
          taxAmount: 0, // No tax on cancellation fees
          total: cancellationFee,
          paymentStatus: "PENDING",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          currency: trip.currency || "SAR",
          amountPaid: 0,
          remainingAmount: cancellationFee,
          notes: `رسوم إلغاء الرحلة ${trip.tripNumber} - تم الإلغاء بعد انتهاء فترة الإلغاء المجاني`
        }
      });

      // Create invoice notification
      await createInvoiceNotification(
        session.user.id,
        invoiceNumber,
        cancellationFee,
        trip.currency || "SAR",
        invoice.id
      );
    }

    // Create trip cancellation notification
    await createTripCancelledNotification(
      session.user.id,
      trip.tripNumber,
      isFreeCancel
        ? "تم إلغاء الرحلة بنجاح بدون رسوم"
        : `تم إلغاء الرحلة مع رسوم إلغاء ${cancellationFee} ريال`,
      trip.id
    );

    return NextResponse.json({
      success: true,
      message: isFreeCancel
        ? "تم إلغاء الرحلة بنجاح بدون رسوم"
        : `تم إلغاء الرحلة. رسوم الإلغاء: ${cancellationFee} ريال`,
      trip: updatedTrip,
      cancellationFee,
      isFreeCancel,
      minutesElapsed: minutesDifference,
      freeCancellationMinutes
    });
  } catch (error) {
    console.error("Error cancelling trip:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إلغاء الرحلة" },
      { status: 500 }
    );
  }
}
