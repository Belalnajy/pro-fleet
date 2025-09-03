const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function seedCompleteData() {
  try {
    console.log('🚀 Starting complete data seeding...')

    // 1. Create Cities
    console.log('📍 Creating cities...')
    const cities = [
      { name: 'Riyadh', nameAr: 'الرياض', country: 'Saudi Arabia' },
      { name: 'Jeddah', nameAr: 'جدة', country: 'Saudi Arabia' },
      { name: 'Dammam', nameAr: 'الدمام', country: 'Saudi Arabia' },
      { name: 'Mecca', nameAr: 'مكة المكرمة', country: 'Saudi Arabia' },
      { name: 'Medina', nameAr: 'المدينة المنورة', country: 'Saudi Arabia' },
      { name: 'Khobar', nameAr: 'الخبر', country: 'Saudi Arabia' },
      { name: 'Dubai', nameAr: 'دبي', country: 'UAE' },
      { name: 'Abu Dhabi', nameAr: 'أبو ظبي', country: 'UAE' },
    ]

    const createdCities = []
    for (const cityData of cities) {
      const city = await prisma.city.upsert({
        where: { name_country: { name: cityData.name, country: cityData.country } },
        update: {},
        create: cityData,
      })
      createdCities.push(city)
    }

    // 2. Create Vehicles
    console.log('🚛 Creating vehicles...')
    const vehicles = [
      { type: 'TON_5', capacity: '5 Ton', description: 'Small delivery truck' },
      { type: 'TON_10', capacity: '10 Ton', description: 'Medium cargo truck' },
      { type: 'TON_20', capacity: '20 Ton', description: 'Large cargo truck' },
      { type: 'TON_40', capacity: '40 Ton', description: 'Heavy duty truck' },
      { type: 'REFRIGERATED', capacity: '15 Ton', description: 'Refrigerated truck' },
      { type: 'TANKER', capacity: '25 Ton', description: 'Liquid cargo tanker' },
    ]

    const createdVehicles = []
    for (const vehicleData of vehicles) {
      const vehicle = await prisma.vehicle.create({
        data: vehicleData,
      })
      createdVehicles.push(vehicle)
    }

    // 3. Create Temperature Settings
    console.log('🌡️ Creating temperature settings...')
    const tempSettings = [
      { option: 'PLUS_2', value: 2, unit: '°C' },
      { option: 'PLUS_10', value: 10, unit: '°C' },
      { option: 'MINUS_18', value: -18, unit: '°C' },
      { option: 'AMBIENT', value: 25, unit: '°C' },
      { option: 'CUSTOM', value: 0, unit: '°C' },
    ]

    const createdTempSettings = []
    for (const tempData of tempSettings) {
      const temp = await prisma.temperatureSetting.create({
        data: tempData,
      })
      createdTempSettings.push(temp)
    }

    // 4. Create Pricing
    console.log('💰 Creating pricing...')
    const pricingData = []
    
    // Generate pricing between major cities
    const majorCities = createdCities.slice(0, 6) // First 6 cities
    
    for (let i = 0; i < majorCities.length; i++) {
      for (let j = i + 1; j < majorCities.length; j++) {
        for (const vehicle of createdVehicles) {
          const basePrice = Math.floor(Math.random() * 2000) + 500 // 500-2500 SAR
          pricingData.push({
            fromCityId: majorCities[i].id,
            toCityId: majorCities[j].id,
            vehicleId: vehicle.id,
            quantity: 1,
            price: basePrice,
            currency: 'SAR',
          })
        }
      }
    }

    for (const pricing of pricingData) {
      await prisma.pricing.create({ data: pricing })
    }

    // 5. Create Subscription Plans
    console.log('📋 Creating subscription plans...')
    const subscriptionPlans = [
      {
        name: 'Basic Individual',
        description: 'Perfect for individual drivers',
        type: 'INDIVIDUAL',
        price: 299,
        currency: 'SAR',
        duration: 1,
        tripsIncluded: 10,
        discountRule: null,
        specialOffer: 'First month 50% off',
      },
      {
        name: 'Pro Individual',
        description: 'For professional drivers',
        type: 'INDIVIDUAL',
        price: 499,
        currency: 'SAR',
        duration: 1,
        tripsIncluded: 25,
        discountRule: '20+ trips = 10% discount',
        specialOffer: null,
      },
      {
        name: 'Company Starter',
        description: 'Small business solution',
        type: 'COMPANY',
        price: 999,
        currency: 'SAR',
        duration: 1,
        tripsIncluded: 50,
        discountRule: '40+ trips = 15% discount',
        specialOffer: 'Free setup and training',
      },
      {
        name: 'Company Enterprise',
        description: 'Large fleet management',
        type: 'COMPANY',
        price: 2499,
        currency: 'SAR',
        duration: 1,
        tripsIncluded: 200,
        discountRule: '150+ trips = 20% discount',
        specialOffer: 'Dedicated account manager',
      },
    ]

    const createdPlans = []
    for (const planData of subscriptionPlans) {
      const plan = await prisma.subscriptionPlan.create({
        data: planData,
      })
      createdPlans.push(plan)
    }

    // 6. Get existing users with their profiles
    const users = await prisma.user.findMany({
      include: {
        driverProfile: true,
        customerProfile: true,
      },
    })

    const customerUser = users.find(u => u.role === 'CUSTOMER')
    const driverUser = users.find(u => u.role === 'DRIVER')
    
    console.log('👥 Found users:', {
      customer: customerUser ? customerUser.id : 'Not found',
      driver: driverUser ? driverUser.id : 'Not found'
    })
    
    if (!customerUser || !driverUser) {
      throw new Error('Required users not found. Please run create-demo-users.js first.')
    }

    // 7. Create Sample Trips
    console.log('🚗 Creating sample trips...')
    const sampleTrips = []
    
    for (let i = 0; i < 10; i++) {
      const fromCity = createdCities[Math.floor(Math.random() * createdCities.length)]
      let toCity = createdCities[Math.floor(Math.random() * createdCities.length)]
      while (toCity.id === fromCity.id) {
        toCity = createdCities[Math.floor(Math.random() * createdCities.length)]
      }
      
      const vehicle = createdVehicles[Math.floor(Math.random() * createdVehicles.length)]
      const tempSetting = createdTempSettings[Math.floor(Math.random() * createdTempSettings.length)]
      
      const pricing = await prisma.pricing.findFirst({
        where: {
          OR: [
            { fromCityId: fromCity.id, toCityId: toCity.id, vehicleId: vehicle.id },
            { fromCityId: toCity.id, toCityId: fromCity.id, vehicleId: vehicle.id },
          ],
        },
      })

      const tripNumber = `TWB:${4500 + i}`
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(Math.random() * 30))
      
      const statuses = ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      let actualStartDate = null
      let deliveredDate = null
      
      if (status === 'IN_PROGRESS' || status === 'DELIVERED') {
        actualStartDate = new Date(scheduledDate)
        actualStartDate.setHours(actualStartDate.getHours() + Math.floor(Math.random() * 24))
      }
      
      if (status === 'DELIVERED') {
        deliveredDate = new Date(actualStartDate)
        deliveredDate.setHours(deliveredDate.getHours() + Math.floor(Math.random() * 48))
      }

      const trip = {
        tripNumber,
        customerId: customerUser.id,
        driverId: status === 'PENDING' ? null : driverUser.id, // Only assign driver if not pending
        vehicleId: vehicle.id,
        fromCityId: fromCity.id,
        toCityId: toCity.id,
        temperatureId: tempSetting.id,
        scheduledDate,
        actualStartDate,
        deliveredDate,
        status,
        price: pricing ? pricing.price : Math.floor(Math.random() * 2000) + 500,
        currency: 'SAR',
        notes: `Sample trip from ${fromCity.name} to ${toCity.name}`,
      }

      sampleTrips.push(trip)
    }

    const createdTrips = []
    for (const tripData of sampleTrips) {
      const trip = await prisma.trip.create({
        data: tripData,
      })
      createdTrips.push(trip)
    }

    // 8. Create Invoices for completed trips
    console.log('🧾 Creating invoices...')
    const completedTrips = createdTrips.filter(trip => trip.status === 'DELIVERED')
    
    for (const trip of completedTrips) {
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      const subtotal = trip.price
      const taxRate = 0.15
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount
      
      const dueDate = new Date(trip.deliveredDate)
      dueDate.setDate(dueDate.getDate() + 30)
      
      await prisma.invoice.create({
        data: {
          invoiceNumber,
          tripId: trip.id,
          customsFee: Math.floor(Math.random() * 200),
          taxRate,
          taxAmount,
          subtotal,
          total,
          currency: 'SAR',
          paymentStatus: Math.random() > 0.3 ? 'PAID' : 'PENDING',
          dueDate,
          paidDate: Math.random() > 0.3 ? new Date() : null,
          notes: `Invoice for trip ${trip.tripNumber}`,
        },
      })
    }

    // 9. Create Sample Subscriptions
    console.log('📝 Creating sample subscriptions...')
    if (customerUser && customerUser.customerProfile) {
      const plan = createdPlans[0] // Basic plan
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + plan.duration)
      
      await prisma.subscription.create({
        data: {
          userId: customerUser.id,
          planId: plan.id,
          customerId: customerUser.customerProfile.id,
          startDate,
          endDate,
          isActive: true,
          autoRenew: true,
        },
      })
    }

    // 10. Create Tracking Logs for in-progress trips
    console.log('📍 Creating tracking logs...')
    const inProgressTrips = createdTrips.filter(trip => trip.status === 'IN_PROGRESS')
    
    for (const trip of inProgressTrips) {
      if (trip.driverId) { // Only create tracking logs if trip has a driver
        // Create multiple tracking points
        for (let i = 0; i < 5; i++) {
          const baseLatitude = 24.7136 + (Math.random() - 0.5) * 0.1
          const baseLongitude = 46.6753 + (Math.random() - 0.5) * 0.1
          
          await prisma.trackingLog.create({
            data: {
              tripId: trip.id,
              driverId: trip.driverId,
              latitude: baseLatitude,
              longitude: baseLongitude,
              speed: Math.floor(Math.random() * 80) + 20,
              heading: Math.floor(Math.random() * 360),
              timestamp: new Date(Date.now() - (i * 30 * 60 * 1000)), // Every 30 minutes
            },
          })
        }
      }
    }

    // 11. Create System Settings
    console.log('⚙️ Creating system settings...')
    const systemSettings = [
      { key: 'company_name', value: 'PRO FLEET' },
      { key: 'company_email', value: 'info@profleet.com' },
      { key: 'company_phone', value: '+966500000000' },
      { key: 'default_currency', value: 'SAR' },
      { key: 'default_language', value: 'en' },
      { key: 'tracking_enabled', value: 'true' },
      { key: 'auto_invoice_generation', value: 'true' },
      { key: 'notification_email', value: 'notifications@profleet.com' },
    ]

    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      })
    }

    // 12. Create Cancellation Policy
    console.log('📋 Creating cancellation policy...')
    await prisma.cancellationPolicy.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        freeCancellationHours: 24,
        cancellationFeePercentage: 0.10,
        isActive: true,
      },
    })

    console.log('✅ Complete data seeding finished successfully!')
    console.log('📊 Summary:')
    console.log(`- Cities: ${createdCities.length}`)
    console.log(`- Vehicles: ${createdVehicles.length}`)
    console.log(`- Temperature Settings: ${createdTempSettings.length}`)
    console.log(`- Subscription Plans: ${createdPlans.length}`)
    console.log(`- Sample Trips: ${createdTrips.length}`)
    console.log(`- Pricing Rules: ${pricingData.length}`)
    console.log('🎉 Your PRO FLEET system is now ready with sample data!')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCompleteData()
