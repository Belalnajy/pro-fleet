import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await db.user.findMany({
      include: {
        driverProfile: true,
        customerProfile: true,
        accountantProfile: true,
        customsBrokerProfile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { email, name, phone, role, password, ...profileData } = body

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role,
        },
      })

      // Create role-specific profile
      switch (role) {
        case UserRole.DRIVER:
          await tx.driver.create({
            data: {
              userId: user.id,
              nationality: profileData.nationality,
              carPlateNumber: profileData.carPlateNumber,
              carRegistration: profileData.carRegistration,
              licenseExpiry: new Date(profileData.licenseExpiry),
            },
          })
          break

        case UserRole.CUSTOMER:
          await tx.customer.create({
            data: {
              userId: user.id,
              companyName: profileData.companyName,
              address: profileData.address,
              preferredLang: profileData.preferredLang || "en",
            },
          })
          break

        case UserRole.ACCOUNTANT:
          await tx.accountant.create({
            data: {
              userId: user.id,
            },
          })
          break

        case UserRole.CUSTOMS_BROKER:
          await tx.customsBroker.create({
            data: {
              userId: user.id,
              licenseNumber: profileData.licenseNumber,
            },
          })
          break
      }

      return user
    })

    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
      },
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}