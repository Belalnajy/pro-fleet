import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trips = await db.trip.findMany({
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
      },
      orderBy: {
        scheduledDate: "desc"
      }
    });

    return NextResponse.json(trips);
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
    const {
      customerId,
      driverId,
      vehicleId,
      fromCityId,
      toCityId,
      temperatureId,
      scheduledDate,
      price,
      notes
    } = body;

    // Convert User ID to Driver ID if needed
    let actualDriverId: string | null = null
    if (driverId) {
      // First try as Driver ID
      let driver = await db.driver.findUnique({ 
        where: { id: driverId },
        include: { user: true }
      })
      
      if (!driver) {
        // If not found, try as User ID
        const user = await db.user.findUnique({ 
          where: { id: driverId },
          include: { driverProfile: true }
        })
        if (user && user.role === 'DRIVER' && user.driverProfile) {
          actualDriverId = user.driverProfile.id
        } else {
          throw new Error(`Driver not found: ${driverId}`)
        }
      } else {
        actualDriverId = driver.id
      }
    }

    // Generate trip number
    const tripCount = await db.trip.count();
    const tripNumber = `TWB:${String(tripCount + 1).padStart(4, "0")}`;

    const trip = await db.trip.create({
      data: {
        tripNumber,
        customerId,
        driverId: actualDriverId,
        vehicleId,
        fromCityId,
        toCityId,
        temperatureId,
        scheduledDate: new Date(scheduledDate),
        price,
        currency: "SAR",
        notes,
      },
    });

    return NextResponse.json({
      message: "Trip created successfully",
      trip
    });
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.toString() },
      { status: 500 }
    )
  }
}
