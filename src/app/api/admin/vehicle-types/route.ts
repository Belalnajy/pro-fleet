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

    const data = await db.vehicleTypeModel.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching vehicle types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, nameAr, capacity, description, isRefrigerated, defaultTemperatureId, isActive } = body || {}
    if (!name) return NextResponse.json({ error: "'name' is required" }, { status: 400 })

    const created = await db.vehicleTypeModel.create({
      data: {
        name,
        nameAr: nameAr ?? null,
        capacity: capacity ?? null,
        description: description ?? null,
        isRefrigerated: Boolean(isRefrigerated),
        defaultTemperatureId: defaultTemperatureId ?? null,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("Error creating vehicle type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, nameAr, capacity, description, isRefrigerated, defaultTemperatureId, isActive } = body || {}
    if (!id) return NextResponse.json({ error: "'id' is required" }, { status: 400 })

    const updated = await db.vehicleTypeModel.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nameAr !== undefined ? { nameAr } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isRefrigerated !== undefined ? { isRefrigerated: Boolean(isRefrigerated) } : {}),
        ...(defaultTemperatureId !== undefined ? { defaultTemperatureId } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating vehicle type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id } = body || {}
    if (!id) return NextResponse.json({ error: "'id' is required" }, { status: 400 })

    await db.vehicleTypeModel.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vehicle type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
