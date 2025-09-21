import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "CUSTOMS_BROKER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hsCode = searchParams.get('hsCode')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const dutyRateMin = searchParams.get('dutyRateMin')
    const dutyRateMax = searchParams.get('dutyRateMax')
    const vatRateMin = searchParams.get('vatRateMin')
    const vatRateMax = searchParams.get('vatRateMax')
    const sortBy = searchParams.get('sortBy') || 'hsCode'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let where: any = {
      isActive: true
    }

    if (hsCode) {
      where.hsCode = hsCode
    }

    if (search) {
      where.OR = [
        { hsCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (category && category !== '') {
      where.category = category
    }
    
    if (dutyRateMin) {
      where.dutyRate = { ...where.dutyRate, gte: parseFloat(dutyRateMin) }
    }
    
    if (dutyRateMax) {
      where.dutyRate = { ...where.dutyRate, lte: parseFloat(dutyRateMax) }
    }
    
    if (vatRateMin) {
      where.vatRate = { ...where.vatRate, gte: parseFloat(vatRateMin) }
    }
    
    if (vatRateMax) {
      where.vatRate = { ...where.vatRate, lte: parseFloat(vatRateMax) }
    }

    // Get total count for pagination
    const totalCount = await prisma.customsTariff.count({ where })
    
    const tariffs = await prisma.customsTariff.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder as 'asc' | 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      tariffs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customs tariffs:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "CUSTOMS_BROKER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      hsCode, 
      description, 
      descriptionAr, 
      category,
      dutyRate, 
      vatRate, 
      additionalFees,
      isActive 
    } = body

    // Validate required fields
    if (!hsCode || !description || !descriptionAr) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if HS code already exists
    const existingTariff = await prisma.customsTariff.findUnique({
      where: { hsCode }
    })

    if (existingTariff) {
      return NextResponse.json({ error: "HS Code already exists" }, { status: 400 })
    }

    const tariff = await prisma.customsTariff.create({
      data: {
        hsCode,
        description,
        descriptionAr,
        category: category || "other",
        dutyRate: parseFloat(dutyRate) || 0,
        vatRate: parseFloat(vatRate) || 0,
        additionalFees: parseFloat(additionalFees) || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ tariff }, { status: 201 })
  } catch (error) {
    console.error('Error creating customs tariff:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Calculate customs fees for a given value and HS code
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "CUSTOMS_BROKER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { hsCode, invoiceValue, weight } = body

    if (!hsCode || !invoiceValue) {
      return NextResponse.json({ error: "HS Code and invoice value are required" }, { status: 400 })
    }

    const tariff = await prisma.customsTariff.findUnique({
      where: { hsCode, isActive: true }
    })

    if (!tariff) {
      return NextResponse.json({ error: "Tariff not found for this HS Code" }, { status: 404 })
    }

    // Calculate fees
    const dutyAmount = (invoiceValue * tariff.dutyRate) / 100
    const dutyableValue = invoiceValue + dutyAmount
    const vatAmount = (dutyableValue * tariff.vatRate) / 100
    const additionalFeesAmount = tariff.additionalFees
    const totalFees = dutyAmount + vatAmount + additionalFeesAmount

    const calculation = {
      hsCode: tariff.hsCode,
      description: tariff.description,
      descriptionAr: tariff.descriptionAr,
      invoiceValue,
      weight,
      dutyRate: tariff.dutyRate,
      vatRate: tariff.vatRate,
      dutyAmount,
      vatAmount,
      additionalFees: additionalFeesAmount,
      totalFees,
      breakdown: {
        invoiceValue,
        dutyAmount,
        dutyableValue,
        vatAmount,
        additionalFees: additionalFeesAmount,
        totalFees
      }
    }

    return NextResponse.json(calculation)
  } catch (error) {
    console.error('Error calculating customs fees:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
