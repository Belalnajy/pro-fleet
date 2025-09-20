import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Get cancellation settings from database
    const settingsRecords = await db.systemSetting.findMany({
      where: {
        key: {
          in: [
            'operations.freeCancellationMinutes',
            'operations.cancellationFeePercentage'
          ]
        }
      }
    })

    const settings = settingsRecords.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    const freeCancellationMinutes = parseInt(settings['operations.freeCancellationMinutes'] || '10')
    const cancellationFeePercentage = parseFloat(settings['operations.cancellationFeePercentage'] || '20')

    return NextResponse.json({
      freeCancellationMinutes,
      cancellationFeePercentage,
    })

  } catch (error) {
    console.error("Error fetching cancellation settings:", error)
    return NextResponse.json(
      { 
        freeCancellationMinutes: 10,
        cancellationFeePercentage: 20,
      },
      { status: 200 }
    )
  }
}
