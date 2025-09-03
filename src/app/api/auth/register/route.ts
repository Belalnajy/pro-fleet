import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
  // Driver specific fields
  nationality: z.string().optional(),
  carPlateNumber: z.string().optional(),
  carRegistration: z.string().optional(),
  licenseExpiry: z.string().optional(),
  // Customer specific fields
  companyName: z.string().optional(),
  address: z.string().optional(),
  preferredLang: z.string().optional(),
  // Accountant specific fields
  // Customs Broker specific fields
  licenseNumber: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user with transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
          role: validatedData.role,
        },
      })

      // Create role-specific profile
      switch (validatedData.role) {
        case UserRole.DRIVER:
          if (!validatedData.nationality || !validatedData.carPlateNumber || !validatedData.carRegistration || !validatedData.licenseExpiry) {
            throw new Error("Driver profile requires nationality, car plate number, car registration, and license expiry")
          }
          await tx.driver.create({
            data: {
              userId: user.id,
              nationality: validatedData.nationality,
              carPlateNumber: validatedData.carPlateNumber,
              carRegistration: validatedData.carRegistration,
              licenseExpiry: new Date(validatedData.licenseExpiry),
            },
          })
          break

        case UserRole.CUSTOMER:
          await tx.customer.create({
            data: {
              userId: user.id,
              companyName: validatedData.companyName,
              address: validatedData.address,
              preferredLang: validatedData.preferredLang || "en",
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
              licenseNumber: validatedData.licenseNumber,
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
    console.error("Registration error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}