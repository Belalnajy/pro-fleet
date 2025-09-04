import { seedDemoData } from "../src/lib/seed-demo-data";

(async () => {
  try {
    console.log("Seeding using DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^@]+@/, ":****@"));
    await seedDemoData();
    console.log("Done seeding.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
