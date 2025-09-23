const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateExistingInvoices() {
  try {
    console.log('🔄 Updating existing invoices with new payment fields...')

    // Get all existing invoices
    const invoices = await prisma.invoice.findMany()

    console.log(`Found ${invoices.length} invoices to update`)

    for (const invoice of invoices) {
      // Determine payment scenario based on current status or randomly
      let paymentStatus = invoice.paymentStatus
      let amountPaid = 0
      let remainingAmount = invoice.total
      let installmentCount = null
      let installmentsPaid = 0
      let installmentAmount = null
      let nextInstallmentDate = null
      let paidDate = invoice.paidDate

      // If status is already set, use it, otherwise randomize
      if (!paymentStatus || paymentStatus === 'SENT') {
        const scenarios = ['PAID', 'PARTIAL', 'INSTALLMENT', 'PENDING', 'SENT']
        paymentStatus = scenarios[Math.floor(Math.random() * scenarios.length)]
      }

      // Set payment details based on status
      if (paymentStatus === 'PAID') {
        amountPaid = invoice.total
        remainingAmount = 0
        if (!paidDate) {
          paidDate = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
        }
      } else if (paymentStatus === 'PARTIAL') {
        amountPaid = Math.round(invoice.total * (0.3 + Math.random() * 0.4)) // 30-70% paid
        remainingAmount = invoice.total - amountPaid
      } else if (paymentStatus === 'INSTALLMENT') {
        installmentCount = [3, 4, 6, 12][Math.floor(Math.random() * 4)]
        installmentAmount = Math.round(invoice.total / installmentCount)
        installmentsPaid = Math.floor(Math.random() * (installmentCount - 1))
        amountPaid = installmentsPaid * installmentAmount
        remainingAmount = invoice.total - amountPaid
        
        if (installmentsPaid < installmentCount) {
          nextInstallmentDate = new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000)
        }
      }

      // Update invoice
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentStatus,
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
        // Delete existing payment records to avoid duplicates
        await prisma.payment.deleteMany({
          where: { invoiceId: invoice.id }
        })

        if (paymentStatus === 'PAID') {
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: amountPaid,
              paymentMethod: ['BANK_TRANSFER', 'CASH', 'CHECK'][Math.floor(Math.random() * 3)],
              reference: `PAY-${Date.now()}-${invoice.id}`,
              paymentDate: paidDate,
              notes: 'Full payment'
            }
          })
        } else if (paymentStatus === 'PARTIAL') {
          await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: amountPaid,
              paymentMethod: ['BANK_TRANSFER', 'CASH', 'CHECK'][Math.floor(Math.random() * 3)],
              reference: `PAY-${Date.now()}-${invoice.id}`,
              paymentDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
              notes: 'Partial payment'
            }
          })
        } else if (paymentStatus === 'INSTALLMENT' && installmentsPaid > 0) {
          for (let i = 0; i < installmentsPaid; i++) {
            await prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                amount: installmentAmount,
                paymentMethod: ['BANK_TRANSFER', 'CASH', 'CHECK'][Math.floor(Math.random() * 3)],
                reference: `INST-${Date.now()}-${invoice.id}-${i + 1}`,
                paymentDate: new Date(Date.now() - (installmentsPaid - i) * 30 * 24 * 60 * 60 * 1000),
                notes: `Installment ${i + 1} of ${installmentCount}`
              }
            })
          }
        }
      }

      console.log(`✅ Updated invoice ${invoice.invoiceNumber} (${paymentStatus})`)
    }

    console.log('🎉 Invoice update completed!')
  } catch (error) {
    console.error('❌ Error updating invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateExistingInvoices()
