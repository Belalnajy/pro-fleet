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

    const cities = await db.city.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(cities)
  } catch (error) {
    console.error("Error fetching cities:", error)
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
    const { name, nameAr, country, isActive } = body || {}

    if (!name || !country) {
      return NextResponse.json(
        { error: "'name' and 'country' are required" },
        { status: 400 }
      )
    }

    const newCity = await db.city.create({
      data: {
        name,
        nameAr: nameAr ?? null,
        country,
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    })

    return NextResponse.json(newCity, { status: 201 })
  } catch (error) {
    console.error("Error creating city:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, nameAr, country, isActive } = body || {}

    if (!id) {
      return NextResponse.json({ error: "'id' is required" }, { status: 400 })
    }

    const updated = await db.city.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(nameAr !== undefined ? { nameAr } : {}),
        ...(country !== undefined ? { country } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating city:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
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
    const { id } = body || {}
    if (!id) {
      return NextResponse.json({ error: "'id' is required" }, { status: 400 })
    }

    await db.city.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting city:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}