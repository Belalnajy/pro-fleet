const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTrips() {
  try {
    console.log('🔍 Checking trips data...')

    // Check all trips with customer info
    const trips = await prisma.trip.findMany({
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        fromCity: {
          select: {
            name: true
          }
        },
        toCity: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log(`\n🚛 Total Trips: ${trips.length}`)
    trips.forEach((trip, index) => {
      console.log(`\nTrip ${index + 1}:`)
      console.log(`- Trip Number: ${trip.tripNumber}`)
      console.log(`- Customer ID: ${trip.customerId}`)
      console.log(`- Customer Email: ${trip.customer?.email || 'N/A'}`)
      console.log(`- Customer Role: ${trip.customer?.role || 'N/A'}`)
      console.log(`- Route: ${trip.fromCity?.name} → ${trip.toCity?.name}`)
      console.log(`- Status: ${trip.status}`)
      console.log(`- Price: ${trip.price} ${trip.currency}`)
    })

    // Check customer user
    const customerUser = await prisma.user.findFirst({
      where: {
        role: 'CUSTOMER'
      }
    })
    
    console.log(`\n👤 Customer User:`)
    console.log(`- ID: ${customerUser?.id}`)
    console.log(`- Email: ${customerUser?.email}`)
    console.log(`- Role: ${customerUser?.role}`)

    // Check if any trips belong to this customer
    const customerTrips = await prisma.trip.findMany({
      where: {
        customerId: customerUser?.id
      }
    })
    
    console.log(`\n🎯 Trips for customer ${customerUser?.email}: ${customerTrips.length}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTrips()
