import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createInvoicesForTrips() {
  try {
    console.log('🔍 Finding trips with customs brokers but no invoices...')
    
    // Find trips that have customsBrokerId but no invoice
    const tripsWithoutInvoices = await prisma.trip.findMany({
      where: {
        customsBrokerId: {
          not: null
        },
        invoice: null // No invoice exists for this trip
      },
      include: {
        customsBroker: {
          include: {
            user: true
          }
        },
        fromCity: true,
        toCity: true
      }
    })

    console.log(`📊 Found ${tripsWithoutInvoices.length} trips with customs brokers but no invoices`)

    if (tripsWithoutInvoices.length === 0) {
      console.log('✅ All trips with customs brokers already have invoices')
      return
    }

    // Create invoices for these trips
    for (const trip of tripsWithoutInvoices) {
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      
      // Calculate fees
      const subtotal = trip.price || 500
      const customsFee = Math.round(subtotal * 0.05) // 5% customs fee
      const taxRate = 15 // 15% VAT
      const taxAmount = Math.round((subtotal + customsFee) * (taxRate / 100))
      const total = subtotal + customsFee + taxAmount

      // Random payment status
      const paymentStatuses = ['PAID', 'SENT', 'PENDING', 'OVERDUE']
      const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)]

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          tripId: trip.id,
          customsBrokerId: trip.customsBrokerId!,
          subtotal,
          taxAmount,
          customsFee,
          total,
          taxRate,
          currency: 'SAR',
          paymentStatus,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          ...(paymentStatus === 'PAID' && {
            paidDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
          }),
          notes: `Invoice for trip ${trip.tripNumber} from ${trip.fromCity.name} to ${trip.toCity.name}`
        }
      })

      // Create customs clearance
      const clearanceStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']
      const clearanceStatus = clearanceStatuses[Math.floor(Math.random() * clearanceStatuses.length)]

      await prisma.customsClearance.create({
        data: {
          clearanceNumber: `CLR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          invoiceId: invoice.id,
          customsBrokerId: trip.customsBrokerId!,
          status: clearanceStatus,
          submittedDate: new Date(),
          ...(clearanceStatus === 'COMPLETED' && {
            completedDate: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) // Random date within last 3 days
          }),
          notes: `Customs clearance for trip ${trip.tripNumber}`
        }
      })

      console.log(`✅ Created invoice ${invoiceNumber} and clearance for trip ${trip.tripNumber} (Broker: ${trip.customsBroker?.user.name})`)
    }

    console.log(`🎉 Successfully created ${tripsWithoutInvoices.length} invoices and clearances`)

  } catch (error) {
    console.error('❌ Error creating invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createInvoicesForTrips()
