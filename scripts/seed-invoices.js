const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedInvoices() {
  try {
    console.log('🌱 Seeding invoices...')

    // Get delivered trips that don't have invoices yet
    const deliveredTrips = await prisma.trip.findMany({
      where: {
        status: 'DELIVERED',
        invoice: null // No invoice exists for this trip
      },
      include: {
        customer: true
      }
    })

    console.log(`Found ${deliveredTrips.length} delivered trips without invoices`)

    for (const trip of deliveredTrips) {
      const subtotal = trip.price
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate
      const customsFee = subtotal * 0.02 // 2% customs fee
      const total = subtotal + taxAmount + customsFee

      // Generate unique invoice number
      const invoiceCount = await prisma.invoice.count()
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          tripId: trip.id,
          subtotal,
          taxRate,
          taxAmount,
          customsFee,
          total,
          currency: 'SAR',
          paymentStatus: 'SENT', // Default status
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: `Invoice for trip ${trip.tripNumber}`
        }
      })

      console.log(`✅ Created invoice ${invoice.invoiceNumber} for trip ${trip.tripNumber}`)
    }

    console.log('🎉 Invoice seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedInvoices()
