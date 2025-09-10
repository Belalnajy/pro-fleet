import { db } from "@/lib/db";
import {
  UserRole,
  TemperatureOption,
  SubscriptionType,
  TripStatus,
  PaymentStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

async function seedDemoData() {
  console.log("🌱 Seeding demo data...");

  try {
    // Clear existing data (DANGEROUS: wipes demo data)
    // Delete in dependency order to avoid FK issues
    await db.trackingLog.deleteMany({});
    await db.report.deleteMany({});
    await db.invoice.deleteMany({});
    await db.subscription.deleteMany({});
    await db.trip.deleteMany({});
    await db.customsBroker.deleteMany({});
    await db.accountant.deleteMany({});
    await db.customer.deleteMany({});
    await db.driver.deleteMany({});
    await db.user.deleteMany({});
    await db.temperatureSetting.deleteMany({});
    await db.pricing.deleteMany({});
    await db.vehicle.deleteMany({});
    await db.city.deleteMany({});
    await db.subscriptionPlan.deleteMany({});
    await db.cancellationPolicy.deleteMany({});
    await db.systemSetting.deleteMany({});

    // Hash password for demo users
    const demoPassword = await bcrypt.hash("demo123", 12);

    // Create Demo Users
    console.log("Creating demo users...");

    // Admin User
    const admin = await db.user.create({
      data: {
        email: "admin@profleet.com",
        password: demoPassword,
        name: "Admin User",
        phone: "+966500000001",
        role: UserRole.ADMIN,
        isActive: true
      }
    });

    // Driver User
    const driverUser = await db.user.create({
      data: {
        email: "driver@profleet.com",
        password: demoPassword,
        name: "Abdelbagi Ali",
        phone: "+966501265798",
        role: UserRole.DRIVER,
        isActive: true
      }
    });

    const driver = await db.driver.create({
      data: {
        userId: driverUser.id,
        nationality: "Saudi",
        carPlateNumber: "5580",
        carRegistration: "IST-123456",
        licenseExpiry: new Date("2026-12-31"),
        isAvailable: true,
        trackingEnabled: true,
        currentLocation: JSON.stringify({ lat: 24.7136, lng: 46.6753 }) // Riyadh
      }
    });

    // Second Driver User
    const driverUser2 = await db.user.create({
      data: {
        email: "driver2@profleet.com",
        password: demoPassword,
        name: "Mohammed Saleh",
        phone: "+966501111222",
        role: UserRole.DRIVER,
        isActive: true
      }
    });

    const driver2 = await db.driver.create({
      data: {
        userId: driverUser2.id,
        nationality: "Egyptian",
        carPlateNumber: "9021",
        carRegistration: "IST-654321",
        licenseExpiry: new Date("2027-06-30"),
        isAvailable: true,
        trackingEnabled: true,
        currentLocation: JSON.stringify({ lat: 21.543333, lng: 39.172779 }) // Jeddah
      }
    });

    // Customer User
    const customerUser = await db.user.create({
      data: {
        email: "customer@profleet.com",
        password: demoPassword,
        name: "Customer Company",
        phone: "+966500000002",
        role: UserRole.CUSTOMER,
        isActive: true
      }
    });

    const customer = await db.customer.create({
      data: {
        userId: customerUser.id,
        companyName: "Customer Company Ltd",
        address: "Riyadh, Saudi Arabia",
        preferredLang: "en"
      }
    });

    // Accountant User
    const accountantUser = await db.user.create({
      data: {
        email: "accountant@profleet.com",
        password: demoPassword,
        name: "Accountant User",
        phone: "+966500000003",
        role: UserRole.ACCOUNTANT,
        isActive: true
      }
    });

    await db.accountant.create({
      data: {
        userId: accountantUser.id
      }
    });

    // Customs Broker User
    const customsBrokerUser = await db.user.create({
      data: {
        email: "broker@profleet.com",
        password: demoPassword,
        name: "Customs Broker",
        phone: "+966500000004",
        role: UserRole.CUSTOMS_BROKER,
        isActive: true
      }
    });

    const customsBroker = await db.customsBroker.create({
      data: {
        userId: customsBrokerUser.id,
        licenseNumber: "CB-789012"
      }
    });

    // Create Cities
    console.log("Creating cities...");
    const cities = await Promise.all([
      db.city.create({
        data: {
          name: "Riyadh",
          nameAr: "الرياض",
          country: "Saudi Arabia",
          isActive: true
        }
      }),
      db.city.create({
        data: {
          name: "Jeddah",
          nameAr: "جدة",
          country: "Saudi Arabia",
          isActive: true
        }
      }),
      db.city.create({
        data: {
          name: "Dammam",
          nameAr: "الدمام",
          country: "Saudi Arabia",
          isActive: true
        }
      })
    ]);

    // Create Vehicle Types first (upsert to avoid duplicates)
    console.log("Creating vehicle types...");
    const vehicleTypes = await Promise.all([
      db.vehicleTypeModel.upsert({
        where: { name: "5 Ton Truck" },
        update: {},
        create: {
          name: "5 Ton Truck",
          nameAr: "شاحنة 5 طن",
          capacity: "5 Ton",
          description: "5 Ton Dry Truck",
          isRefrigerated: false,
          isActive: true
        }
      }),
      db.vehicleTypeModel.upsert({
        where: { name: "10 Ton Truck" },
        update: {},
        create: {
          name: "10 Ton Truck",
          nameAr: "شاحنة 10 طن",
          capacity: "10 Ton",
          description: "10 Ton Dry Truck",
          isRefrigerated: false,
          isActive: true
        }
      }),
      db.vehicleTypeModel.upsert({
        where: { name: "40 ft Container" },
        update: {},
        create: {
          name: "40 ft Container",
          nameAr: "حاوية 40 قدم",
          capacity: "40 ft",
          description: "40 ft Dry Container",
          isRefrigerated: false,
          isActive: true
        }
      }),
      db.vehicleTypeModel.upsert({
        where: { name: "Refrigerated Truck" },
        update: {},
        create: {
          name: "Refrigerated Truck",
          nameAr: "شاحنة مبردة",
          capacity: "20 Ton",
          description: "Refrigerated Transport",
          isRefrigerated: true,
          isActive: true
        }
      })
    ]);

    // Create Vehicles using vehicle types
    console.log("Creating vehicles...");
    const vehicles = await Promise.all([
      db.vehicle.create({
        data: {
          vehicleTypeId: vehicleTypes[0].id,
          capacity: "5 Ton",
          description: "5 Ton Dry Truck - Unit 1",
          isActive: true
        }
      }),
      db.vehicle.create({
        data: {
          vehicleTypeId: vehicleTypes[1].id,
          capacity: "10 Ton",
          description: "10 Ton Dry Truck - Unit 1",
          isActive: true
        }
      }),
      db.vehicle.create({
        data: {
          vehicleTypeId: vehicleTypes[2].id,
          capacity: "40 ft",
          description: "40 ft Container - Unit 1",
          isActive: true
        }
      }),
      db.vehicle.create({
        data: {
          vehicleTypeId: vehicleTypes[3].id,
          capacity: "20 Ton",
          description: "Refrigerated Truck - Unit 1",
          isActive: true
        }
      })
    ]);

    // Create Temperature Settings
    console.log("Creating temperature settings...");
    const temperatureSettings = await Promise.all([
      db.temperatureSetting.create({
        data: {
          option: TemperatureOption.PLUS_2,
          value: 2,
          unit: "°C",
          isActive: true
        }
      }),
      db.temperatureSetting.create({
        data: {
          option: TemperatureOption.PLUS_10,
          value: 10,
          unit: "°C",
          isActive: true
        }
      }),
      db.temperatureSetting.create({
        data: {
          option: TemperatureOption.AMBIENT,
          value: 25,
          unit: "°C",
          isActive: true
        }
      })
    ]);

    // Create Pricing
    console.log("Creating pricing...");
    await Promise.all([
      db.pricing.create({
        data: {
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[1].id, // Jeddah
          vehicleId: vehicles[0].id, // 5 Ton
          quantity: 1,
          price: 2500,
          currency: "SAR"
        }
      }),
      db.pricing.create({
        data: {
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[2].id, // Dammam
          vehicleId: vehicles[1].id, // 10 Ton
          quantity: 1,
          price: 1800,
          currency: "SAR"
        }
      }),
      db.pricing.create({
        data: {
          fromCityId: cities[1].id, // Jeddah
          toCityId: cities[2].id, // Dammam
          vehicleId: vehicles[2].id, // 40 ft
          quantity: 1,
          price: 3500,
          currency: "SAR"
        }
      })
    ]);

    // Create Subscription Plans
    console.log("Creating subscription plans...");
    await Promise.all([
      db.subscriptionPlan.create({
        data: {
          name: "Basic Individual",
          description:
            "Perfect for individual customers with occasional shipping needs",
          type: SubscriptionType.INDIVIDUAL,
          price: 99,
          currency: "SAR",
          duration: 1,
          tripsIncluded: 5,
          discountRule: "5 trips per month = 10% discount",
          isActive: true
        }
      }),
      db.subscriptionPlan.create({
        data: {
          name: "Premium Company",
          description:
            "Ideal for businesses with regular shipping requirements",
          type: SubscriptionType.COMPANY,
          price: 499,
          currency: "SAR",
          duration: 1,
          tripsIncluded: 50,
          discountRule: "50 trips per month = 20% discount",
          isActive: true,
          specialOffer: "First month free!"
        }
      })
    ]);

    // Create Cancellation Policy
    console.log("Creating cancellation policy...");
    await db.cancellationPolicy.create({
      data: {
        freeCancellationHours: 24,
        cancellationFeePercentage: 10,
        isActive: true
      }
    });

    // Create System Settings
    console.log("Creating system settings...");
    await Promise.all([
      db.systemSetting.create({
        data: {
          key: "vat_rate",
          value: "0.15", // 15% VAT
          isActive: true
        }
      }),
      db.systemSetting.create({
        data: {
          key: "tracking_enabled",
          value: "true",
          isActive: true
        }
      })
    ])

    // Create Sample Trips
    console.log("Creating sample trips...");
    const trips = await Promise.all([
      db.trip.create({
        data: {
          tripNumber: "TWB:4593",
          customerId: customerUser.id,
          driverId: driver.id,
          vehicleId: vehicles[0].id,
          fromCityId: cities[2].id, // Dammam
          toCityId: cities[0].id, // Riyadh
          temperatureId: temperatureSettings[0].id, // +2°C
          scheduledDate: new Date("2025-08-14"),
          actualStartDate: new Date("2025-08-14T08:00:00"),
          deliveredDate: new Date("2025-08-14T16:00:00"),
          status: TripStatus.DELIVERED,
          price: 2500,
          currency: "SAR",
          notes: "LACTAILIS shipment"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4594",
          customerId: customerUser.id,
          driverId: driver.id,
          vehicleId: vehicles[1].id,
          fromCityId: cities[1].id, // Jeddah
          toCityId: cities[1].id, // Jeddah (local delivery)
          temperatureId: temperatureSettings[2].id, // Ambient
          scheduledDate: new Date("2025-08-13"),
          actualStartDate: new Date("2025-08-13T09:00:00"),
          status: TripStatus.IN_PROGRESS,
          price: 400,
          currency: "SAR",
          notes: "Food items - local delivery"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4595",
          customerId: customerUser.id,
          vehicleId: vehicles[2].id,
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[2].id, // Dammam
          temperatureId: temperatureSettings[1].id, // +10°C
          scheduledDate: new Date("2025-08-15"),
          status: TripStatus.PENDING,
          price: 3500,
          currency: "SAR",
          notes: "Pending assignment"
        }
      }),
      // New demo trips
      db.trip.create({
        data: {
          tripNumber: "TWB:4596",
          customerId: customerUser.id,
          driverId: driver2.id,
          vehicleId: vehicles[0].id,
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[0].id, // Riyadh local
          temperatureId: temperatureSettings[2].id, // Ambient
          scheduledDate: new Date("2025-08-16"),
          actualStartDate: new Date("2025-08-16T10:30:00"),
          status: TripStatus.IN_PROGRESS,
          price: 300,
          currency: "SAR",
          notes: "Local pallets"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4597",
          customerId: customerUser.id,
          driverId: driver.id,
          vehicleId: vehicles[2].id,
          fromCityId: cities[1].id, // Jeddah
          toCityId: cities[2].id, // Dammam
          temperatureId: temperatureSettings[0].id, // +2°C
          scheduledDate: new Date("2025-08-12"),
          actualStartDate: new Date("2025-08-12T07:15:00"),
          deliveredDate: new Date("2025-08-12T19:40:00"),
          status: TripStatus.DELIVERED,
          price: 3600,
          currency: "SAR",
          notes: "Frozen goods"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4598",
          customerId: customerUser.id,
          vehicleId: vehicles[1].id,
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[1].id, // Jeddah
          temperatureId: temperatureSettings[1].id, // +10°C
          scheduledDate: new Date("2025-08-18"),
          status: TripStatus.PENDING,
          price: 2800,
          currency: "SAR",
          notes: "Awaiting driver assignment"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4599",
          customerId: customerUser.id,
          driverId: driver2.id,
          vehicleId: vehicles[0].id,
          fromCityId: cities[2].id, // Dammam
          toCityId: cities[0].id, // Riyadh
          temperatureId: temperatureSettings[2].id, // Ambient
          scheduledDate: new Date("2025-08-10"),
          actualStartDate: new Date("2025-08-10T06:45:00"),
          deliveredDate: new Date("2025-08-10T15:20:00"),
          status: TripStatus.DELIVERED,
          price: 1900,
          currency: "SAR",
          notes: "General cargo"
        }
      })
    ]);

    // Additional demo trips (moved here after vehicles and temperatureSettings exist)
    const additionalTrips = await Promise.all([
      db.trip.create({
        data: {
          tripNumber: "TWB:4600",
          customerId: customerUser.id,
          driverId: driver.id,
          vehicleId: vehicles[1].id,
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[1].id, // Jeddah
          temperatureId: temperatureSettings[2].id, // Ambient
          scheduledDate: new Date("2025-08-19"),
          actualStartDate: new Date("2025-08-19T08:20:00"),
          status: TripStatus.IN_PROGRESS,
          price: 2600,
          currency: "SAR",
          notes: "Electronics"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4601",
          customerId: customerUser.id,
          driverId: driver2.id,
          vehicleId: vehicles[2].id,
          fromCityId: cities[2].id, // Dammam
          toCityId: cities[1].id, // Jeddah
          temperatureId: temperatureSettings[1].id, // +10°C
          scheduledDate: new Date("2025-08-11"),
          deliveredDate: new Date("2025-08-11T22:10:00"),
          status: TripStatus.DELIVERED,
          price: 3400,
          currency: "SAR",
          notes: "Furniture"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4602",
          customerId: customerUser.id,
          vehicleId: vehicles[0].id,
          fromCityId: cities[1].id, // Jeddah
          toCityId: cities[0].id, // Riyadh
          temperatureId: temperatureSettings[0].id, // +2°C
          scheduledDate: new Date("2025-08-21"),
          status: TripStatus.PENDING,
          price: 2400,
          currency: "SAR",
          notes: "Awaiting confirmation"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4603",
          customerId: customerUser.id,
          driverId: driver.id,
          vehicleId: vehicles[1].id,
          fromCityId: cities[0].id, // Riyadh
          toCityId: cities[2].id, // Dammam
          temperatureId: temperatureSettings[2].id, // Ambient
          scheduledDate: new Date("2025-08-17"),
          actualStartDate: new Date("2025-08-17T05:50:00"),
          status: TripStatus.IN_PROGRESS,
          price: 1800,
          currency: "SAR",
          notes: "Pharma supplies"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4604",
          customerId: customerUser.id,
          driverId: driver2.id,
          vehicleId: vehicles[2].id,
          fromCityId: cities[1].id, // Jeddah
          toCityId: cities[1].id, // Local
          temperatureId: temperatureSettings[2].id,
          scheduledDate: new Date("2025-08-20"),
          actualStartDate: new Date("2025-08-20T14:00:00"),
          status: TripStatus.IN_PROGRESS,
          price: 350,
          currency: "SAR",
          notes: "Local beverages"
        }
      }),
      db.trip.create({
        data: {
          tripNumber: "TWB:4605",
          customerId: customerUser.id,
          vehicleId: vehicles[0].id,
          fromCityId: cities[2].id, // Dammam
          toCityId: cities[0].id, // Riyadh
          temperatureId: temperatureSettings[1].id,
          scheduledDate: new Date("2025-08-22"),
          status: TripStatus.PENDING,
          price: 1950,
          currency: "SAR",
          notes: "Pending assignment"
        }
      })
    ]);

    const allTrips = [...trips, ...additionalTrips];

    // Seed tracking logs for ALL IN_PROGRESS trips
    console.log("Creating tracking logs for live trips...");
    const liveTrips = allTrips.filter((t) => t.status === TripStatus.IN_PROGRESS);
    for (const lt of liveTrips) {
      const steps = 20;
      const now = new Date();
      // Choose base coordinates by origin city
      let baseLat = 24.7136; // Riyadh default
      let baseLng = 46.6753;
      if (lt.fromCityId === cities[1].id) {
        baseLat = 21.543333; // Jeddah
        baseLng = 39.172779;
      } else if (lt.fromCityId === cities[2].id) {
        baseLat = 26.4207; // Dammam
        baseLng = 50.0888;
      }
      const path: Array<{ lat: number; lng: number; speed?: number; heading?: number; ts: Date }> = [];
      for (let i = 0; i < steps; i++) {
        const lat = baseLat + i * 0.003;
        const lng = baseLng + (i % 2 === 0 ? i * 0.002 : i * 0.0015);
        const ts = new Date(now.getTime() - (steps - i) * 60 * 1000);
        path.push({ lat, lng, speed: 40 + Math.random() * 20, heading: Math.random() * 360, ts });
      }
      for (const p of path) {
        await db.trackingLog.create({
          data: {
            tripId: lt.id,
            driverId: lt.driverId!,
            latitude: p.lat,
            longitude: p.lng,
            timestamp: p.ts,
            speed: Math.round(p.speed || 50),
            heading: Math.round(p.heading || 0),
          },
        });
      }
    }

    // Create Sample Invoices
    console.log("Creating sample invoices...");
    await Promise.all([
      db.invoice.create({
        data: {
          invoiceNumber: "INV-2025-001",
          tripId: trips[0].id,
          customsBrokerId: customsBroker.id,
          customsFee: 150,
          taxRate: 0.15,
          taxAmount: 397.5,
          subtotal: 2650,
          total: 3047.5,
          currency: "SAR",
          paymentStatus: PaymentStatus.PAID,
          dueDate: new Date("2025-08-21"),
          paidDate: new Date("2025-08-14"),
          notes: "LACTAILIS shipment with customs clearance"
        }
      }),
      db.invoice.create({
        data: {
          invoiceNumber: "INV-2025-002",
          tripId: trips[1].id,
          taxRate: 0.15,
          taxAmount: 60,
          subtotal: 400,
          total: 460,
          currency: "SAR",
          paymentStatus: PaymentStatus.PENDING,
          dueDate: new Date("2025-08-20"),
          notes: "Local food delivery"
        }
      })
    ]);

    // Create Sample Subscriptions
    console.log("Creating sample subscriptions...");
    await db.subscription.create({
      data: {
        userId: customerUser.id,
        planId: (await db.subscriptionPlan.findFirst({
          where: { type: SubscriptionType.COMPANY }
        }))!.id,
        customerId: customer.id,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        autoRenew: true
      }
    });

    console.log("✅ Demo data seeded successfully!");
    console.log("\n🔐 Demo Accounts:");
    console.log("Admin: admin@profleet.com / demo123");
    console.log("Driver: driver@profleet.com / demo123");
    console.log("Customer: customer@profleet.com / demo123");
    console.log("Accountant: accountant@profleet.com / demo123");
    console.log("Customs Broker: broker@profleet.com / demo123");
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    throw error;
  }
}

// Run if called directly (guarded for ESM/serverless environments)
if (
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  (require as any).main === module
) {
  seedDemoData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}

export { seedDemoData };
