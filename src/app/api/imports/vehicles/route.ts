import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV, readTextFromMultipart } from "@/lib/csv";

export async function POST(req: Request) {
  try {
    const text = await readTextFromMultipart(req, "file");
    if (!text)
      return NextResponse.json({ error: "file is required" }, { status: 400 });

    const { headers, rows } = parseCSV(text);
    const required = ["type", "capacity", "description", "isActive"];
    for (const h of required)
      if (!headers.includes(h)) {
        return NextResponse.json(
          { error: `Missing header: ${h}` },
          { status: 400 }
        );
      }

    const typeIdx = headers.indexOf("type");
    const capacityIdx = headers.indexOf("capacity");
    const descriptionIdx = headers.indexOf("description");
    const isActiveIdx = headers.indexOf("isActive");

    const created: any[] = [];
    await db.$transaction(async (tx) => {
      for (const r of rows) {
        if (!r[typeIdx]) continue;
        const type = r[typeIdx] as any; // Prisma enum VehicleType
        const capacity = r[capacityIdx];
        const description = r[descriptionIdx] || null;
        const isActive = (r[isActiveIdx] ?? "true").toLowerCase() === "true";

        const v = await tx.vehicle.upsert({
          where: { type_capacity: { type, capacity } },
          update: { description, isActive },
          create: { type, capacity, description, isActive }
        });
        created.push(v);
      }
    });

    return NextResponse.json({ count: created.length, items: created });
  } catch (e) {
    console.error("/api/imports/vehicles error", e);
    return NextResponse.json(
      { error: "Failed to import vehicles" },
      { status: 500 }
    );
  }
}
