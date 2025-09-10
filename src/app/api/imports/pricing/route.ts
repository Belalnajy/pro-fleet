import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV, readTextFromMultipart } from "@/lib/csv";

async function findOrCreateCity(tx: any, name: string) {
  let city = await tx.city.findFirst({ where: { name } });
  if (!city) {
    city = await tx.city.create({
      data: {
        name,
        nameAr: name, // Default to same name
        country: "Saudi Arabia",
        isActive: true,
      },
    });
  }
  return city;
}

async function findOrCreateVehicle(tx: any, vehicleTypeName: string, capacity: string) {
  // Find or create vehicle type
  let vehicleType = await tx.vehicleTypeModel.findFirst({
    where: { name: vehicleTypeName }
  });
  
  if (!vehicleType) {
    vehicleType = await tx.vehicleTypeModel.create({
      data: {
        name: vehicleTypeName,
        nameAr: vehicleTypeName,
        isRefrigerated: vehicleTypeName.toLowerCase().includes('refrigerated'),
        defaultTemperatureId: null,
        isActive: true
      }
    });
  }

  // Find or create vehicle with this type and capacity
  let vehicle = await tx.vehicle.findFirst({ 
    where: { 
      vehicleTypeId: vehicleType.id,
      capacity: capacity
    } 
  });
  
  if (!vehicle) {
    vehicle = await tx.vehicle.create({
      data: {
        vehicleTypeId: vehicleType.id,
        capacity,
        description: `Auto-created ${vehicleTypeName} - ${capacity}`,
        isActive: true,
      },
    });
  }
  return vehicle;
}

export async function POST(req: Request) {
  try {
    const text = await readTextFromMultipart(req, "file");
    if (!text) return NextResponse.json({ error: "file is required" }, { status: 400 });

    const { headers, rows } = parseCSV(text);
    const required = ["fromCity", "toCity", "vehicleType", "capacity", "quantity", "price", "currency"];
    for (const h of required) {
      if (!headers.includes(h)) {
        return NextResponse.json({ error: `Missing header: ${h}` }, { status: 400 });
      }
    }

    const idx = Object.fromEntries(required.map(k => [k, headers.indexOf(k)]));
    const created: any[] = [];

    // Process rows one by one to avoid long transactions
    for (const r of rows) {
      try {
        const fromName = r[idx.fromCity];
        const toName = r[idx.toCity];
        const vehicleTypeName = r[idx.vehicleType];
        const capacity = r[idx.capacity];
        const quantity = parseInt(r[idx.quantity] || "1");
        const price = parseFloat(r[idx.price] || "0");
        const currency = r[idx.currency] || "SAR";

        if (!fromName || !toName || !vehicleTypeName || !capacity) {
          continue; // Skip invalid rows
        }

        // Process each row in a separate transaction
        const result = await db.$transaction(async (tx) => {
          const fromCity = await findOrCreateCity(tx, fromName);
          const toCity = await findOrCreateCity(tx, toName);
          const vehicle = await findOrCreateVehicle(tx, vehicleTypeName, capacity);

          const pricing = await tx.pricing.upsert({
            where: {
              fromCityId_toCityId_vehicleId: {
                fromCityId: fromCity.id,
                toCityId: toCity.id,
                vehicleId: vehicle.id,
              },
            },
            update: { quantity, price, currency },
            create: {
              fromCityId: fromCity.id,
              toCityId: toCity.id,
              vehicleId: vehicle.id,
              quantity,
              price,
              currency,
            },
          });
          return pricing;
        });
        
        created.push(result);
      } catch (error) {
        console.error(`Error processing row:`, error);
        // Continue with next row
      }
    }

    return NextResponse.json({ count: created.length, items: created });
  } catch (e: any) {
    console.error("/api/imports/pricing error", e);
    return NextResponse.json({ error: e?.message || "Failed to import pricing" }, { status: 500 });
  }
}
