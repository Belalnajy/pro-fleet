import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTripNumber } from "@/lib/trip-number-generator";
import { UserRole } from "@prisma/client";
import { getLocationDisplayName } from "@/lib/city-coordinates";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const hasInvoice = searchParams.get("hasInvoice");

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Filter trips without invoices if requested
    if (hasInvoice === "false") {
      where.invoice = null;
    }

    const trips = await db.trip.findMany({
      where,
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
        },
        customsBroker: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledDate: "desc"
      }
    });

    // إضافة معلومات المواقع المخصصة
    const tripsWithLocations = trips.map((trip) => ({
      ...trip,
      // إضافة المواقع المخصصة من الخريطة (مدن محفوظة أو مواقع مخصصة)
      originLocation:
        trip.originLat && trip.originLng
          ? (() => {
              const locationInfo = getLocationDisplayName(
                trip.originLat,
                trip.originLng
              );
              return {
                lat: trip.originLat,
                lng: trip.originLng,
                address: locationInfo.isKnownCity
                  ? locationInfo.name
                  : `موقع مخصص: ${trip.originLat.toFixed(
                      6
                    )}, ${trip.originLng.toFixed(6)}`,
                name: locationInfo.isKnownCity
                  ? locationInfo.name
                  : "موقع مخصص",
                isKnownCity: locationInfo.isKnownCity
              };
            })()
          : null,
      destinationLocation:
        trip.destinationLat && trip.destinationLng
          ? (() => {
              const locationInfo = getLocationDisplayName(
                trip.destinationLat,
                trip.destinationLng
              );
              return {
                lat: trip.destinationLat,
                lng: trip.destinationLng,
                address: locationInfo.isKnownCity
                  ? locationInfo.name
                  : `موقع مخصص: ${trip.destinationLat.toFixed(
                      6
                    )}, ${trip.destinationLng.toFixed(6)}`,
                name: locationInfo.name,
                isKnownCity: locationInfo.isKnownCity
              };
            })()
          : null
    }));

    return NextResponse.json({
      trips: tripsWithLocations
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 🔍 LOG: Trip creation request data
    console.log("🔍 [TRIP CREATION] Request data received:", {
      customerId: body.customerId,
      driverId: body.driverId,
      vehicleId: body.vehicleId,
      fromCityId: body.fromCityId,
      toCityId: body.toCityId,
      temperatureId: body.temperatureId,
      customsBrokerId: body.customsBrokerId,
      scheduledDate: body.scheduledDate,
      price: body.price,
      notes: body.notes,
      hasCustomsBroker: !!body.customsBrokerId
    });

    const {
      customerId,
      driverId,
      vehicleId,
      fromCityId,
      toCityId,
      temperatureId,
      customsBrokerId,
      scheduledDate,
      price,
      notes
    } = body;

    // Convert User ID to Driver ID if needed
    let actualDriverId: string | null = null;
    if (driverId) {
      // First try as Driver ID
      let driver = await db.driver.findUnique({
        where: { id: driverId },
        include: { user: true }
      });

      if (!driver) {
        // If not found, try as User ID
        const user = await db.user.findUnique({
          where: { id: driverId },
          include: { driverProfile: true }
        });
        if (user && user.role === "DRIVER" && user.driverProfile) {
          actualDriverId = user.driverProfile.id;
        } else {
          throw new Error(`Driver not found: ${driverId}`);
        }
      } else {
        actualDriverId = driver.id;
      }
    }

    // Generate trip number with new format: PRO + YYYYMMDD + sequential number
    const tripCount = await db.trip.count();
    const tripNumber = generateTripNumber(tripCount);

    // 💾 LOG: Trip creation data before saving
    const tripData = {
      tripNumber,
      customerId,
      driverId: actualDriverId,
      vehicleId,
      fromCityId,
      toCityId,
      temperatureId,
      customsBrokerId:
        customsBrokerId && customsBrokerId !== "none" ? customsBrokerId : null,
      scheduledDate: new Date(scheduledDate),
      price,
      currency: "SAR",
      notes
    };

    console.log("💾 [TRIP CREATION] Creating trip with data:", {
      ...tripData,
      willHaveCustomsBroker: !!tripData.customsBrokerId,
      customsBrokerProcessed:
        customsBrokerId && customsBrokerId !== "none" ? customsBrokerId : "null"
    });

    const trip = await db.trip.create({
      data: tripData
    });

    // 🎉 LOG: Trip created successfully
    console.log("🎉 [TRIP CREATION] Trip created successfully:", {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      customsBrokerIdInTrip: (trip as any).customsBrokerId,
      hasCustomsBroker: !!(trip as any).customsBrokerId,
      status: trip.status
    });

    if ((trip as any).customsBrokerId) {
      console.log(
        "✅ [TRIP CREATION] SUCCESS: Trip is linked to customs broker:",
        (trip as any).customsBrokerId
      );
    } else {
      console.log(
        "⚠️ [TRIP CREATION] WARNING: Trip is NOT linked to any customs broker"
      );
    }

    return NextResponse.json({
      message: "Trip created successfully",
      trip
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.toString() },
      { status: 500 }
    );
  }
}
