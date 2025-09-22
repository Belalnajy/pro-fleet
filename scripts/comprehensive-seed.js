const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting comprehensive database seeding...')

  // Clear existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.customsDocument.deleteMany()
  await prisma.customsClearance.deleteMany()
  await prisma.trackingLog.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.pricing.deleteMany()
  await prisma.savedAddress.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.vehicleTypeModel.deleteMany()
  await prisma.temperatureSetting.deleteMany()
  await prisma.city.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.accountant.deleteMany()
  await prisma.customsBroker.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create Users with different roles
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('123456', 12)
  const demoPassword = await bcrypt.hash('demo1234', 12)
  const demoPassword123 = await bcrypt.hash('demo123', 12)

  // Demo Admin User
  const demoAdmin = await prisma.user.create({
    data: {
      email: 'admin@profleet.com',
      name: 'Demo Admin',
      phone: '+966500000001',
      password: demoPassword,
      role: 'ADMIN',
      isActive: true
    }
  })

  // Admin Users
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@twb.com',
      name: 'مدير النظام الرئيسي',
      phone: '+966501234567',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    }
  })

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@twb.com',
      name: 'مدير النظام المساعد',
      phone: '+966501234568',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true
    }
  })

  // Demo Driver User
  const demoDriver = await prisma.user.create({
    data: {
      email: 'driver@profleet.com',
      name: 'Demo Driver',
      phone: '+966500000002',
      password: demoPassword123,
      role: 'DRIVER',
      isActive: true
    }
  })

  // Driver Users
  const driverUsers = [demoDriver]
  const driverNames = [
    'أحمد محمد السائق',
    'محمد علي النقل',
    'عبدالله سعد الشحن',
    'سعد أحمد التوصيل',
    'علي محمد الرحلات'
  ]

  for (let i = 0; i < driverNames.length; i++) {
    const driver = await prisma.user.create({
      data: {
        email: `driver${i + 1}@twb.com`,
        name: driverNames[i],
        phone: `+96650123456${i + 1}`,
        password: hashedPassword,
        role: 'DRIVER',
        isActive: i < 4 // Last driver inactive
      }
    })
    driverUsers.push(driver)
  }

  // Demo Customer User
  const demoCustomer = await prisma.user.create({
    data: {
      email: 'customer@profleet.com',
      name: 'Demo Customer',
      phone: '+966500000003',
      password: demoPassword123,
      role: 'CUSTOMER',
      isActive: true
    }
  })

  // Customer Users
  const customerUsers = [demoCustomer]
  const customerNames = [
    'شركة النقل السريع',
    'مؤسسة التجارة الدولية',
    'شركة الشحن المتقدم',
    'مجموعة اللوجستيات',
    'شركة التوزيع الحديث'
  ]

  for (let i = 0; i < customerNames.length; i++) {
    const customer = await prisma.user.create({
      data: {
        email: `customer${i + 1}@company.com`,
        name: customerNames[i],
        phone: `+96650234567${i + 1}`,
        password: hashedPassword,
        role: 'CUSTOMER',
        isActive: true
      }
    })
    customerUsers.push(customer)
  }

  // Demo Accountant User
  const demoAccountant = await prisma.user.create({
    data: {
      email: 'accountant@profleet.com',
      name: 'Demo Accountant',
      phone: '+966500000004',
      password: demoPassword123,
      role: 'ACCOUNTANT',
      isActive: true
    }
  })

  // Accountant Users
  const accountant1 = await prisma.user.create({
    data: {
      email: 'accountant@twb.com',
      name: 'محاسب رئيسي',
      phone: '+966503456789',
      password: hashedPassword,
      role: 'ACCOUNTANT',
      isActive: true
    }
  })

  const accountant2 = await prisma.user.create({
    data: {
      email: 'accountant2@twb.com',
      name: 'محاسب مساعد',
      phone: '+966503456788',
      password: hashedPassword,
      role: 'ACCOUNTANT',
      isActive: true
    }
  })

  // Demo Customs Broker User
  const demoBroker = await prisma.user.create({
    data: {
      email: 'broker@profleet.sa',
      name: 'Demo Customs Broker',
      phone: '+966500000005',
      password: await bcrypt.hash('password123', 12),
      role: 'CUSTOMS_BROKER',
      isActive: true
    }
  })

  // Additional Demo Broker
  const demoBroker2 = await prisma.user.create({
    data: {
      email: 'broker@profleet.com',
      name: 'Demo Broker 2',
      phone: '+966500000006',
      password: demoPassword123,
      role: 'CUSTOMS_BROKER',
      isActive: true
    }
  })

  // Customs Broker Users
  const brokerUsers = [demoBroker, demoBroker2]
  const brokerNames = [
    'مخلص جمركي أول',
    'مخلص جمركي ثاني',
    'مخلص جمركي ثالث'
  ]

  for (let i = 0; i < brokerNames.length; i++) {
    const broker = await prisma.user.create({
      data: {
        email: `broker${i + 1}@customs.com`,
        name: brokerNames[i],
        phone: `+96650345678${i + 1}`,
        password: hashedPassword,
        role: 'CUSTOMS_BROKER',
        isActive: true
      }
    })
    brokerUsers.push(broker)
  }

  // 2. Create Profile Records
  console.log('📋 Creating profiles...')

  // Driver Profiles
  const drivers = []
  for (let i = 0; i < driverUsers.length; i++) {
    const driver = await prisma.driver.create({
      data: {
        userId: driverUsers[i].id,
        nationality: 'Saudi',
        carPlateNumber: `ABC-${1000 + i}`,
        carRegistration: `REG-${2000 + i}`,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isAvailable: i < 4, // First 4 available (including demo)
        trackingEnabled: i < 3 // First 3 have tracking enabled (including demo)
      }
    })
    drivers.push(driver)
  }

  // Customer Profiles
  const customers = []
  for (let i = 0; i < customerUsers.length; i++) {
    const customer = await prisma.customer.create({
      data: {
        userId: customerUsers[i].id,
        companyName: customerNames[i],
        address: `العنوان ${i + 1}، الرياض، المملكة العربية السعودية`,
        preferredLang: i % 2 === 0 ? 'ar' : 'en'
      }
    })
    customers.push(customer)
  }

  // Accountant Profiles
  const accountants = []
  accountants.push(await prisma.accountant.create({
    data: { userId: demoAccountant.id }
  }))
  accountants.push(await prisma.accountant.create({
    data: { userId: accountant1.id }
  }))
  accountants.push(await prisma.accountant.create({
    data: { userId: accountant2.id }
  }))

  // Customs Broker Profiles
  const customsBrokers = []
  for (let i = 0; i < brokerUsers.length; i++) {
    const broker = await prisma.customsBroker.create({
      data: {
        userId: brokerUsers[i].id,
        licenseNumber: `CB-${3000 + i}`
      }
    })
    customsBrokers.push(broker)
  }

  // 3. Create Cities
  console.log('🏙️ Creating cities...')
  const cities = []
  const cityData = [
    { name: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lng: 46.6753 },
    { name: 'Jeddah', nameAr: 'جدة', lat: 21.4858, lng: 39.1925 },
    { name: 'Dammam', nameAr: 'الدمام', lat: 26.4207, lng: 50.0888 },
    { name: 'Mecca', nameAr: 'مكة المكرمة', lat: 21.3891, lng: 39.8579 },
    { name: 'Medina', nameAr: 'المدينة المنورة', lat: 24.5247, lng: 39.5692 },
    { name: 'Khobar', nameAr: 'الخبر', lat: 26.2172, lng: 50.1971 },
    { name: 'Taif', nameAr: 'الطائف', lat: 21.2703, lng: 40.4178 },
    { name: 'Tabuk', nameAr: 'تبوك', lat: 28.3998, lng: 36.5700 }
  ]

  for (const cityInfo of cityData) {
    const city = await prisma.city.create({
      data: {
        name: cityInfo.name,
        nameAr: cityInfo.nameAr,
        country: 'Saudi Arabia',
        latitude: cityInfo.lat,
        longitude: cityInfo.lng,
        isActive: true
      }
    })
    cities.push(city)
  }

  // 4. Create Temperature Settings
  console.log('🌡️ Creating temperature settings...')
  const temperatures = []
  const tempData = [
    { value: 2, unit: '°C', option: 'PLUS_2' },
    { value: 10, unit: '°C', option: 'PLUS_10' },
    { value: -18, unit: '°C', option: 'MINUS_18' },
    { value: 25, unit: '°C', option: 'AMBIENT' }
  ]

  for (const temp of tempData) {
    const temperature = await prisma.temperatureSetting.create({
      data: {
        option: temp.option,
        value: temp.value,
        unit: temp.unit,
        isActive: true
      }
    })
    temperatures.push(temperature)
  }

  // 5. Create Vehicle Types
  console.log('🚛 Creating vehicle types...')
  const vehicleTypes = []
  const vehicleTypeData = [
    { name: 'Small Truck', nameAr: 'شاحنة صغيرة', capacity: '3 طن', description: 'للشحنات الصغيرة', isRefrigerated: false },
    { name: 'Medium Truck', nameAr: 'شاحنة متوسطة', capacity: '7 طن', description: 'للشحنات المتوسطة', isRefrigerated: false },
    { name: 'Large Truck', nameAr: 'شاحنة كبيرة', capacity: '15 طن', description: 'للشحنات الكبيرة', isRefrigerated: false },
    { name: 'Refrigerated Truck', nameAr: 'شاحنة مبردة', capacity: '10 طن', description: 'للمواد المبردة', isRefrigerated: true }
  ]

  for (const vType of vehicleTypeData) {
    const vehicleType = await prisma.vehicleTypeModel.create({
      data: {
        name: vType.name,
        nameAr: vType.nameAr,
        capacity: vType.capacity,
        description: vType.description,
        isRefrigerated: vType.isRefrigerated,
        defaultTemperatureId: vType.isRefrigerated ? temperatures[2].id : temperatures[3].id,
        isActive: true
      }
    })
    vehicleTypes.push(vehicleType)
  }

  // 6. Create Vehicles
  console.log('🚚 Creating vehicles...')
  const vehicles = []
  for (let i = 0; i < 10; i++) {
    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber: `V-${1000 + i}`,
        vehicleTypeId: vehicleTypes[i % vehicleTypes.length].id,
        isActive: true
      }
    })
    vehicles.push(vehicle)
  }

  // 7. Create Pricing (Sample data - only for first few routes and vehicles)
  console.log('💰 Creating pricing...')
  const sampleRoutes = [
    { from: 0, to: 1 }, // Riyadh to Jeddah
    { from: 0, to: 2 }, // Riyadh to Dammam
    { from: 1, to: 0 }, // Jeddah to Riyadh
    { from: 1, to: 2 }, // Jeddah to Dammam
    { from: 2, to: 0 }, // Dammam to Riyadh
    { from: 2, to: 1 }  // Dammam to Jeddah
  ]
  
  // Create pricing for sample routes with first 3 vehicles only
  for (const route of sampleRoutes) {
    for (let v = 0; v < Math.min(3, vehicles.length); v++) {
      await prisma.pricing.create({
        data: {
          fromCityId: cities[route.from].id,
          toCityId: cities[route.to].id,
          vehicleId: vehicles[v].id,
          quantity: 1,
          price: Math.floor(Math.random() * 2000) + 1000,
          currency: 'SAR'
        }
      })
    }
  }

  // 8. Create Trips with different statuses
  console.log('🛣️ Creating trips...')
  const trips = []
  const tripStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
  
  for (let i = 0; i < 20; i++) {
    const fromCity = cities[Math.floor(Math.random() * cities.length)]
    let toCity = cities[Math.floor(Math.random() * cities.length)]
    while (toCity.id === fromCity.id) {
      toCity = cities[Math.floor(Math.random() * cities.length)]
    }

    const customer = customers[Math.floor(Math.random() * customers.length)]
    const driver = i < 15 ? drivers[Math.floor(Math.random() * drivers.length)] : null
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
    const temperature = temperatures[Math.floor(Math.random() * temperatures.length)]
    const status = tripStatuses[Math.floor(Math.random() * tripStatuses.length)]
    const customsBroker = Math.random() > 0.5 ? customsBrokers[Math.floor(Math.random() * customsBrokers.length)] : null

    const trip = await prisma.trip.create({
      data: {
        tripNumber: `TWB:${String(i + 1).padStart(4, '0')}`,
        customerId: customer.userId,
        driverId: driver?.id,
        vehicleId: vehicle.id,
        fromCityId: fromCity.id,
        toCityId: toCity.id,
        temperatureId: temperature.id,
        customsBrokerId: customsBroker?.id,
        status: status,
        scheduledDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        price: Math.floor(Math.random() * 2000) + 1000,
        notes: `رحلة ${i + 1} - ملاحظات خاصة`,
        actualStartDate: ['IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status) ? new Date() : null,
        deliveredDate: status === 'DELIVERED' ? new Date() : null
      }
    })
    trips.push(trip)
  }

  // 9. Create Tracking Logs for active trips with assigned drivers
  console.log('📍 Creating tracking logs...')
  const activeTrips = trips.filter(trip => 
    ['IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT'].includes(trip.status) && trip.driverId
  )
  
  for (const trip of activeTrips) {
    const fromCity = cities.find(c => c.id === trip.fromCityId)
    const toCity = cities.find(c => c.id === trip.toCityId)
    
    // Create 3-5 tracking points between cities
    const numPoints = Math.floor(Math.random() * 3) + 3
    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1)
      const lat = fromCity.latitude + (toCity.latitude - fromCity.latitude) * progress
      const lng = fromCity.longitude + (toCity.longitude - fromCity.longitude) * progress
      
      await prisma.trackingLog.create({
        data: {
          tripId: trip.id,
          driverId: trip.driverId,
          latitude: lat,
          longitude: lng,
          timestamp: new Date(Date.now() - (numPoints - i) * 60 * 60 * 1000),
          speed: Math.floor(Math.random() * 30) + 50,
          heading: Math.floor(Math.random() * 360)
        }
      })
    }
  }

  // 10. Create Invoices
  console.log('🧾 Creating invoices...')
  const invoices = []
  const paymentStatuses = ['PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
  
  for (let i = 0; i < 15; i++) {
    const trip = trips[i]
    const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]
    
    const customsFee = Math.floor(Math.random() * 500)
    const subtotal = trip.price
    const taxAmount = subtotal * 0.15
    const total = subtotal + taxAmount + customsFee
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(i + 1).padStart(6, '0')}`,
        tripId: trip.id,
        customsBrokerId: trip.customsBrokerId,
        subtotal: subtotal,
        taxAmount: taxAmount,
        customsFee: customsFee,
        total: total,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: status,
        notes: `فاتورة للرحلة ${trip.tripNumber}`,
        paidDate: status === 'PAID' ? new Date() : null
      }
    })
    invoices.push(invoice)
  }

  // 11. Create Customs Clearances
  console.log('📋 Creating customs clearances...')
  const clearanceStatuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'COMPLETED']
  
  for (let i = 0; i < 8; i++) {
    const invoice = invoices[i]
    const status = clearanceStatuses[Math.floor(Math.random() * clearanceStatuses.length)]
    
    await prisma.customsClearance.create({
      data: {
        clearanceNumber: `CLR-${String(i + 1).padStart(5, '0')}`,
        invoiceId: invoice.id,
        customsBrokerId: customsBrokers[i % customsBrokers.length].userId,
        status: status,
        customsFee: Math.floor(Math.random() * 1000) + 500,
        additionalFees: Math.floor(Math.random() * 200),
        totalFees: Math.floor(Math.random() * 1200) + 700,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        actualCompletionDate: status === 'COMPLETED' ? new Date() : null,
        notes: `تخليص جمركي للفاتورة ${invoice.invoiceNumber}`
      }
    })
  }

  // 12. Create Saved Addresses
  console.log('🏠 Creating saved addresses...')
  const addressLabels = ['Home', 'Office', 'Warehouse', 'Factory', 'Store']
  
  for (const customer of customers) {
    for (let i = 0; i < 3; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)]
      await prisma.savedAddress.create({
        data: {
          customerId: customer.id,
          label: addressLabels[i],
          address: `عنوان ${addressLabels[i]} - ${city.nameAr}`,
          latitude: city.latitude + (Math.random() - 0.5) * 0.1,
          longitude: city.longitude + (Math.random() - 0.5) * 0.1,
          cityId: city.id,
          isDefault: i === 0
        }
      })
    }
  }

  console.log('✅ Database seeding completed successfully!')
  console.log(`
📊 Created:
- ${driverUsers.length + customerUsers.length + brokerUsers.length + 5} Users (Admins, Drivers, Customers, Accountants, Brokers)
- ${drivers.length} Driver profiles
- ${customers.length} Customer profiles  
- ${accountants.length} Accountant profiles
- ${customsBrokers.length} Customs Broker profiles
- ${cities.length} Cities
- ${temperatures.length} Temperature settings
- ${vehicleTypes.length} Vehicle types
- ${vehicles.length} Vehicles
- ${trips.length} Trips with various statuses
- ${invoices.length} Invoices with different payment statuses
- 8 Customs clearances
- Multiple tracking logs for active trips
- Saved addresses for customers
- Sample pricing data (18 pricing records for main routes)

🔑 Demo Login Credentials:
- Admin: admin@profleet.com / demo1234
- Driver: driver@profleet.com / demo123
- Customer: customer@profleet.com / demo123
- Accountant: accountant@profleet.com / demo123
- Customs Broker: broker@profleet.sa / password123
- Customs Broker 2: broker@profleet.com / demo123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
