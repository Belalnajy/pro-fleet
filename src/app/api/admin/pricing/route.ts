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

    const pricing = await db.pricing.findMany({
      include: {
        fromCity: true,
        toCity: true,
        vehicle: { include: { vehicleType: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(pricing)
  } catch (error) {
    console.error("Error fetching pricing:", error)
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
    const { fromCityId, toCityId, vehicleId, quantity, price, currency } = body

    // Check if pricing already exists for this route and vehicle
    const existingPricing = await db.pricing.findFirst({
      where: {
        fromCityId,
        toCityId,
        vehicleId,
      },
    })

    if (existingPricing) {
      return NextResponse.json(
        { error: "Pricing already exists for this route and vehicle" },
        { status: 400 }
      )
    }

    const pricing = await db.pricing.create({
      data: {
        fromCityId,
        toCityId,
        vehicleId,
        quantity: quantity || 1,
        price,
        currency: currency || "SAR",
      },
      include: {
        fromCity: true,
        toCity: true,
        vehicle: { include: { vehicleType: true } },
      },
    })

    return NextResponse.json({
      message: "Pricing created successfully",
      pricing,
    })
  } catch (error) {
    console.error("Error creating pricing:", error)
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
    const { id, fromCityId, toCityId, vehicleId, quantity, price, currency } = body

    const pricing = await db.pricing.update({
      where: { id },
      data: {
        fromCityId,
        toCityId,
        vehicleId,
        quantity,
        price,
        currency,
      },
      include: {
        fromCity: true,
        toCity: true,
        vehicle: { include: { vehicleType: true } },
      },
    })

    return NextResponse.json({
      message: "Pricing updated successfully",
      pricing,
    })
  } catch (error) {
    console.error("Error updating pricing:", error)
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
      return NextResponse.json({ error: "Pricing ID required" }, { status: 400 })
    }

    await db.pricing.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "Pricing deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting pricing:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}