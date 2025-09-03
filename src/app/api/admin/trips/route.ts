import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const trips = await db.trip.findMany({
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        driver: {
          select: {
            name: true,
            carPlateNumber: true,
          },
        },
        vehicle: {
          select: {
            type: true,
            capacity: true,
          },
        },
        fromCity: {
          select: {
            name: true,
          },
        },
        toCity: {
          select: {
            name: true,
          },
        },
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "desc",
      },
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      customerId,
      driverId,
      vehicleId,
      fromCityId,
      toCityId,
      temperatureId,
      scheduledDate,
      price,
      notes,
    } = body

    // Generate trip number
    const tripCount = await db.trip.count()
    const tripNumber = `TWB:${String(tripCount + 1).padStart(4, '0')}`

    const trip = await db.trip.create({
      data: {
        tripNumber,
        customerId,
        driverId,
        vehicleId,
        fromCityId,
        toCityId,
        temperatureId,
        scheduledDate: new Date(scheduledDate),
        price,
        currency: "SAR",
        notes,
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        driver: {
          select: {
            name: true,
            carPlateNumber: true,
          },
        },
        vehicle: {
          select: {
            type: true,
            capacity: true,
          },
        },
        fromCity: {
          select: {
            name: true,
          },
        },
        toCity: {
          select: {
            name: true,
          },
        },
        temperature: {
          select: {
            option: true,
            value: true,
            unit: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: "Trip created successfully",
      trip,
    })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}