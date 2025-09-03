const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Checking existing data...')

    // Check users
    const users = await prisma.user.findMany({
      include: {
        driverProfile: true,
        customerProfile: true,
      },
    })
    
    console.log('👥 Users:')
    users.forEach(user => {
      console.log(`- ${user.role}: ${user.email} (ID: ${user.id})`)
      if (user.driverProfile) {
        console.log(`  Driver Profile ID: ${user.driverProfile.id}`)
      }
      if (user.customerProfile) {
        console.log(`  Customer Profile ID: ${user.customerProfile.id}`)
      }
    })

    // Check cities
    const cities = await prisma.city.findMany()
    console.log(`\n🏙️ Cities: ${cities.length}`)
    cities.slice(0, 3).forEach(city => {
      console.log(`- ${city.name} (${city.id})`)
    })

    // Check vehicles
    const vehicles = await prisma.vehicle.findMany()
    console.log(`\n🚛 Vehicles: ${vehicles.length}`)
    vehicles.slice(0, 3).forEach(vehicle => {
      console.log(`- ${vehicle.type} (${vehicle.id})`)
    })

    // Check temperature settings
    const tempSettings = await prisma.temperatureSetting.findMany()
    console.log(`\n🌡️ Temperature Settings: ${tempSettings.length}`)
    tempSettings.slice(0, 3).forEach(temp => {
      console.log(`- ${temp.option}: ${temp.value}°C (${temp.id})`)
    })

    // Check trips
    const trips = await prisma.trip.findMany()
    console.log(`\n🚗 Existing Trips: ${trips.length}`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
