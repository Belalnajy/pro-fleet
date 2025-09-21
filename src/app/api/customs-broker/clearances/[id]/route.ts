import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clearance = await prisma.customsClearance.findUnique({
      where: { 
        id,
        customsBrokerId: session.user.id
      },
      include: {
        invoice: {
          include: {
            trip: {
              include: {
                customer: true,
                fromCity: true,
                toCity: true,
                vehicle: {
                  include: {
                    vehicleType: true
                  }
                },
                temperature: true
              }
            }
          }
        },
        documents: true,
        customsBroker: true
      }
    })

    if (!clearance) {
      return NextResponse.json({ error: "Clearance not found" }, { status: 404 })
    }

    return NextResponse.json(clearance)
  } catch (error) {
    console.error('Error fetching customs clearance:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, customsFee, additionalFees, notes, estimatedCompletionDate, actualCompletionDate } = body

    const clearance = await prisma.customsClearance.findUnique({
      where: { 
        id,
        customsBrokerId: session.user.id
      }
    })

    if (!clearance) {
      return NextResponse.json({ error: "Clearance not found" }, { status: 404 })
    }

    const totalFees = (customsFee || clearance.customsFee) + (additionalFees || clearance.additionalFees)

    const updatedClearance = await prisma.customsClearance.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(customsFee !== undefined && { customsFee }),
        ...(additionalFees !== undefined && { additionalFees }),
        totalFees,
        ...(notes !== undefined && { notes }),
        ...(estimatedCompletionDate && { estimatedCompletionDate: new Date(estimatedCompletionDate) }),
        ...(actualCompletionDate && { actualCompletionDate: new Date(actualCompletionDate) }),
        ...(status === 'COMPLETED' && !actualCompletionDate && { actualCompletionDate: new Date() })
      },
      include: {
        invoice: {
          include: {
            trip: {
              include: {
                customer: true,
                fromCity: true,
                toCity: true
              }
            }
          }
        },
        documents: true
      }
    })

    return NextResponse.json(updatedClearance)
  } catch (error) {
    console.error('Error updating customs clearance:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clearance = await prisma.customsClearance.findUnique({
      where: { 
        id,
        customsBrokerId: session.user.id
      }
    })

    if (!clearance) {
      return NextResponse.json({ error: "Clearance not found" }, { status: 404 })
    }

    // Don't allow deletion of completed clearances
    if (clearance.status === 'COMPLETED') {
      return NextResponse.json({ error: "Cannot delete completed clearance" }, { status: 400 })
    }

    await prisma.customsClearance.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Clearance deleted successfully" })
  } catch (error) {
    console.error('Error deleting customs clearance:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
