import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
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
            carPlateNumber: true,
            user: {
              select: {
                name: true,
              },
            },
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
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      count: trips.length,
      trips: trips,
    })
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error?.toString() },
      { status: 500 }
    )
  }
}
