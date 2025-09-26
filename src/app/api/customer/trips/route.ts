import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocationDisplayName } from "@/lib/city-coordinates";
import { generateTripNumber } from "@/lib/trip-number-generator";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trips = await db.trip.findMany({
      where: {
        customerId: session.user.id
      },
      include: {
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
          select: {
            vehicleNumber: true,
            vehicleType: {
              select: {
                name: true,
                nameAr: true,
                capacity: true
              }
            }
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
          select: {
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
    });

    // Transform trips data to match frontend interface
    const transformedTrips = trips.map((trip) => ({
      id: trip.id,
      tripNumber: trip.tripNumber,
      fromCity: {
        name: trip.fromCity?.name || "غير محدد"
      },
      toCity: {
        name: trip.toCity?.name || "غير محدد"
      },
      temperature: trip.temperature
        ? {
            option: trip.temperature.option,
            value: trip.temperature.value,
            unit: trip.temperature.unit
          }
        : {
            option: "AMBIENT",
            value: 25,
            unit: "°C"
          },
      scheduledDate:
        trip.scheduledDate?.toISOString() || trip.createdAt.toISOString(),
      actualStartDate: trip.actualStartDate?.toISOString(),
      deliveredDate: trip.deliveredDate?.toISOString(),
      createdAt: trip.createdAt.toISOString(),
      status: trip.status,
      price: trip.price || 0,
      currency: trip.currency || "SAR",
      notes: trip.notes || "",
      // إضافة بيانات المواقع من الخريطة (مدن محفوظة أو مواقع مخصصة)
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
                name: locationInfo.isKnownCity
                  ? locationInfo.name
                  : "موقع مخصص",
                isKnownCity: locationInfo.isKnownCity
              };
            })()
          : null,
      driver: trip.driver
        ? {
            carPlateNumber: trip.driver.carPlateNumber,
            user: {
              name: trip.driver.user.name
            }
          }
        : null,
      vehicle: {
        type:
          trip.vehicle?.vehicleType?.name ||
          trip.vehicle?.vehicleType?.nameAr ||
          "غير محدد",
        capacity: trip.vehicle?.vehicleType?.capacity || "غير محدد"
      },
      customsBroker: trip.customsBroker
        ? {
            user: {
              name: trip.customsBroker.user.name
            }
          }
        : null
    }));

    return NextResponse.json(transformedTrips);
  } catch (error) {
    console.error("Error fetching customer trips:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      fromCityId,
      toCityId,
      temperatureId,
      scheduledDate,
      price,
      currency,
      notes,
      vehicleId,
      vehicleTypeId,
      customsBrokerId,
      driverId,
      cargoType,
      cargoWeight,
      cargoValue,
      specialInstructions,
      additionalNotes,
      originLat,
      originLng,
      destinationLat,
      destinationLng
    } = body;

    console.log("Received trip data:", body);

    // Validate required fields
    if (!fromCityId || !toCityId || !scheduledDate) {
      console.log("Missing required fields:", {
        fromCityId,
        toCityId,
        scheduledDate
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate trip number with new format: PRO + YYYYMMDD + sequential number
    const tripCount = await db.trip.count();
    const tripNumber = generateTripNumber(tripCount);

    // Use provided data or get defaults
    let finalTemperatureId = temperatureId;
    if (!finalTemperatureId) {
      const defaultTemp = await db.temperatureSetting.findFirst({
        where: {
          option: "AMBIENT"
        }
      });
      finalTemperatureId = defaultTemp?.id || null;
    }

    let finalVehicleId = vehicleId;
    let targetVehicleTypeId = vehicleTypeId;

    console.log("Vehicle selection:", { vehicleId, vehicleTypeId });

    // Check if vehicleId is actually a vehicleTypeId (common mistake from frontend)
    if (vehicleId && vehicleId === vehicleTypeId) {
      console.log("vehicleId appears to be a vehicleTypeId, clearing it...");
      finalVehicleId = null;
      targetVehicleTypeId = vehicleId;
    }

    if (!finalVehicleId) {
      // If vehicleTypeId is provided, use it; otherwise get first available
      if (!targetVehicleTypeId) {
        console.log("Looking for default vehicle type...");
        const defaultVehicleType = await db.vehicleTypeModel.findFirst({
          where: { isActive: true }
        });
        console.log("Default vehicle type found:", defaultVehicleType);
        targetVehicleTypeId = defaultVehicleType?.id;
      }

      if (targetVehicleTypeId) {
        console.log("Searching for vehicle with type:", targetVehicleTypeId);
        // Find or create a vehicle for this vehicle type
        let vehicle = await db.vehicle.findFirst({
          where: {
            vehicleTypeId: targetVehicleTypeId,
            isActive: true
          }
        });
        console.log("Existing vehicle found:", vehicle);

        if (!vehicle) {
          // Get vehicle type details for creating vehicle
          const vehicleType = await db.vehicleTypeModel.findUnique({
            where: { id: targetVehicleTypeId }
          });
          console.log("Vehicle type for creation:", vehicleType);

          if (vehicleType) {
            console.log("Creating new vehicle...");
            vehicle = await db.vehicle.create({
              data: {
                vehicleTypeId: targetVehicleTypeId,
                vehicleNumber: `AUTO-${Date.now()}`,
                isActive: true
              }
            });
            console.log("New vehicle created:", vehicle);
          }
        }

        finalVehicleId = vehicle?.id || null;
        console.log("Final vehicle ID:", finalVehicleId);
      }
    }

    const finalPrice = price || 500; // Use provided price or default

    // Validate that we have required IDs
    if (!finalTemperatureId) {
      console.error("No temperature ID available");
      return NextResponse.json(
        { error: "Temperature setting not found" },
        { status: 400 }
      );
    }

    if (!finalVehicleId) {
      console.error("No vehicle ID available");
      return NextResponse.json({ error: "Vehicle not found" }, { status: 400 });
    }

    // Verify that the vehicle exists in database
    const vehicleExists = await db.vehicle.findUnique({
      where: { id: finalVehicleId }
    });

    if (!vehicleExists) {
      console.error("Vehicle ID does not exist in database:", finalVehicleId);
      return NextResponse.json(
        { error: "Invalid vehicle ID" },
        { status: 400 }
      );
    }

    console.log("Vehicle verified:", vehicleExists);

    console.log("Creating trip with:", {
      tripNumber,
      customerId: session.user.id,
      fromCityId,
      toCityId,
      temperatureId: finalTemperatureId,
      vehicleId: finalVehicleId,
      driverId: driverId || null,
      customsBrokerId: customsBrokerId || null,
      scheduledDate,
      price: finalPrice
    });

    // Create trip
    const trip = await db.trip.create({
      data: {
        tripNumber,
        customerId: session.user.id,
        fromCityId,
        toCityId,
        temperatureId: finalTemperatureId!,
        vehicleId: finalVehicleId!,
        driverId: driverId || null,
        customsBrokerId: customsBrokerId || null,
        scheduledDate: new Date(scheduledDate),
        price: finalPrice,
        currency: currency || "SAR",
        notes: [
          notes || "Customer booking",
          cargoType ? `نوع البضاعة: ${cargoType}` : "",
          cargoWeight ? `الوزن: ${cargoWeight} كجم` : "",
          cargoValue ? `القيمة: ${cargoValue} ${currency || "SAR"}` : "",
          specialInstructions ? `تعليمات خاصة: ${specialInstructions}` : "",
          additionalNotes || ""
        ]
          .filter(Boolean)
          .join(" | "),
        status: "PENDING", // دائماً تبدأ بحالة PENDING
        // إضافة معلومات المواقع المخصصة إذا كانت متوفرة
        ...(originLat &&
          originLng && {
            originLat: parseFloat(originLat.toString()),
            originLng: parseFloat(originLng.toString())
          }),
        ...(destinationLat &&
          destinationLng && {
            destinationLat: parseFloat(destinationLat.toString()),
            destinationLng: parseFloat(destinationLng.toString())
          })
      },
      include: {
        fromCity: {
          select: {
            name: true
          }
        },
        toCity: {
          select: {
            name: true
          }
        }
      }
    });

    // إذا تم اختيار سائق، أرسل له طلب موافقة
    if (driverId) {
      try {
        // إنشاء طلب رحلة للسائق المختار
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 دقيقة للرد

        const tripRequest = await db.tripRequest.create({
          data: {
            tripId: trip.id,
            driverId: driverId,
            expiresAt
          }
        });

        // تحديث حالة الرحلة إلى DRIVER_REQUESTED
        const updatedTrip = await db.trip.update({
          where: { id: trip.id },
          data: { status: "DRIVER_REQUESTED" },
          include: {
            fromCity: {
              select: {
                name: true
              }
            },
            toCity: {
              select: {
                name: true
              }
            }
          }
        });

        // الحصول على معلومات السائق
        const driver = await db.driver.findUnique({
          where: { id: driverId },
          include: { user: true }
        });

        if (driver) {
          // إرسال إشعار للسائق
          await createNotification({
            userId: driver.userId,
            type: "TRIP_REQUEST_RECEIVED",
            title: `طلب رحلة جديدة ${trip.tripNumber}`,
            message: `من ${trip.fromCity?.name} إلى ${trip.toCity?.name} - ${trip.price} ${trip.currency}`,
            data: {
              tripId: trip.id,
              tripNumber: trip.tripNumber,
              requestId: tripRequest.id,
              expiresAt: expiresAt.toISOString(),
              fromCity: trip.fromCity?.name,
              toCity: trip.toCity?.name,
              price: trip.price,
              currency: trip.currency
            }
          });

          console.log(`✅ Trip request sent to driver: ${driver.user.name}`);
        }

        // إرجاع الرحلة المحدثة بدلاً من الأصلية
        return NextResponse.json(updatedTrip, { status: 201 });
      } catch (requestError) {
        console.error("Error sending trip request to driver:", requestError);
        // لا نفشل العملية كلها، فقط نسجل الخطأ
      }
    }

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("Error creating customer trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
