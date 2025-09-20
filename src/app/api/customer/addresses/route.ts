import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Fetch customer's saved addresses
export async function GET(request: NextRequest) {
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

    // Fetch saved addresses
    const addresses = await db.savedAddress.findMany({
      where: {
        customerId: customer.id
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
      },
      orderBy: [
        { isDefault: 'desc' }, // Default addresses first
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error("Error fetching saved addresses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new saved address
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { label, address, latitude, longitude, cityId, isDefault } = body

    // Validate required fields
    if (!label || !address) {
      return NextResponse.json(
        { error: "Label and address are required" },
        { status: 400 }
      )
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await db.savedAddress.updateMany({
        where: {
          customerId: customer.id,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      })
    }

    // Create new saved address
    const savedAddress = await db.savedAddress.create({
      data: {
        customerId: customer.id,
        label,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        cityId: cityId || null,
        isDefault: isDefault || false
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

    return NextResponse.json(savedAddress, { status: 201 })
  } catch (error) {
    console.error("Error creating saved address:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
