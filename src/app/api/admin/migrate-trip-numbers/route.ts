import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { generateTripNumber } from "@/lib/trip-number-generator"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // Only admin can run migration
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "غير مصرح - الأدمن فقط" }, { status: 403 })
    }

    // Get all trips with old format numbers (TWB: or TRP-)
    const tripsToUpdate = await db.trip.findMany({
      where: {
        OR: [
          { tripNumber: { startsWith: "TWB:" } },
          { tripNumber: { startsWith: "TRP-" } },
          { tripNumber: { startsWith: "INV-" } }, // In case some trips have invoice format
        ]
      },
      orderBy: { createdAt: 'asc' }, // Process in chronological order
      select: {
        id: true,
        tripNumber: true,
        createdAt: true
      }
    })

    if (tripsToUpdate.length === 0) {
      return NextResponse.json({ 
        message: "لا توجد رحلات تحتاج تحديث", 
        updated: 0 
      })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Group trips by date to maintain sequential numbering per day
    const tripsByDate = new Map<string, typeof tripsToUpdate>()
    
    for (const trip of tripsToUpdate) {
      const dateKey = trip.createdAt.toISOString().split('T')[0].replace(/-/g, '') // YYYYMMDD
      if (!tripsByDate.has(dateKey)) {
        tripsByDate.set(dateKey, [])
      }
      tripsByDate.get(dateKey)!.push(trip)
    }

    // Process each date group
    for (const [dateKey, trips] of tripsByDate.entries()) {
      let sequentialNumber = 1

      for (const trip of trips) {
        try {
          // Generate new trip number based on creation date
          const year = dateKey.substring(0, 4)
          const month = dateKey.substring(4, 6)
          const day = dateKey.substring(6, 8)
          const sequence = String(sequentialNumber).padStart(3, '0')
          
          const newTripNumber = `PRO-${year}${month}${day}-${sequence}`

          // Check if new number already exists
          const existingTrip = await db.trip.findFirst({
            where: { tripNumber: newTripNumber }
          })

          if (existingTrip) {
            // If exists, increment and try again
            sequentialNumber++
            const newSequence = String(sequentialNumber).padStart(3, '0')
            const alternativeNumber = `PRO-${year}${month}${day}-${newSequence}`
            
            const alternativeExists = await db.trip.findFirst({
              where: { tripNumber: alternativeNumber }
            })

            if (!alternativeExists) {
              // Update with alternative number
              await db.trip.update({
                where: { id: trip.id },
                data: { tripNumber: alternativeNumber }
              })

              results.push({
                oldNumber: trip.tripNumber,
                newNumber: alternativeNumber,
                status: 'success'
              })
              successCount++
            } else {
              results.push({
                oldNumber: trip.tripNumber,
                newNumber: 'conflict',
                status: 'error',
                error: 'رقم الرحلة الجديد موجود بالفعل'
              })
              errorCount++
            }
          } else {
            // Update with new number
            await db.trip.update({
              where: { id: trip.id },
              data: { tripNumber: newTripNumber }
            })

            results.push({
              oldNumber: trip.tripNumber,
              newNumber: newTripNumber,
              status: 'success'
            })
            successCount++
          }

          sequentialNumber++
        } catch (error) {
          console.error(`Error updating trip ${trip.id}:`, error)
          results.push({
            oldNumber: trip.tripNumber,
            newNumber: 'error',
            status: 'error',
            error: error instanceof Error ? error.message : 'خطأ غير معروف'
          })
          errorCount++
        }
      }
    }

    return NextResponse.json({
      message: `تم تحديث ${successCount} رحلة بنجاح، ${errorCount} خطأ`,
      totalProcessed: tripsToUpdate.length,
      successCount,
      errorCount,
      results: results.slice(0, 50) // Show first 50 results to avoid large response
    })

  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: "خطأ في تحديث أرقام الرحلات" },
      { status: 500 }
    )
  }
}

// GET endpoint to check how many trips need migration
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "غير مصرح - الأدمن فقط" }, { status: 403 })
    }

    // Count trips with old format
    const oldFormatCount = await db.trip.count({
      where: {
        OR: [
          { tripNumber: { startsWith: "TWB:" } },
          { tripNumber: { startsWith: "TRP-" } },
          { tripNumber: { startsWith: "INV-" } },
        ]
      }
    })

    // Count trips with new format
    const newFormatCount = await db.trip.count({
      where: {
        tripNumber: { startsWith: "PRO-" }
      }
    })

    // Get sample of old format trips
    const sampleOldTrips = await db.trip.findMany({
      where: {
        OR: [
          { tripNumber: { startsWith: "TWB:" } },
          { tripNumber: { startsWith: "TRP-" } },
          { tripNumber: { startsWith: "INV-" } },
        ]
      },
      select: {
        tripNumber: true,
        createdAt: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      oldFormatCount,
      newFormatCount,
      totalTrips: oldFormatCount + newFormatCount,
      needsMigration: oldFormatCount > 0,
      sampleOldTrips
    })

  } catch (error) {
    console.error("Migration check error:", error)
    return NextResponse.json(
      { error: "خطأ في فحص أرقام الرحلات" },
      { status: 500 }
    )
  }
}
