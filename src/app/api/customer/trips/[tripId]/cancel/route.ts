import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { TripStatus } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "غير مصرح لك بالوصول" },
        { status: 401 }
      )
    }

    const { tripId } = params

    // Get trip details
    const trip = await db.trip.findUnique({
      where: {
        id: tripId,
        customerId: session.user.id,
      },
      include: {
        customer: true,
      },
    })

    if (!trip) {
      return NextResponse.json(
        { error: "الرحلة غير موجودة" },
        { status: 404 }
      )
    }

    // Check if trip can be cancelled
    if (trip.status !== TripStatus.PENDING) {
      return NextResponse.json(
        { error: "لا يمكن إلغاء هذه الرحلة" },
        { status: 400 }
      )
    }

    // Get system settings for cancellation policy
    const settingsRecords = await db.systemSetting.findMany()
    const settings = settingsRecords.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const freeCancellationMinutes = parseInt(settings['operations.freeCancellationMinutes'] || '10')
    const cancellationFeePercentage = parseFloat(settings['operations.cancellationFeePercentage'] || '20')

    // Calculate time difference
    const now = new Date()
    const tripCreated = new Date(trip.createdAt)
    const minutesDifference = Math.floor((now.getTime() - tripCreated.getTime()) / (1000 * 60))

    // Determine if cancellation fee applies
    const isFreeCancel = minutesDifference <= freeCancellationMinutes
    const cancellationFee = isFreeCancel ? 0 : (trip.price * cancellationFeePercentage) / 100

    // Update trip status to cancelled
    const updatedTrip = await db.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        deliveredDate: now, // Using deliveredDate as cancellation date
        notes: trip.notes 
          ? `${trip.notes}\n\nتم الإلغاء في: ${now.toLocaleString('ar-SA')} - رسوم الإلغاء: ${cancellationFee} ريال`
          : `تم الإلغاء في: ${now.toLocaleString('ar-SA')} - رسوم الإلغاء: ${cancellationFee} ريال`
      },
      include: {
        fromCity: true,
        toCity: true,
        customer: true,
        driver: {
          include: {
            user: true,
          },
        },
        vehicle: {
          include: {
            vehicleType: true,
          },
        },
        temperature: true,
      },
    })

    // Create cancellation fee invoice if applicable
    if (cancellationFee > 0) {
      const invoiceNumber = `INV-${Date.now()}`
      
      await db.invoice.create({
        data: {
          invoiceNumber,
          customer: {
            connect: { id: session.user.id }
          },
          trip: {
            connect: { id: trip.id }
          },
          subtotal: cancellationFee,
          taxAmount: 0, // No tax on cancellation fees
          customsFees: 0,
          totalAmount: cancellationFee,
          status: "PENDING",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          currency: trip.currency || "SAR",
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: isFreeCancel 
        ? "تم إلغاء الرحلة بنجاح بدون رسوم"
        : `تم إلغاء الرحلة. رسوم الإلغاء: ${cancellationFee} ريال`,
      trip: updatedTrip,
      cancellationFee,
      isFreeCancel,
      minutesElapsed: minutesDifference,
      freeCancellationMinutes,
    })

  } catch (error) {
    console.error("Error cancelling trip:", error)
    return NextResponse.json(
      { error: "حدث خطأ أثناء إلغاء الرحلة" },
      { status: 500 }
    )
  }
}
