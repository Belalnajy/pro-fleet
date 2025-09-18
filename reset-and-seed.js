const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetAndSeed() {
  try {
    console.log('🧹 Cleaning existing data...')
    
    // Delete in correct order to avoid foreign key constraints
    await prisma.trackingLog.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.trip.deleteMany()
    
    console.log('✅ Cleaned existing trips and related data')

    // Now create fresh sample data
    console.log('🚗 Creating fresh sample trips...')

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
    const plans = await prisma.subscriptionPlan.findMany()

    console.log('📊 Available data:')
    console.log(`- Customer: ${customerUser?.id}`)
    console.log(`- Driver: ${driverUser?.id} (Profile: ${driverUser?.driverProfile?.id})`)
    console.log(`- Cities: ${cities.length}`)
    console.log(`- Vehicles: ${vehicles.length}`)
    console.log(`- Temperature Settings: ${tempSettings.length}`)
    console.log(`- Subscription Plans: ${plans.length}`)

    if (!customerUser || !driverUser || cities.length === 0 || vehicles.length === 0 || tempSettings.length === 0) {
      throw new Error('Required data not found')
    }

    // Create multiple trips with different statuses
    const tripsData = [
      {
        tripNumber: 'TWB:5001',
        customerId: customerUser.id,
        driverId: null, // Pending - no driver assigned
        vehicleId: vehicles[0].id,
        fromCityId: cities[0].id,
        toCityId: cities[1].id,
        temperatureId: tempSettings[0].id,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'PENDING',
        price: 1500,
        currency: 'SAR',
        notes: 'Pending shipment from Riyadh to Jeddah',
      },
      {
        tripNumber: 'TWB:5002',
        customerId: customerUser.id,
        driverId: driverUser.driverProfile.id,
        vehicleId: vehicles[1].id,
        fromCityId: cities[1].id,
        toCityId: cities[2].id,
        temperatureId: tempSettings[1].id,
        scheduledDate: new Date(),
        actualStartDate: new Date(),
        status: 'IN_PROGRESS',
        price: 2200,
        currency: 'SAR',
        notes: 'In transit from Jeddah to Dammam',
      },
      {
        tripNumber: 'TWB:5003',
        customerId: customerUser.id,
        driverId: driverUser.driverProfile.id,
        vehicleId: vehicles[2].id,
        fromCityId: cities[2].id,
        toCityId: cities[3].id,
        temperatureId: tempSettings[2].id,
        scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        deliveredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'DELIVERED',
        price: 1800,
        currency: 'SAR',
        notes: 'Completed delivery from Dammam to Mecca',
      },
      {
        tripNumber: 'TWB:5004',
        customerId: customerUser.id,
        driverId: null,
        vehicleId: vehicles[3].id,
        fromCityId: cities[3].id,
        toCityId: cities[0].id,
        temperatureId: tempSettings[0].id,
        scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'CANCELLED',
        price: 1600,
        currency: 'SAR',
        notes: 'Cancelled due to customer request',
      },
      {
        tripNumber: 'TWB:5005',
        customerId: customerUser.id,
        driverId: driverUser.driverProfile.id,
        vehicleId: vehicles[0].id, // Refrigerated truck
        fromCityId: cities[1].id,
        toCityId: cities[2].id,
        temperatureId: tempSettings[2].id, // -18°C
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        price: 2800,
        currency: 'SAR',
        notes: 'Cold chain delivery - Medina to Khobar',
      },
    ]

    const createdTrips = []
    for (const tripData of tripsData) {
      const trip = await prisma.trip.create({
        data: tripData,
      })
      createdTrips.push(trip)
      console.log(`✅ Created trip: ${trip.tripNumber} (${trip.status})`)
    }

    // Create invoices for delivered trips
    console.log('🧾 Creating invoices for completed trips...')
    const deliveredTrips = createdTrips.filter(trip => trip.status === 'DELIVERED')
    
    for (const trip of deliveredTrips) {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const customsFee = Math.floor(Math.random() * 300) + 50
      const subtotal = trip.price
      const taxRate = 0.15
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount + customsFee
      
      const dueDate = new Date(trip.deliveredDate)
      dueDate.setDate(dueDate.getDate() + 30)
      
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          tripId: trip.id,
          customsFee,
          taxRate,
          taxAmount,
          subtotal,
          total,
          currency: 'SAR',
          paymentStatus: Math.random() > 0.5 ? 'PAID' : 'PENDING',
          dueDate,
          paidDate: Math.random() > 0.5 ? new Date() : null,
          notes: `Invoice for trip ${trip.tripNumber}`,
        },
      })
      console.log(`✅ Created invoice: ${invoice.invoiceNumber}`)
    }

    // Create tracking logs for in-progress trips
    console.log('📍 Creating GPS tracking logs...')
    const inProgressTrips = createdTrips.filter(trip => trip.status === 'IN_PROGRESS')
    
    for (const trip of inProgressTrips) {
      if (trip.driverId) {
        // Create tracking points along the route
        const trackingPoints = [
          { lat: 24.7136, lng: 46.6753, speed: 65 }, // Riyadh area
          { lat: 24.5000, lng: 46.5000, speed: 70 }, // Highway
          { lat: 24.2000, lng: 46.3000, speed: 75 }, // En route
          { lat: 23.8000, lng: 46.0000, speed: 68 }, // Approaching destination
        ]
        
        for (let i = 0; i < trackingPoints.length; i++) {
          const point = trackingPoints[i]
          await prisma.trackingLog.create({
            data: {
              tripId: trip.id,
              driverId: trip.driverId,
              latitude: point.lat + (Math.random() - 0.5) * 0.01,
              longitude: point.lng + (Math.random() - 0.5) * 0.01,
              speed: point.speed + Math.floor(Math.random() * 10) - 5,
              heading: Math.floor(Math.random() * 360),
              timestamp: new Date(Date.now() - ((trackingPoints.length - i) * 20 * 60 * 1000)),
            },
          })
        }
        console.log(`✅ Created ${trackingPoints.length} tracking points for trip ${trip.tripNumber}`)
      }
    }

    // Create subscriptions
    console.log('📝 Creating sample subscriptions...')
    if (plans.length > 0 && customerUser.customerProfile) {
      const subscription = await prisma.subscription.create({
        data: {
          userId: customerUser.id,
          planId: plans[0].id,
          customerId: customerUser.customerProfile.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isActive: true,
          autoRenew: true,
        },
      })
      console.log(`✅ Created subscription: ${plans[0].name}`)
    }

    // Final summary
    console.log('\n🎉 Sample data created successfully!')
    console.log('📊 Summary:')
    console.log(`- Trips Created: ${createdTrips.length}`)
    console.log(`  • Pending: ${createdTrips.filter(t => t.status === 'PENDING').length}`)
    console.log(`  • In Progress: ${createdTrips.filter(t => t.status === 'IN_PROGRESS').length}`)
    console.log(`  • Delivered: ${createdTrips.filter(t => t.status === 'DELIVERED').length}`)
    console.log(`  • Cancelled: ${createdTrips.filter(t => t.status === 'CANCELLED').length}`)
    console.log(`- Invoices: ${deliveredTrips.length}`)
    console.log(`- Tracking Logs: ${inProgressTrips.length * 4}`)
    console.log(`- Subscriptions: 1`)
    
    console.log('\n🔐 Login Credentials:')
    console.log('Admin: admin@profleet.com / demo123')
    console.log('Driver: driver@profleet.com / demo123')
    console.log('Customer: customer@profleet.com / demo123')
    console.log('Accountant: accountant@profleet.com / demo123')
    console.log('Customs Broker: broker@profleet.com / demo123')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAndSeed()
