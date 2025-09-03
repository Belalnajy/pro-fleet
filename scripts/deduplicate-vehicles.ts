// scripts/deduplicate-vehicles.ts
import { db } from '../src/lib/db';

async function main() {
  console.log('Starting deduplication process for vehicles...');

  const allVehicles = await db.vehicle.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });

  const uniqueVehicles = new Map<string, string>();
  const duplicatesToDelete: string[] = [];

  for (const vehicle of allVehicles) {
    const key = `${vehicle.type}|${vehicle.capacity}`;
    if (uniqueVehicles.has(key)) {
      duplicatesToDelete.push(vehicle.id);
    } else {
      uniqueVehicles.set(key, vehicle.id);
    }
  }

  if (duplicatesToDelete.length > 0) {
    console.log(`Found ${duplicatesToDelete.length} duplicate vehicles to delete.`);
    const { count } = await db.vehicle.deleteMany({
      where: {
        id: {
          in: duplicatesToDelete,
        },
      },
    });
    console.log(`Successfully deleted ${count} duplicate vehicles.`);
  } else {
    console.log('No duplicate vehicles found. Database is clean.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
