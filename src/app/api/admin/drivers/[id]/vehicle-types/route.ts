import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - Get vehicle types for a specific driver
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const driverId = params.id

    const driverVehicleTypes = await (db as any).driverVehicleType.findMany({
      where: {
        driverId: driverId
      },
      include: {
        vehicleType: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            capacity: true,
            description: true,
            isRefrigerated: true
          }
        }
      }
    })

    return NextResponse.json(driverVehicleTypes)
  } catch (error) {
    console.error("Error fetching driver vehicle types:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Add vehicle type to driver
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const driverId = params.id
    const body = await request.json()
    const { vehicleTypeId } = body

    if (!vehicleTypeId) {
      return NextResponse.json(
        { error: "Vehicle type ID is required" },
        { status: 400 }
      )
    }

    // Check if driver exists
    const driver = await db.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    // Check if vehicle type exists
    const vehicleType = await db.vehicleTypeModel.findUnique({
      where: { id: vehicleTypeId }
    })

    if (!vehicleType) {
      return NextResponse.json(
        { error: "Vehicle type not found" },
        { status: 404 }
      )
    }

    // Check if association already exists
    const existing = await (db as any).driverVehicleType.findUnique({
      where: {
        driverId_vehicleTypeId: {
          driverId: driverId,
          vehicleTypeId: vehicleTypeId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Driver already has this vehicle type" },
        { status: 400 }
      )
    }

    // Create association
    const driverVehicleType = await (db as any).driverVehicleType.create({
      data: {
        driverId: driverId,
        vehicleTypeId: vehicleTypeId
      },
      include: {
        vehicleType: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            capacity: true,
            description: true,
            isRefrigerated: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Vehicle type added to driver successfully",
      driverVehicleType
    })
  } catch (error) {
    console.error("Error adding vehicle type to driver:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove vehicle type from driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const driverId = params.id
    const body = await request.json()
    const { vehicleTypeId } = body

    if (!vehicleTypeId) {
      return NextResponse.json(
        { error: "Vehicle type ID is required" },
        { status: 400 }
      )
    }

    // Find and delete the association
    const driverVehicleType = await (db as any).driverVehicleType.findUnique({
      where: {
        driverId_vehicleTypeId: {
          driverId: driverId,
          vehicleTypeId: vehicleTypeId
        }
      }
    })

    if (!driverVehicleType) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      )
    }

    await (db as any).driverVehicleType.delete({
      where: {
        id: driverVehicleType.id
      }
    })

    return NextResponse.json({
      message: "Vehicle type removed from driver successfully"
    })
  } catch (error) {
    console.error("Error removing vehicle type from driver:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
