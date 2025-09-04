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
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to seed demo data", details: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  // Convenience: allow GET to trigger seeding as well
  return POST(req)
}