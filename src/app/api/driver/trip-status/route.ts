import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { TripStatus, UserRole } from "@prisma/client";

// PUT - Update trip status by driver
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tripId, status, location } = body;

    if (!tripId || !status) {
      return NextResponse.json(
        { error: "Trip ID and status are required" },
        { status: 400 }
      );
    }

    // Verify the trip belongs to this driver
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        driver: {
          userId: session.user.id
        }
      },
      include: {
        driver: true,
        customer: {
          select: { name: true, email: true }
        }
      }
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or not assigned to you" },
        { status: 404 }
      );
    }

    // Validate status transition - السماح بالانتقال لـ DELIVERED من أي حالة نشطة
    const validTransitions: Record<TripStatus, TripStatus[]> = {
      PENDING: [TripStatus.ASSIGNED, TripStatus.CANCELLED],
      DRIVER_REQUESTED: [
        TripStatus.DRIVER_ACCEPTED,
        TripStatus.DRIVER_REJECTED
      ],
      DRIVER_ACCEPTED: [TripStatus.ASSIGNED],
      DRIVER_REJECTED: [TripStatus.PENDING],
      ASSIGNED: [
        TripStatus.EN_ROUTE_PICKUP,
        TripStatus.IN_PROGRESS,
        TripStatus.DELIVERED,
        TripStatus.CANCELLED
      ],
      IN_PROGRESS: [
        TripStatus.EN_ROUTE_PICKUP,
        TripStatus.PICKED_UP,
        TripStatus.IN_TRANSIT,
        TripStatus.DELIVERED,
        TripStatus.CANCELLED
      ],
      EN_ROUTE_PICKUP: [
        TripStatus.AT_PICKUP,
        TripStatus.DELIVERED,
        TripStatus.CANCELLED
      ],
      AT_PICKUP: [
        TripStatus.PICKED_UP,
        TripStatus.DELIVERED,
        TripStatus.CANCELLED
      ],
      PICKED_UP: [
        TripStatus.IN_TRANSIT,
        TripStatus.DELIVERED,
        TripStatus.CANCELLED
      ],
      IN_TRANSIT: [
        TripStatus.AT_DESTINATION,
        TripStatus.DELIVERED,
        TripStatus.CANCELLED
      ],
      AT_DESTINATION: [TripStatus.DELIVERED, TripStatus.CANCELLED],
      DELIVERED: [], // Final state
      CANCELLED: [] // Final state
    };

    if (!validTransitions[trip.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${trip.status} to ${status}` },
        { status: 400 }
      );
    }

    // Prepare update data with timestamp
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Set appropriate timestamp based on status
    const now = new Date();
    switch (status) {
      case TripStatus.ASSIGNED:
        updateData.assignedAt = now;
        break;
      case TripStatus.EN_ROUTE_PICKUP:
        updateData.enRoutePickupAt = now;
        break;
      case TripStatus.AT_PICKUP:
        updateData.arrivedPickupAt = now;
        break;
      case TripStatus.PICKED_UP:
        updateData.pickedUpAt = now;
        break;
      case TripStatus.IN_TRANSIT:
        updateData.inTransitAt = now;
        break;
      case TripStatus.AT_DESTINATION:
        updateData.arrivedDestAt = now;
        break;
      case TripStatus.DELIVERED:
        updateData.deliveredAt = now;
        updateData.deliveredDate = now; // Keep backward compatibility
        break;
    }

    // Update trip status
    const updatedTrip = await db.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        customer: {
          select: { name: true, email: true }
        },
        driver: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        fromCity: true,
        toCity: true
      }
    });

    // إعادة السائق إلى "متاح" عند انتهاء الرحلة
    if (status === TripStatus.DELIVERED || status === TripStatus.CANCELLED) {
      await db.driver.update({
        where: { id: trip.driverId! },
        data: {
          isAvailable: true,
          trackingEnabled: false // إيقاف التتبع أيضاً
        }
      });
      console.log(
        `Driver ${
          trip.driverId
        } is now available again - Trip ${status.toLowerCase()}`
      );
    }

    // Log the status change
    if (location) {
      await db.trackingLog.create({
        data: {
          tripId,
          driverId: trip.driverId!,
          latitude: location.lat,
          longitude: location.lng,
          speed: location.speed || 0,
          heading: location.heading || 0,
          timestamp: now,
          notes: `Status changed to ${status}`
        }
      });
    }

    // Get status display names
    const statusNames: Record<TripStatus, string> = {
      PENDING: "في انتظار البدء",
      DRIVER_REQUESTED: "طلب من السائق",
      DRIVER_ACCEPTED: "السائق وافق",
      DRIVER_REJECTED: "السائق رفض",
      ASSIGNED: "تم التعيين",
      IN_PROGRESS: "جاري التنفيذ",
      EN_ROUTE_PICKUP: "في الطريق للاستلام",
      AT_PICKUP: "وصل لنقطة الاستلام",
      PICKED_UP: "تم الاستلام",
      IN_TRANSIT: "في الطريق للوجهة",
      AT_DESTINATION: "وصل للوجهة",
      DELIVERED: "تم التسليم",
      CANCELLED: "ملغية"
    };

    return NextResponse.json({
      success: true,
      message: `تم تحديث حالة الرحلة إلى: ${statusNames[status]}`,
      trip: updatedTrip,
      previousStatus: trip.status,
      newStatus: status
    });
  } catch (error) {
    console.error("Error updating trip status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get available status transitions for a trip
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.DRIVER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        driver: {
          userId: session.user.id
        }
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Available transitions based on current status
    const availableTransitions: Record<
      TripStatus,
      { status: TripStatus; label: string; color: string; icon: string }[]
    > = {
      PENDING: [
        {
          status: TripStatus.ASSIGNED,
          label: "بدء الرحلة",
          color: "blue",
          icon: "🚛"
        }
      ],
      DRIVER_REQUESTED: [],
      DRIVER_ACCEPTED: [],
      DRIVER_REJECTED: [],
      ASSIGNED: [
        {
          status: TripStatus.EN_ROUTE_PICKUP,
          label: "متوجه للاستلام",
          color: "orange",
          icon: "🛣️"
        }
      ],
      IN_PROGRESS: [
        {
          status: TripStatus.EN_ROUTE_PICKUP,
          label: "متوجه للاستلام",
          color: "orange",
          icon: "🛣️"
        },
        {
          status: TripStatus.PICKED_UP,
          label: "تم الاستلام",
          color: "green",
          icon: "📦"
        },
        {
          status: TripStatus.IN_TRANSIT,
          label: "في الطريق للوجهة",
          color: "blue",
          icon: "🚚"
        },
        {
          status: TripStatus.DELIVERED,
          label: "تم التسليم",
          color: "green",
          icon: "✅"
        }
      ],
      EN_ROUTE_PICKUP: [
        {
          status: TripStatus.AT_PICKUP,
          label: "وصلت لنقطة الاستلام",
          color: "yellow",
          icon: "📍"
        }
      ],
      AT_PICKUP: [
        {
          status: TripStatus.PICKED_UP,
          label: "تم الاستلام",
          color: "green",
          icon: "📦"
        }
      ],
      PICKED_UP: [
        {
          status: TripStatus.IN_TRANSIT,
          label: "متوجه للوجهة",
          color: "blue",
          icon: "🚚"
        }
      ],
      IN_TRANSIT: [
        {
          status: TripStatus.AT_DESTINATION,
          label: "وصلت للوجهة",
          color: "yellow",
          icon: "🏁"
        }
      ],
      AT_DESTINATION: [
        {
          status: TripStatus.DELIVERED,
          label: "تم التسليم",
          color: "green",
          icon: "✅"
        }
      ],
      DELIVERED: [],
      CANCELLED: []
    };

    return NextResponse.json({
      currentStatus: trip.status,
      availableTransitions: availableTransitions[trip.status] || []
    });
  } catch (error) {
    console.error("Error getting trip transitions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
