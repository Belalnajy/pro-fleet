import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Get tracking settings for customers (public endpoint)
export async function GET() {
  try {
    // Get tracking settings from database
    const trackingEnabledSetting = await db.systemSetting.findFirst({
      where: { 
        key: "tracking.enableRealTimeTracking",
        isActive: true 
      }
    })
    
    // Default to true if no setting found
    const isTrackingEnabled = trackingEnabledSetting 
      ? trackingEnabledSetting.value === 'true' 
      : true
    
    return NextResponse.json({ 
      trackingEnabled: isTrackingEnabled 
    })
  } catch (error) {
    console.error("Error fetching tracking settings:", error)
    // Default to enabled on error
    return NextResponse.json({ 
      trackingEnabled: true 
    })
  }
}
