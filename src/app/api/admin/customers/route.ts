import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const customers = await db.user.findMany({
      where: {
        role: "CUSTOMER",
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerProfile: {
          select: {
            companyName: true,
            address: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    // Transform data to match frontend interface
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.customerProfile?.companyName || customer.name,
      email: customer.email,
      phone: customer.phone,
      companyName: customer.customerProfile?.companyName,
      address: customer.customerProfile?.address,
    }))

    return NextResponse.json(transformedCustomers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
