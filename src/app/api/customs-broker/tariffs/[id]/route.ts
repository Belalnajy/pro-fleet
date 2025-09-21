import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CUSTOMS_BROKER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tariff = await prisma.customsTariff.findUnique({
      where: { id: params.id }
    })

    if (!tariff) {
      return NextResponse.json({ error: "Tariff not found" }, { status: 404 })
    }

    return NextResponse.json({ tariff })
  } catch (error) {
    console.error("Error fetching tariff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      hsCode,
      description,
      descriptionAr,
      category,
      dutyRate,
      vatRate,
      additionalFees,
      isActive
    } = body

    // Validate required fields
    if (!hsCode || !description || !descriptionAr) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if HS code is already used by another tariff
    const existingTariff = await prisma.customsTariff.findFirst({
      where: {
        hsCode,
        id: { not: params.id }
      }
    })

    if (existingTariff) {
      return NextResponse.json(
        { error: "HS Code already exists" },
        { status: 400 }
      )
    }

    const updatedTariff = await prisma.customsTariff.update({
      where: { id: params.id },
      data: {
        hsCode,
        description,
        descriptionAr,
        category: category || "other",
        dutyRate: parseFloat(dutyRate) || 0,
        vatRate: parseFloat(vatRate) || 0,
        additionalFees: parseFloat(additionalFees) || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ tariff: updatedTariff })
  } catch (error) {
    console.error("Error updating tariff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tariff exists
    const tariff = await prisma.customsTariff.findUnique({
      where: { id: params.id }
    })

    if (!tariff) {
      return NextResponse.json({ error: "Tariff not found" }, { status: 404 })
    }

    // Instead of deleting, we'll mark as inactive to preserve data integrity
    const updatedTariff = await prisma.customsTariff.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ 
      message: "Tariff deactivated successfully",
      tariff: updatedTariff 
    })
  } catch (error) {
    console.error("Error deleting tariff:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
