import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV, readTextFromMultipart } from "@/lib/csv";

export async function POST(req: Request) {
  try {
    const text = await readTextFromMultipart(req, "file");
    if (!text)
      return NextResponse.json({ error: "file is required" }, { status: 400 });

    const { headers, rows } = parseCSV(text);
    const required = ["vehicleType", "capacity", "description", "isActive"];
    for (const h of required)
      if (!headers.includes(h)) {
        return NextResponse.json(
          { error: `Missing header: ${h}` },
          { status: 400 }
        );
      }

    const vehicleTypeIdx = headers.indexOf("vehicleType");
    const capacityIdx = headers.indexOf("capacity");
    const descriptionIdx = headers.indexOf("description");
    const isActiveIdx = headers.indexOf("isActive");

    const created: any[] = [];
    
    // Process rows one by one to avoid long transactions
    for (const r of rows) {
      try {
        if (!r[vehicleTypeIdx]) continue;
        const vehicleTypeName = r[vehicleTypeIdx] as string;
        const capacity = r[capacityIdx];
        const description = r[descriptionIdx] || null;
        const isActive = (r[isActiveIdx] ?? "true").toLowerCase() === "true";

        const result = await db.$transaction(async (tx) => {
          // Find or create vehicle type
          let vehicleType = await tx.vehicleTypeModel.findFirst({
            where: { name: vehicleTypeName }
          });
          
          if (!vehicleType) {
            vehicleType = await tx.vehicleTypeModel.create({
              data: {
                name: vehicleTypeName,
                nameAr: vehicleTypeName, // Default to same name
                isRefrigerated: false,
                defaultTemperatureId: null,
                isActive: true
              }
            });
          }

          const v = await tx.vehicle.upsert({
            where: { 
              type_capacity: { 
                vehicleTypeId: vehicleType.id, 
                capacity: capacity 
              } 
            },
            update: { description, isActive },
            create: { 
              vehicleTypeId: vehicleType.id, 
              capacity, 
              description, 
              isActive 
            }
          });
          return v;
        });
        
        created.push(result);
      } catch (error) {
        console.error(`Error processing vehicle row:`, error);
        // Continue with next row
      }
    }

    return NextResponse.json({ count: created.length, items: created });
  } catch (e) {
    console.error("/api/imports/vehicles error", e);
    return NextResponse.json(
      { error: "Failed to import vehicles" },
      { status: 500 }
    );
  }
}
