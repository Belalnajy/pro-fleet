import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Mock data so the Reports page buttons work end-to-end
  const range = req.nextUrl.searchParams.get("range") || "last30days";

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyRevenue = months.slice(0, 6).map((m, i) => ({
    month: m,
    revenue: 10000 + i * 1500,
    trips: 200 + i * 10,
    expenses: 6000 + i * 800,
    profit: 4000 + i * 700,
  }));

  const cityStats = [
    { city: "Riyadh", trips: 320, revenue: 18000, avgPrice: 250 },
    { city: "Jeddah", trips: 280, revenue: 16000, avgPrice: 240 },
    { city: "Dammam", trips: 200, revenue: 12000, avgPrice: 220 },
  ];

  const vehicleTypeStats = [
    { type: "TON_5", usage: 35, revenue: 12000, efficiency: 0.8 },
    { type: "TON_10", usage: 45, revenue: 18000, efficiency: 0.85 },
    { type: "REFRIGERATED", usage: 20, revenue: 14000, efficiency: 0.78 },
  ];

  const customerStats = [
    { customer: "ACME", trips: 50, revenue: 6000, avgOrderValue: 120 },
    { customer: "Globex", trips: 40, revenue: 5200, avgOrderValue: 130 },
    { customer: "Initech", trips: 35, revenue: 4300, avgOrderValue: 123 },
  ];

  const dailyStats = Array.from({ length: 14 }).map((_, i) => ({
    date: `2025-08-${(i + 1).toString().padStart(2, "0")}`,
    trips: 10 + (i % 5),
    revenue: 400 + (i * 25),
    newCustomers: (i % 3),
  }));

  const kpiData = {
    totalRevenue: monthlyRevenue.reduce((s, r) => s + r.revenue, 0),
    totalTrips: monthlyRevenue.reduce((s, r) => s + r.trips, 0),
    activeCustomers: 120,
    averageOrderValue: 245.5,
    growthRate: 5.2,
  };

  return NextResponse.json({
    reportData: { monthlyRevenue, cityStats, vehicleTypeStats, customerStats, dailyStats },
    kpiData,
    range,
  });
}
