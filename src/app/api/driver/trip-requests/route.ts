import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { getLocationDisplayName } from "@/lib/city-coordinates";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get driver profile
    const driver = await db.driver.findUnique({
      where: { userId: session.user.id }
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    // Get trip requests (exclude requests for cancelled trips and expired requests)
    const requests = await db.tripRequest.findMany({
      where: {
        driverId: driver.id,
        status: status as any,
        expiresAt: {
          gt: new Date() // استبعاد الطلبات المنتهية الصلاحية
        },
        trip: {
          status: {
            not: "CANCELLED" // استبعاد الرحلات الملغية
          }
        }
      },
      include: {
        trip: {
          include: {
            fromCity: true,
            toCity: true,
            customer: true,
            temperature: true,
            vehicle: {
              include: {
                vehicleType: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // إضافة معلومات المواقع المخصصة
    const requestsWithLocations = requests.map((request) => ({
      ...request,
      trip: {
        ...request.trip,
        // إضافة المواقع المخصصة من الخريطة (مدن محفوظة أو مواقع مخصصة)
        originLocation:
          request.trip.originLat && request.trip.originLng
            ? (() => {
                const locationInfo = getLocationDisplayName(
                  request.trip.originLat,
                  request.trip.originLng
                );
                return {
                  lat: request.trip.originLat,
                  lng: request.trip.originLng,
                  address: locationInfo.isKnownCity
                    ? locationInfo.name
                    : `موقع مخصص: ${request.trip.originLat.toFixed(
                        6
                      )}, ${request.trip.originLng.toFixed(6)}`,
                  name: locationInfo.isKnownCity
                    ? locationInfo.name
                    : "موقع مخصص",
                  isKnownCity: locationInfo.isKnownCity
                };
              })()
            : null,
        destinationLocation:
          request.trip.destinationLat && request.trip.destinationLng
            ? (() => {
                const locationInfo = getLocationDisplayName(
                  request.trip.destinationLat,
                  request.trip.destinationLng
                );
                return {
                  lat: request.trip.destinationLat,
                  lng: request.trip.destinationLng,
                  address: locationInfo.isKnownCity
                    ? locationInfo.name
                    : `موقع مخصص: ${request.trip.destinationLat.toFixed(
                        6
                      )}, ${request.trip.destinationLng.toFixed(6)}`,
                  name: locationInfo.isKnownCity
                    ? locationInfo.name
                    : "موقع مخصص",
                  isKnownCity: locationInfo.isKnownCity
                };
              })()
            : null
      }
    }));

    return NextResponse.json({
      requests: requestsWithLocations,
      total: requestsWithLocations.length
    });
  } catch (error) {
    console.error("Error fetching trip requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get driver profile
    const driver = await db.driver.findUnique({
      where: { userId: session.user.id }
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { requestId, action } = body; // action: 'ACCEPT' or 'REJECT'

    if (!requestId || !action || !["ACCEPT", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Get the trip request
    const tripRequest = await db.tripRequest.findUnique({
      where: {
        id: requestId,
        driverId: driver.id // تأكد أن الطلب للسائق الحالي
      },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        }
      }
    });

    if (!tripRequest) {
      return NextResponse.json(
        { error: "Trip request not found" },
        { status: 404 }
      );
    }

    if (tripRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Trip request already processed" },
        { status: 400 }
      );
    }

    // Check if request expired
    if (new Date() > tripRequest.expiresAt) {
      // Mark as expired
      await db.tripRequest.update({
        where: { id: requestId },
        data: { status: "EXPIRED" }
      });
      return NextResponse.json(
        { error: "Trip request has expired" },
        { status: 400 }
      );
    }

    if (action === "ACCEPT") {
      // Accept the trip request
      await db.$transaction(async (tx) => {
        // Update trip request status
        await tx.tripRequest.update({
          where: { id: requestId },
          data: {
            status: "ACCEPTED",
            respondedAt: new Date()
          }
        });

        // Update trip status and assign driver
        await tx.trip.update({
          where: { id: tripRequest.tripId },
          data: {
            status: "ASSIGNED",
            driverId: driver.id
          }
        });

        // Reject all other pending requests for this trip
        await tx.tripRequest.updateMany({
          where: {
            tripId: tripRequest.tripId,
            id: { not: requestId },
            status: "PENDING"
          },
          data: { status: "REJECTED" }
        });
      });

      // Send notification to customer
      await createNotification({
        userId: tripRequest.trip.customerId,
        type: "DRIVER_ACCEPTED",
        title: `تم قبول الرحلة ${tripRequest.trip.tripNumber}`,
        message: `السائق قبل رحلتك من ${tripRequest.trip.fromCity?.name} إلى ${tripRequest.trip.toCity?.name}`,
        data: {
          tripId: tripRequest.tripId,
          tripNumber: tripRequest.trip.tripNumber,
          driverId: driver.id
        }
      });

      console.log(
        `✅ Trip ${tripRequest.trip.tripNumber} accepted by driver ${driver.id}`
      );
    } else if (action === "REJECT") {
      // Reject the trip request
      await db.tripRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          respondedAt: new Date()
        }
      });

      // Check if there are other pending requests for this trip
      const otherPendingRequests = await db.tripRequest.count({
        where: {
          tripId: tripRequest.tripId,
          status: "PENDING"
        }
      });

      // If no other pending requests, cancel the trip
      if (otherPendingRequests === 0) {
        await db.trip.update({
          where: { id: tripRequest.tripId },
          data: {
            status: "CANCELLED",
            driverId: null
          }
        });

        // Send notification to customer
        await createNotification({
          userId: tripRequest.trip.customerId,
          type: "TRIP_CANCELLED",
          title: `تم إلغاء الرحلة ${tripRequest.trip.tripNumber}`,
          message: `تم إلغاء رحلتك بسبب عدم توفر سائقين. يمكنك إنشاء رحلة جديدة.`,
          data: {
            tripId: tripRequest.tripId,
            tripNumber: tripRequest.trip.tripNumber
          }
        });
      }

      if (otherPendingRequests === 0) {
        console.log(
          `🚫 Trip ${tripRequest.trip.tripNumber} cancelled - no more drivers available`
        );
      } else {
        console.log(
          `❌ Trip ${tripRequest.trip.tripNumber} rejected by driver ${driver.id} - searching for other drivers`
        );
      }
    }

    return NextResponse.json({
      success: true,
      action,
      message: action === "ACCEPT" ? "تم قبول الرحلة بنجاح" : "تم رفض الرحلة"
    });
  } catch (error) {
    console.error("Error processing trip request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
