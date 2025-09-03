import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerProfile: {
          select: {
            companyName: true,
            address: true,
            taxNumber: true,
            contactPerson: true,
            website: true,
            notes: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching customer profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, customerProfile } = body

    // Update user basic info
    const updatedUser = await db.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name,
        email,
        phone,
      }
    })

    // Update or create customer profile
    if (customerProfile) {
      await db.customerProfile.upsert({
        where: {
          userId: session.user.id
        },
        update: {
          companyName: customerProfile.companyName,
          address: customerProfile.address,
          taxNumber: customerProfile.taxNumber,
          contactPerson: customerProfile.contactPerson,
          website: customerProfile.website,
          notes: customerProfile.notes,
        },
        create: {
          userId: session.user.id,
          companyName: customerProfile.companyName || "",
          address: customerProfile.address || "",
          taxNumber: customerProfile.taxNumber,
          contactPerson: customerProfile.contactPerson,
          website: customerProfile.website,
          notes: customerProfile.notes,
        }
      })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating customer profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
