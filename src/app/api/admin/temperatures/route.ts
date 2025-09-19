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

    const temps = await db.temperatureSetting.findMany({
      orderBy: { value: "asc" }
    })

    return NextResponse.json(temps)
  } catch (error) {
    console.error("Error fetching temperatures:", error)
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
    const { option, value, unit, isActive } = body

    if (!option || value === undefined) {
      return NextResponse.json(
        { error: "Option and value are required" },
        { status: 400 }
      )
    }

    const newTemp = await db.temperatureSetting.create({
      data: {
        option,
        value: Number(value),
        unit: unit || "°C",
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    })

    return NextResponse.json(newTemp, { status: 201 })
  } catch (error) {
    console.error("Error creating temperature:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
