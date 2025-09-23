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

      // Determine payment scenario randomly
      const scenarios = ['PAID', 'PARTIAL', 'INSTALLMENT', 'PENDING', 'SENT']
      const paymentStatus = scenarios[Math.floor(Math.random() * scenarios.length)]
      
      let amountPaid = 0
      let remainingAmount = total
      let installmentCount = null
      let installmentsPaid = 0
      let installmentAmount = null
      let nextInstallmentDate = null
      let paidDate = null

      // Set payment details based on status
      if (paymentStatus === 'PAID') {
        amountPaid = total
        remainingAmount = 0
        paidDate = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) // Random date in last 10 days
      } else if (paymentStatus === 'PARTIAL') {
        amountPaid = Math.round(total * (0.3 + Math.random() * 0.4)) // 30-70% paid
        remainingAmount = total - amountPaid
      } else if (paymentStatus === 'INSTALLMENT') {
        installmentCount = [3, 4, 6, 12][Math.floor(Math.random() * 4)] // Random installment count
        installmentAmount = Math.round(total / installmentCount)
        installmentsPaid = Math.floor(Math.random() * (installmentCount - 1)) // Random installments paid
        amountPaid = installmentsPaid * installmentAmount
        remainingAmount = total - amountPaid
        
        // Set next installment date (random future date)
        if (installmentsPaid < installmentCount) {
          nextInstallmentDate = new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000) // 7-37 days from now
        }
      }

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
          paymentStatus,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: `Invoice for trip ${trip.tripNumber}`,
          // New payment tracking fields
          amountPaid,
          remainingAmount,
          installmentCount,
          installmentsPaid,
          installmentAmount,
          nextInstallmentDate,
          paidDate
        }
      })

      // Create payment records if there are payments
      if (amountPaid > 0) {
        if (paymentStatus === 'PAID') {
          // Create single payment record
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: amountPaid,
              paymentMethod: ['BANK_TRANSFER', 'CASH', 'CHECK'][Math.floor(Math.random() * 3)],
              reference: `PAY-${Date.now()}`,
              paymentDate: paidDate,
              notes: 'Full payment'
            }
          })
        } else if (paymentStatus === 'PARTIAL') {
          // Create partial payment record
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: amountPaid,
              paymentMethod: ['BANK_TRANSFER', 'CASH', 'CHECK'][Math.floor(Math.random() * 3)],
              reference: `PAY-${Date.now()}`,
              paymentDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
              notes: 'Partial payment'
            }
          })
        } else if (paymentStatus === 'INSTALLMENT' && installmentsPaid > 0) {
          // Create installment payment records
          for (let i = 0; i < installmentsPaid; i++) {
            await prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                amount: installmentAmount,
                paymentMethod: ['BANK_TRANSFER', 'CASH', 'CHECK'][Math.floor(Math.random() * 3)],
                reference: `INST-${Date.now()}-${i + 1}`,
                paymentDate: new Date(Date.now() - (installmentsPaid - i) * 30 * 24 * 60 * 60 * 1000),
                notes: `Installment ${i + 1} of ${installmentCount}`
              }
            })
          }
        }
      }

      console.log(`✅ Created invoice ${invoice.invoiceNumber} for trip ${trip.tripNumber} (${paymentStatus})`)
    }

    console.log('🎉 Invoice seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedInvoices()
