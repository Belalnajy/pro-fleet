const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDemoUsers() {
  try {
    console.log('Creating demo users...')
    
    const hashedPassword = await bcrypt.hash('demo123', 12)
    
    // Create Admin User
    const admin = await prisma.user.upsert({
      where: { email: 'admin@profleet.com' },
      update: {},
      create: {
        email: 'admin@profleet.com',
        password: hashedPassword,
        name: 'Admin User',
        phone: '+966500000001',
        role: 'ADMIN',
        isActive: true,
      },
    })

    // Create Driver User
    const driverUser = await prisma.user.upsert({
      where: { email: 'driver@profleet.com' },
      update: {},
      create: {
        email: 'driver@profleet.com',
        password: hashedPassword,
        name: 'Abdelbagi Ali',
        phone: '+966501265798',
        role: 'DRIVER',
        isActive: true,
      },
    })

    const driver = await prisma.driver.upsert({
      where: { userId: driverUser.id },
      update: {},
      create: {
        userId: driverUser.id,
        nationality: 'Saudi',
        carPlateNumber: '5580',
        carRegistration: 'IST-123456',
        licenseExpiry: new Date('2026-12-31'),
        isAvailable: true,
        trackingEnabled: true,
        currentLocation: JSON.stringify({ lat: 24.7136, lng: 46.6753 }),
      },
    })

    // Create Customer User
    const customerUser = await prisma.user.upsert({
      where: { email: 'customer@profleet.com' },
      update: {},
      create: {
        email: 'customer@profleet.com',
        password: hashedPassword,
        name: 'Customer Company',
        phone: '+966500000002',
        role: 'CUSTOMER',
        isActive: true,
      },
    })

    const customer = await prisma.customer.upsert({
      where: { userId: customerUser.id },
      update: {},
      create: {
        userId: customerUser.id,
        companyName: 'Customer Company Ltd',
        address: 'Riyadh, Saudi Arabia',
        preferredLang: 'en',
      },
    })

    // Create Accountant User
    const accountantUser = await prisma.user.upsert({
      where: { email: 'accountant@profleet.com' },
      update: {},
      create: {
        email: 'accountant@profleet.com',
        password: hashedPassword,
        name: 'Accountant User',
        phone: '+966500000003',
        role: 'ACCOUNTANT',
        isActive: true,
      },
    })

    await prisma.accountant.upsert({
      where: { userId: accountantUser.id },
      update: {},
      create: {
        userId: accountantUser.id,
      },
    })

    // Create Customs Broker User
    const customsBrokerUser = await prisma.user.upsert({
      where: { email: 'broker@profleet.com' },
      update: {},
      create: {
        email: 'broker@profleet.com',
        password: hashedPassword,
        name: 'Customs Broker',
        phone: '+966500000004',
        role: 'CUSTOMS_BROKER',
        isActive: true,
      },
    })

    const customsBroker = await prisma.customsBroker.upsert({
      where: { userId: customsBrokerUser.id },
      update: {},
      create: {
        userId: customsBrokerUser.id,
        licenseNumber: 'CB-789012',
      },
    })

    console.log('✅ Demo users created successfully!')
    console.log('🔐 Demo Accounts:')
    console.log('Admin: admin@profleet.com / demo123')
    console.log('Driver: driver@profleet.com / demo123')
    console.log('Customer: customer@profleet.com / demo123')
    console.log('Accountant: accountant@profleet.com / demo123')
    console.log('Customs Broker: broker@profleet.com / demo123')

  } catch (error) {
    console.error('❌ Error creating demo users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoUsers()