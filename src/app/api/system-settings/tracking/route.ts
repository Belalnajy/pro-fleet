import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const KEY = "tracking_enabled";

export async function GET() {
  try {
    const setting = await db.systemSetting.findUnique({ where: { key: KEY } });
    const enabled = setting ? setting.value === "true" : false;
    return NextResponse.json({ enabled });
  } catch (e) {
    console.error("GET /api/system-settings/tracking error", e);
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "'enabled' must be boolean" }, { status: 400 });
    }
    const value = body.enabled ? "true" : "false";
    const setting = await db.systemSetting.upsert({
      where: { key: KEY },
      create: { key: KEY, value },
      update: { value },
    });
    return NextResponse.json({ enabled: setting.value === "true" });
  } catch (e) {
    console.error("POST /api/system-settings/tracking error", e);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
