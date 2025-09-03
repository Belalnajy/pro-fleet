import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, SubscriptionType } from "@prisma/client"

// GET - Get all subscription plans
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get("activeOnly") === "true"
    const type = searchParams.get("type") as SubscriptionType | null

    let whereClause: any = {}

    if (activeOnly) {
      whereClause.isActive = true
    }

    if (type) {
      whereClause.type = type
    }

    const plans = await db.subscriptionPlan.findMany({
      where: whereClause,
      include: {
        subscriptions: {
          where: {
            isActive: true,
            endDate: { gte: new Date() }
          },
          select: {
            id: true,
            userId: true,
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: [
        { type: "asc" },
        { price: "asc" }
      ]
    })

    // Add subscriber count to each plan
    const plansWithStats = plans.map(plan => ({
      ...plan,
      activeSubscribers: plan.subscriptions.length,
      subscriptions: undefined // Remove detailed subscriptions from response
    }))

    return NextResponse.json(plansWithStats)
  } catch (error) {
    console.error("Error fetching subscription plans:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new subscription plan (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      type,
      price,
      currency = "SAR",
      duration,
      tripsIncluded,
      discountRule,
      specialOffer
    } = body

    // Validate required fields
    if (!name || !description || !type || !price || !duration) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, type, price, duration" },
        { status: 400 }
      )
    }

    // Validate type
    if (!Object.values(SubscriptionType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid subscription type. Use: INDIVIDUAL or COMPANY" },
        { status: 400 }
      )
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        description,
        type,
        price: parseFloat(price),
        currency,
        duration: parseInt(duration),
        tripsIncluded: tripsIncluded ? parseInt(tripsIncluded) : null,
        discountRule,
        specialOffer,
        isActive: true
      }
    })

    return NextResponse.json({
      message: "Subscription plan created successfully",
      plan
    })
  } catch (error) {
    console.error("Error creating subscription plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update subscription plan (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      )
    }

    // Convert numeric fields
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price)
    }
    if (updateData.duration) {
      updateData.duration = parseInt(updateData.duration)
    }
    if (updateData.tripsIncluded) {
      updateData.tripsIncluded = parseInt(updateData.tripsIncluded)
    }

    const updatedPlan = await db.subscriptionPlan.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      message: "Subscription plan updated successfully",
      plan: updatedPlan
    })
  } catch (error) {
    console.error("Error updating subscription plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete subscription plan (Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      )
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await db.subscription.count({
      where: {
        planId: id,
        isActive: true,
        endDate: { gte: new Date() }
      }
    })

    if (activeSubscriptions > 0) {
      return NextResponse.json(
        { error: `Cannot delete plan with ${activeSubscriptions} active subscriptions. Deactivate it instead.` },
        { status: 400 }
      )
    }

    await db.subscriptionPlan.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Subscription plan deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting subscription plan:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
