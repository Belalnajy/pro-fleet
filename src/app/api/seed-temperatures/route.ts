import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { TemperatureOption } from "@prisma/client"

export async function GET(req: NextRequest) {
  return await seedTemperatures()
}

export async function POST(req: NextRequest) {
  return await seedTemperatures()
}

async function seedTemperatures() {
  try {
    // Check if temperatures already exist
    const existingCount = await db.temperatureSetting.count()
    if (existingCount > 0) {
      return NextResponse.json({ message: "Temperature settings already exist", count: existingCount })
    }

    // Create default temperature settings
    const temperatures = await db.temperatureSetting.createMany({
      data: [
        {
          option: TemperatureOption.AMBIENT,
          value: 25,
          unit: "°C",
          isActive: true,
        },
        {
          option: TemperatureOption.PLUS_2,
          value: 2,
          unit: "°C", 
          isActive: true,
        },
        {
          option: TemperatureOption.PLUS_10,
          value: 10,
          unit: "°C",
          isActive: true,
        },
        {
          option: TemperatureOption.MINUS_18,
          value: -18,
          unit: "°C",
          isActive: true,
        },
      ],
    })

    return NextResponse.json({
      message: "Temperature settings created successfully",
      count: temperatures.count,
    })
  } catch (error) {
    console.error("Error creating temperature settings:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    )
  }
}
