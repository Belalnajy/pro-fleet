import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or accountant
    if (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all active customs brokers
    const customsBrokers = await prisma.customsBroker.findMany({
      where: {
        user: {
          isActive: true,
          role: "CUSTOMS_BROKER"
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    })

    // Format the response as array (not object with brokers property)
    const brokersData = customsBrokers.map(broker => ({
      id: broker.id,
      userId: broker.userId,
      name: broker.user.name,
      email: broker.user.email,
      phone: broker.user.phone,
      licenseNumber: broker.licenseNumber,
      // Calculate current workload
      workload: 'متوسط' // This could be calculated based on active clearances
    }))

    return NextResponse.json(brokersData)

  } catch (error) {
    console.error("Error fetching customs brokers:", error)
    return NextResponse.json(
      { error: "Failed to fetch customs brokers" },
      { status: 500 }
    )
  }
}
