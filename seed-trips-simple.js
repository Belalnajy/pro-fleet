const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedTrips() {
  try {
    console.log('🚗 Creating sample trips...')

    // Get required data
    const users = await prisma.user.findMany({
      include: {
        driverProfile: true,
        customerProfile: true,
      },
    })

    const customerUser = users.find(u => u.role === 'CUSTOMER')
    const driverUser = users.find(u => u.role === 'DRIVER')
    
    const cities = await prisma.city.findMany()
    const vehicles = await prisma.vehicle.findMany()
    const tempSettings = await prisma.temperatureSetting.findMany()

    console.log('📊 Available data:')
    console.log(`- Customer: ${customerUser?.id}`)
    console.log(`- Driver: ${driverUser?.id}`)
    console.log(`- Cities: ${cities.length}`)
    console.log(`- Vehicles: ${vehicles.length}`)
    console.log(`- Temperature Settings: ${tempSettings.length}`)

    if (!customerUser || !driverUser || cities.length === 0 || vehicles.length === 0 || tempSettings.length === 0) {
      throw new Error('Required data not found')
    }

    // Create a simple trip
    const trip1 = await prisma.trip.create({
      data: {
        tripNumber: 'TWB:4501',
        customerId: customerUser.id,
        driverId: null, // Start with no driver assigned
        vehicleId: vehicles[0].id,
        fromCityId: cities[0].id,
        toCityId: cities[1].id,
        temperatureId: tempSettings[0].id,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'PENDING',
        price: 1500,
        currency: 'SAR',
        notes: 'Sample trip - Pending',
      },
    })

    console.log('✅ Created trip 1:', trip1.tripNumber)

    // Create trip with driver assigned
    const trip2 = await prisma.trip.create({
      data: {
        tripNumber: 'TWB:4502',
        customerId: customerUser.id,
        driverId: driverUser.driverProfile.id,
        vehicleId: vehicles[1].id,
        fromCityId: cities[1].id,
        toCityId: cities[2].id,
        temperatureId: tempSettings[1].id,
        scheduledDate: new Date(),
        actualStartDate: new Date(),
        status: 'IN_PROGRESS',
        price: 2000,
        currency: 'SAR',
        notes: 'Sample trip - In Progress',
      },
    })

    console.log('✅ Created trip 2:', trip2.tripNumber)

    // Create completed trip
    const deliveredDate = new Date()
    deliveredDate.setDate(deliveredDate.getDate() - 1)
    
    const trip3 = await prisma.trip.create({
      data: {
        tripNumber: 'TWB:4503',
        customerId: customerUser.id,
        driverId: driverUser.driverProfile.id,
        vehicleId: vehicles[2].id,
        fromCityId: cities[2].id,
        toCityId: cities[0].id,
        temperatureId: tempSettings[2].id,
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        deliveredDate: deliveredDate,
        status: 'DELIVERED',
        price: 1800,
        currency: 'SAR',
        notes: 'Sample trip - Completed',
      },
    })

    console.log('✅ Created trip 3:', trip3.tripNumber)

    // Create invoice for completed trip
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        tripId: trip3.id,
        customsFee: 100,
        taxRate: 0.15,
        taxAmount: trip3.price * 0.15,
        subtotal: trip3.price,
        total: trip3.price + (trip3.price * 0.15) + 100,
        currency: 'SAR',
        paymentStatus: 'PAID',
        dueDate: new Date(),
        paidDate: new Date(),
        notes: `Invoice for trip ${trip3.tripNumber}`,
      },
    })

    console.log('✅ Created invoice:', invoice.invoiceNumber)

    // Create tracking logs for in-progress trip
    for (let i = 0; i < 3; i++) {
      await prisma.trackingLog.create({
        data: {
          tripId: trip2.id,
          driverId: driverUser.driverProfile.id,
          latitude: 24.7136 + (Math.random() - 0.5) * 0.01,
          longitude: 46.6753 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 60) + 40,
          heading: Math.floor(Math.random() * 360),
          timestamp: new Date(Date.now() - (i * 15 * 60 * 1000)),
        },
      })
    }

    console.log('✅ Created tracking logs')

    // Create subscription
    const plans = await prisma.subscriptionPlan.findMany()
    if (plans.length > 0 && customerUser.customerProfile) {
      const subscription = await prisma.subscription.create({
        data: {
          userId: customerUser.id,
          planId: plans[0].id,
          customerId: customerUser.customerProfile.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true,
          autoRenew: false,
        },
      })
      console.log('✅ Created subscription:', subscription.id)
    }

    console.log('🎉 Sample data created successfully!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTrips()
