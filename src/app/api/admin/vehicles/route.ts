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

    const vehicles = await db.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: { vehicleType: true },
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error("Error fetching vehicles:", error)
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
    const { vehicleTypeId, vehicleNumber, isActive } = body

    if (!vehicleTypeId) {
      return NextResponse.json({ error: "vehicleTypeId is required" }, { status: 400 })
    }

    const vehicle = await db.vehicle.create({
      data: {
        vehicleTypeId,
        vehicleNumber,
        isActive: isActive ?? true,
      },
      include: { vehicleType: true },
    })

    return NextResponse.json({
      message: "Vehicle created successfully",
      vehicle,
    })
  } catch (error) {
    console.error("Error creating vehicle:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, vehicleTypeId, vehicleNumber, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        ...(vehicleTypeId ? { vehicleTypeId } : {}),
        ...(vehicleNumber !== undefined ? { vehicleNumber } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { vehicleType: true },
    })

    return NextResponse.json({
      message: "Vehicle updated successfully",
      vehicle,
    })
  } catch (error) {
    console.error("Error updating vehicle:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 })
    }

    await db.vehicle.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Vehicle deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting vehicle:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}