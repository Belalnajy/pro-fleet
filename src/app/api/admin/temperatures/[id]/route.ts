import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedTemp = await db.temperatureSetting.update({
      where: { id: params.id },
      data: {
        option,
        value: Number(value),
        unit: unit || "°C",
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
    })

    return NextResponse.json(updatedTemp)
  } catch (error: any) {
    console.error("Error updating temperature:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
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

    await db.temperatureSetting.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting temperature:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
