import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// PATCH - Update specific trip
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
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

    // Validate required fields
    if (!customerId || !vehicleId || !fromCityId || !toCityId || !temperatureId || !scheduledDate || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if trip exists
    const existingTrip = await db.trip.findUnique({
      where: { id }
    });

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Only allow editing of PENDING trips
    if (existingTrip.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cannot edit trip after it has started or been completed" },
        { status: 400 }
      );
    }

    // Update the trip
    const updatedTrip = await db.trip.update({
      where: { id },
      data: {
        customerId,
        driverId: driverId || null,
        vehicleId,
        fromCityId,
        toCityId,
        temperatureId,
        customsBrokerId: customsBrokerId && customsBrokerId !== 'none' ? customsBrokerId : null,
        scheduledDate: new Date(scheduledDate),
        price: parseFloat(price),
        notes: notes || null,
        updatedAt: new Date()
      },
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

    return NextResponse.json({ trip: updatedTrip });
  } catch (error) {
    console.error("Error updating trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific trip
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if trip exists
    const existingTrip = await db.trip.findUnique({
      where: { id }
    });

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Delete the trip
    await db.trip.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
