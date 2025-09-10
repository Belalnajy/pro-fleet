import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { name, email, phone, role, isActive } = body

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        driverProfile: true,
        customerProfile: true,
        accountantProfile: true,
        customsBrokerProfile: true,
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { name, email, phone, role, isActive } = body

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        role,
        isActive,
      },
      include: {
        driverProfile: true,
        customerProfile: true,
        accountantProfile: true,
        customsBrokerProfile: true,
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Instead of deleting, deactivate the user
    const updatedUser = await db.user.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      message: "User deactivated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error deactivating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
