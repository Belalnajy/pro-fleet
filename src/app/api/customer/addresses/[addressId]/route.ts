import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PUT - Update saved address
export async function PUT(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer profile
    const customer = await db.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 })
    }

    const { addressId } = params
    const body = await request.json()
    const { label, address, latitude, longitude, cityId, isDefault } = body

    // Check if address exists and belongs to customer
    const existingAddress = await db.savedAddress.findFirst({
      where: {
        id: addressId,
        customerId: customer.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    // If this is set as default, unset other default addresses
    if (isDefault && !existingAddress.isDefault) {
      await db.savedAddress.updateMany({
        where: {
          customerId: customer.id,
          isDefault: true,
          id: { not: addressId }
        },
        data: {
          isDefault: false
        }
      })
    }

    // Update the address
    const updatedAddress = await db.savedAddress.update({
      where: { id: addressId },
      data: {
        label: label || existingAddress.label,
        address: address || existingAddress.address,
        latitude: latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : existingAddress.latitude,
        longitude: longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : existingAddress.longitude,
        cityId: cityId !== undefined ? cityId : existingAddress.cityId,
        isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            country: true
          }
        }
      }
    })

    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error("Error updating saved address:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete saved address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer profile
    const customer = await db.customer.findUnique({
      where: { userId: session.user.id }
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 404 })
    }

    const { addressId } = params

    // Check if address exists and belongs to customer
    const existingAddress = await db.savedAddress.findFirst({
      where: {
        id: addressId,
        customerId: customer.id
      }
    })

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 })
    }

    // Delete the address
    await db.savedAddress.delete({
      where: { id: addressId }
    })

    return NextResponse.json({ message: "Address deleted successfully" })
  } catch (error) {
    console.error("Error deleting saved address:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
