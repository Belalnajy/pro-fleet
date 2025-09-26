import { NextRequest, NextResponse } from "next/server";
import { expireOldTripRequests } from "@/lib/auto-assign-drivers";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Manual expire requests triggered");

    const result = await expireOldTripRequests();

    return NextResponse.json({
      success: true,
      message: `Expired ${result.expiredCount} trip requests`,
      data: result
    });
  } catch (error) {
    console.error("Error expiring requests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to expire requests",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

// GET endpoint للتشغيل التلقائي (يمكن استدعاؤه من cron job خارجي)
export async function GET(request: NextRequest) {
  try {
    console.log("🕐 Scheduled expire requests check");

    const result = await expireOldTripRequests();

    return NextResponse.json({
      success: true,
      message: `Checked and expired ${result.expiredCount} trip requests`,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in scheduled expire check:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check expired requests",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
