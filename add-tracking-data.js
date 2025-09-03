const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTrackingData() {
  try {
    console.log('🚀 Adding tracking data...');

    // Get existing trips
    const trips = await prisma.trip.findMany({
      where: {
        status: 'IN_PROGRESS',
        driverId: { not: null }
      },
      include: {
        driver: true
      }
    });

    if (trips.length === 0) {
      console.log('❌ No active trips found. Creating sample trip first...');
      
      // Get first driver and customer
      const driver = await prisma.driverProfile.findFirst();
      const customer = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' }
      });
      const vehicle = await prisma.vehicle.findFirst();
      const fromCity = await prisma.city.findFirst();
      const toCity = await prisma.city.findFirst({
        where: { id: { not: fromCity?.id } }
      });

      if (!driver || !customer || !vehicle || !fromCity || !toCity) {
        console.log('❌ Missing required data. Please run seed script first.');
        return;
      }

      // Create sample trip
      const trip = await prisma.trip.create({
        data: {
          tripNumber: `TRP-${Date.now()}`,
          customerId: customer.id,
          driverId: driver.id,
          vehicleId: vehicle.id,
          fromCityId: fromCity.id,
          toCityId: toCity.id,
          scheduledDate: new Date(),
          status: 'IN_PROGRESS',
          estimatedCost: 1500.00,
          actualCost: 1500.00
        }
      });

      trips.push({ ...trip, driver });
    }

    // Add tracking logs for each trip
    for (const trip of trips) {
      console.log(`📍 Adding tracking data for trip ${trip.tripNumber}...`);

      // Generate tracking points along a route (Cairo to Alexandria example)
      const trackingPoints = [
        { lat: 30.0444, lng: 31.2357, speed: 0 }, // Cairo start
        { lat: 30.0500, lng: 31.2200, speed: 45 },
        { lat: 30.0600, lng: 31.2000, speed: 60 },
        { lat: 30.1000, lng: 31.1500, speed: 80 },
        { lat: 30.2000, lng: 31.0000, speed: 90 },
        { lat: 30.3000, lng: 30.8000, speed: 85 },
        { lat: 30.4000, lng: 30.6000, speed: 75 },
        { lat: 30.5000, lng: 30.4000, speed: 70 },
        { lat: 31.0000, lng: 29.9000, speed: 65 }, // Near Alexandria
        { lat: 31.2001, lng: 29.9187, speed: 30 }  // Alexandria end
      ];

      // Delete existing tracking logs for this trip
      await prisma.trackingLog.deleteMany({
        where: { tripId: trip.id }
      });

      // Add new tracking logs with timestamps spread over last 2 hours
      const now = new Date();
      for (let i = 0; i < trackingPoints.length; i++) {
        const point = trackingPoints[i];
        const timestamp = new Date(now.getTime() - (trackingPoints.length - i - 1) * 12 * 60 * 1000); // 12 minutes apart

        await prisma.trackingLog.create({
          data: {
            tripId: trip.id,
            driverId: trip.driverId,
            latitude: point.lat,
            longitude: point.lng,
            speed: point.speed,
            timestamp: timestamp,

            heading: i < trackingPoints.length - 1 ? 
              Math.atan2(trackingPoints[i + 1].lng - point.lng, trackingPoints[i + 1].lat - point.lat) * 180 / Math.PI : 
              0
          }
        });
      }

      console.log(`✅ Added ${trackingPoints.length} tracking points for trip ${trip.tripNumber}`);
    }

    console.log('🎉 Tracking data added successfully!');

  } catch (error) {
    console.error('❌ Error adding tracking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTrackingData();
