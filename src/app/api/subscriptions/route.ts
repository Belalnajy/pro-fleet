import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

// GET - Get subscriptions based on user role
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const active = searchParams.get("active")

    let whereClause: any = {}

    // Role-based access control
    if (session.user.role === UserRole.CUSTOMER) {
      // Customers can only see their own subscriptions
      whereClause.userId = session.user.id
    } else if (session.user.role === UserRole.ADMIN) {
      // Admin can see all or filter by userId
      if (userId) {
        whereClause.userId = userId
      }
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (active === "true") {
      whereClause.isActive = true
      whereClause.endDate = { gte: new Date() }
    }

    const subscriptions = await db.subscription.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        plan: true,
        customer: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error("Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { planId, userId, autoRenew = false } = body

    // Validate required fields
    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      )
    }

    // Determine target user
    let targetUserId = userId
    if (session.user.role === UserRole.CUSTOMER) {
      // Customers can only create subscriptions for themselves
      targetUserId = session.user.id
    } else if (!userId && session.user.role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: "userId is required for admin" },
        { status: 400 }
      )
    }

    // Get the subscription plan
    const plan = await db.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: "Subscription plan not found or inactive" },
        { status: 404 }
      )
    }

    // Get user and customer profile
    const user = await db.user.findUnique({
      where: { id: targetUserId },
      include: {
        customerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.customerProfile) {
      return NextResponse.json(
        { error: "User must have a customer profile to subscribe" },
        { status: 400 }
      )
    }

    // Check for existing active subscription
    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId: targetUserId,
        isActive: true,
        endDate: { gte: new Date() }
      }
    })

    if (existingSubscription) {
      return NextResponse.json(
        { error: "User already has an active subscription" },
        { status: 400 }
      )
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + plan.duration)

    // Create subscription
    const subscription = await db.subscription.create({
      data: {
        userId: targetUserId,
        planId: plan.id,
        customerId: user.customerProfile.id,
        startDate,
        endDate,
        isActive: true,
        autoRenew
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        plan: true,
        customer: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    // Log subscription creation
    console.log(`📋 New subscription created: ${plan.name} for ${user.name}`)

    return NextResponse.json({
      message: "Subscription created successfully",
      subscription
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update subscription (renew, cancel, etc.)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { subscriptionId, action, autoRenew } = body

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: "subscriptionId and action are required" },
        { status: 400 }
      )
    }

    // Get subscription
    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true,
        plan: true
      }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    // Check permissions
    if (session.user.role === UserRole.CUSTOMER && subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    let updateData: any = {}

    switch (action) {
      case "cancel":
        updateData = {
          isActive: false,
          autoRenew: false,
          endDate: new Date() // End immediately
        }
        break

      case "renew":
        const newEndDate = new Date(subscription.endDate)
        newEndDate.setMonth(newEndDate.getMonth() + subscription.plan.duration)
        updateData = {
          endDate: newEndDate,
          isActive: true
        }
        break

      case "toggle_auto_renew":
        updateData = {
          autoRenew: autoRenew !== undefined ? autoRenew : !subscription.autoRenew
        }
        break

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: cancel, renew, or toggle_auto_renew" },
          { status: 400 }
        )
    }

    const updatedSubscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        plan: true
      }
    })

    return NextResponse.json({
      message: `Subscription ${action} successful`,
      subscription: updatedSubscription
    })
  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
