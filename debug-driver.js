const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugDriver() {
  try {
    // Check driver user and profile
    const driverUser = await prisma.user.findFirst({
      where: { role: 'DRIVER' },
      include: {
        driverProfile: true,
      },
    })

    console.log('🔍 Driver User:', {
      id: driverUser?.id,
      email: driverUser?.email,
      role: driverUser?.role,
      hasProfile: !!driverUser?.driverProfile,
      profileId: driverUser?.driverProfile?.id,
    })

    // Check all drivers
    const drivers = await prisma.driver.findMany()
    console.log('🚛 All Driver Profiles:', drivers.map(d => ({
      id: d.id,
      userId: d.userId,
      nationality: d.nationality,
    })))

    // Try to create a simple trip with explicit driver ID
    if (driverUser?.driverProfile) {
      console.log('🧪 Testing trip creation with driver profile ID...')
      
      const cities = await prisma.city.findMany()
      const vehicles = await prisma.vehicle.findMany()
      const tempSettings = await prisma.temperatureSetting.findMany()
      const customerUser = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } })

      const testTrip = await prisma.trip.create({
        data: {
          tripNumber: 'TEST:001',
          customerId: customerUser.id,
          driverId: driverUser.driverProfile.id, // Use driver profile ID, not user ID!
          vehicleId: vehicles[0].id,
          fromCityId: cities[0].id,
          toCityId: cities[1].id,
          temperatureId: tempSettings[0].id,
          scheduledDate: new Date(),
          status: 'PENDING',
          price: 1000,
          currency: 'SAR',
          notes: 'Test trip',
        },
      })

      console.log('✅ Test trip created:', testTrip.tripNumber)
      
      // Clean up test trip
      await prisma.trip.delete({ where: { id: testTrip.id } })
      console.log('🗑️ Test trip deleted')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    
    // Check the schema to see what the relation expects
    console.log('\n🔍 Let me check the Trip model relations...')
    
  } finally {
    await prisma.$disconnect()
  }
}

debugDriver()
