import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// GET - Get customer's trips tracking data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.CUSTOMER) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const tripId = searchParams.get("tripId");

    // Build where clause
    let whereClause: any = {
      customerId: session.user.id
    };

    if (activeOnly) {
      whereClause.status = "IN_PROGRESS";
    }

    if (tripId) {
      whereClause.id = tripId;
    }

    // Get customer's trips with tracking data
    const trips = await db.trip.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        fromCity: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            latitude: true,
            longitude: true
          }
        },
        toCity: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            latitude: true,
            longitude: true
          }
        },
        vehicle: {
          include: {
            vehicleType: {
              select: {
                id: true,
                name: true,
                nameAr: true
              }
            }
          }
        },
        temperature: {
          select: {
            id: true,
            option: true,
            value: true,
            unit: true
          }
        },
        trackingLogs: {
          orderBy: { timestamp: "desc" },
          take: 50 // Get last 50 tracking points
        }
      },
      orderBy: { scheduledDate: "desc" }
    });

    // Format response with tracking data for each trip
    const trackingData = trips.map((trip) => {
      const latestTracking = trip.trackingLogs[0];

      return {
        trip: {
          id: trip.id,
          tripNumber: trip.tripNumber,
          status: trip.status,
          fromCity: trip.fromCity,
          toCity: trip.toCity,
          // إضافة المواقع المخصصة من الخريطة
          originLocation:
            trip.originLat && trip.originLng
              ? {
                  lat: trip.originLat,
                  lng: trip.originLng,
                  address: `موقع مخصص: ${trip.originLat.toFixed(
                    6
                  )}, ${trip.originLng.toFixed(6)}`,
                  name: "موقع مخصص من الخريطة"
                }
              : null,
          destinationLocation:
            trip.destinationLat && trip.destinationLng
              ? {
                  lat: trip.destinationLat,
                  lng: trip.destinationLng,
                  address: `موقع مخصص: ${trip.destinationLat.toFixed(
                    6
                  )}, ${trip.destinationLng.toFixed(6)}`,
                  name: "موقع مخصص من الخريطة"
                }
              : null,
          vehicle: trip.vehicle,
          temperature: trip.temperature,
          scheduledDate: trip.scheduledDate,
          actualStartDate: trip.actualStartDate,
          deliveredDate: trip.deliveredDate,
          price: trip.price,
          notes: trip.notes,
          customer: trip.customer,
          driver: trip.driver
            ? {
                id: trip.driver.id,
                name: trip.driver.user.name,
                phone: trip.driver.user.phone,
                trackingEnabled: trip.driver.trackingEnabled
              }
            : null
        },
        currentLocation: latestTracking
          ? {
              latitude: latestTracking.latitude,
              longitude: latestTracking.longitude,
              timestamp: latestTracking.timestamp,
              speed: latestTracking.speed,
              heading: latestTracking.heading
            }
          : null,
        trackingHistory: trip.trackingLogs.map((log) => ({
          id: log.id,
          latitude: log.latitude,
          longitude: log.longitude,
          timestamp: log.timestamp,
          speed: log.speed,
          heading: log.heading
        })),
        trackingStats: {
          totalPoints: trip.trackingLogs.length,
          lastUpdate: latestTracking?.timestamp || null,
          isActive:
            trip.status === "IN_PROGRESS" && trip.trackingLogs.length > 0,
          driverTrackingEnabled: trip.driver?.trackingEnabled || false
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: trackingData,
      total: trackingData.length
    });
  } catch (error) {
    console.error("Error fetching customer tracking data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
