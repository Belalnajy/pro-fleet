import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV, readTextFromMultipart } from "@/lib/csv";

import { VehicleType } from "@prisma/client";

async function findOrCreateCity(tx: any, name: string) {
  let city = await tx.city.findFirst({ where: { name } });
  if (!city) {
    city = await tx.city.create({
      data: {
        name,
        country: "Saudi Arabia", // Default country
        isActive: true,
      },
    });
  }
  return city;
}

async function findOrCreateVehicle(tx: any, type: VehicleType) {
  let vehicle = await tx.vehicle.findFirst({ where: { type } });
  if (!vehicle) {
    let capacity = "Generic Capacity";
    if (type.includes("TON")) {
      capacity = `${type.split("_")[1]} Ton Truck`;
    } else if (type === "REFRIGERATED") {
      capacity = "Refrigerated Truck";
    }
    vehicle = await tx.vehicle.create({
      data: {
        type,
        capacity,
        description: `Auto-created vehicle of type ${type}`,
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
    const required = ["from_city", "to_city", "vehicle_type", "quantity", "price", "currency"];
    for (const h of required) {
      if (!headers.includes(h)) {
        return NextResponse.json({ error: `Missing header: ${h}` }, { status: 400 });
      }
    }

    const idx = Object.fromEntries(required.map(k => [k, headers.indexOf(k)]));
    const created: any[] = [];

    await db.$transaction(async (tx) => {
      for (const r of rows) {
        const fromName = r[idx.from_city];
        const toName = r[idx.to_city];
        const vehicleType = r[idx.vehicle_type] as VehicleType;
        const quantity = parseInt(r[idx.quantity] || "1");
        const price = parseFloat(r[idx.price] || "0");
        const currency = r[idx.currency] || "SAR";

        if (!Object.values(VehicleType).includes(vehicleType)) {
          throw new Error(`Invalid vehicle type in CSV: ${vehicleType}`);
        }

        const fromCity = await findOrCreateCity(tx, fromName);
        const toCity = await findOrCreateCity(tx, toName);
        const vehicle = await findOrCreateVehicle(tx, vehicleType);

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
        created.push(pricing);
      }
    });

    return NextResponse.json({ count: created.length, items: created });
  } catch (e: any) {
    console.error("/api/imports/pricing error", e);
    return NextResponse.json({ error: e?.message || "Failed to import pricing" }, { status: 500 });
  }
}
