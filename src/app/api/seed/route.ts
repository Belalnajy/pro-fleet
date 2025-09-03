import { NextRequest, NextResponse } from "next/server"
import { seedDemoData } from "@/lib/seed-demo-data"

export async function POST(req: NextRequest) {
  try {
    await seedDemoData()
    return NextResponse.json({
      message: "Demo data seeded successfully",
      demoAccounts: {
        admin: "admin@profleet.com / demo123",
        driver: "driver@profleet.com / demo123",
        customer: "customer@profleet.com / demo123",
        accountant: "accountant@profleet.com / demo123",
        customsBroker: "broker@profleet.com / demo123",
      },
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { error: "Failed to seed demo data" },
      { status: 500 }
    )
  }
}