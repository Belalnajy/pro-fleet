const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestInvoices() {
  try {
    console.log('🔧 Creating test invoices for accountant...')

    // Get some delivered trips
    const trips = await prisma.trip.findMany({
      where: {
        status: 'DELIVERED'
      },
      take: 5,
      include: {
        customer: true
      }
    })

    if (trips.length === 0) {
      console.log('❌ No delivered trips found. Creating some test trips first...')
      
      // Get a customer
      const customer = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' }
      })

      if (!customer) {
        console.log('❌ No customers found. Please run comprehensive seed first.')
        return
      }

      // Get cities
      const cities = await prisma.city.findMany({ take: 2 })
      if (cities.length < 2) {
        console.log('❌ Not enough cities found. Please run comprehensive seed first.')
        return
      }

      // Get vehicle type
      const vehicleType = await prisma.vehicleTypeModel.findFirst()
      if (!vehicleType) {
        console.log('❌ No vehicle types found. Please run comprehensive seed first.')
        return
      }

      // Create a simple trip
      const trip = await prisma.trip.create({
        data: {
          tripNumber: `TEST-${Date.now()}`,
          customerId: customer.id,
          fromCityId: cities[0].id,
          toCityId: cities[1].id,
          scheduledDate: new Date(),
          status: 'DELIVERED',
          price: 1500,
          deliveredDate: new Date(),
          notes: 'Test trip for invoice creation'
        }
      })

      trips.push(trip)
      console.log('✅ Created test trip:', trip.tripNumber)
    }

    // Create invoices for trips
    let createdCount = 0
    for (const trip of trips) {
      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findFirst({
        where: { tripId: trip.id }
      })

      if (existingInvoice) {
        console.log(`⏭️  Invoice already exists for trip ${trip.tripNumber}`)
        continue
      }

      // Generate invoice number
      const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: 'desc' }
      })
      
      let invoiceNumber = "INV-000001"
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1])
        invoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`
      }

      // Calculate amounts
      const subtotal = trip.price || 1000
      const taxAmount = subtotal * 0.15 // 15% VAT
      const total = subtotal + taxAmount

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          tripId: trip.id,
          subtotal,
          taxRate: 0.15,
          taxAmount,
          total,
          currency: 'SAR',
          paymentStatus: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: 'Test invoice created by script'
        }
      })

      console.log(`✅ Created invoice ${invoice.invoiceNumber} for trip ${trip.tripNumber}`)
      createdCount++
    }

    console.log(`🎉 Successfully created ${createdCount} test invoices!`)

    // Show summary
    const totalInvoices = await prisma.invoice.count()
    console.log(`📊 Total invoices in system: ${totalInvoices}`)

  } catch (error) {
    console.error('❌ Error creating test invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestInvoices()
