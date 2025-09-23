const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixMissingClearanceInvoices() {
  try {
    console.log('🔍 Finding customs clearances without invoices...')
    
    // Find all clearances that don't have a clearance invoice
    const clearancesWithoutInvoices = await prisma.customsClearance.findMany({
      where: {
        clearanceInvoice: null
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true
          }
        },
        customsBroker: {
          select: {
            name: true
          }
        }
      }
    })

    console.log(`📊 Found ${clearancesWithoutInvoices.length} clearances without invoices`)

    if (clearancesWithoutInvoices.length === 0) {
      console.log('✅ All clearances already have invoices!')
      return
    }

    let createdCount = 0

    for (const clearance of clearancesWithoutInvoices) {
      console.log(`\n🔧 Processing clearance ${clearance.clearanceNumber} for invoice ${clearance.invoice.invoiceNumber}...`)

      // Get customs broker
      const customsBroker = await prisma.customsBroker.findFirst({
        where: {
          userId: clearance.customsBrokerId
        }
      })

      if (!customsBroker) {
        console.log(`❌ Customs broker not found for clearance ${clearance.clearanceNumber}`)
        continue
      }

      // Generate clearance invoice number
      const clearanceInvoiceCount = await prisma.customsClearanceInvoice.count()
      const clearanceInvoiceNumber = `CI-${String(clearanceInvoiceCount + 1).padStart(6, '0')}`

      // Calculate invoice amounts
      const subtotal = clearance.totalFees
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      try {
        // Create the clearance invoice
        const clearanceInvoice = await prisma.customsClearanceInvoice.create({
          data: {
            invoiceNumber: clearanceInvoiceNumber,
            clearanceId: clearance.id,
            customsBrokerId: customsBroker.id,
            customsFee: clearance.customsFee,
            additionalFees: clearance.additionalFees,
            subtotal,
            taxRate,
            taxAmount,
            total,
            remainingAmount: total,
            dueDate: clearance.estimatedCompletionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes: clearance.notes
          }
        })

        console.log(`✅ Created clearance invoice ${clearanceInvoice.invoiceNumber} (Total: ${total} SAR)`)
        createdCount++
      } catch (error) {
        console.error(`❌ Error creating invoice for clearance ${clearance.clearanceNumber}:`, error.message)
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} clearance invoices!`)

    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    const remainingClearancesWithoutInvoices = await prisma.customsClearance.findMany({
      where: {
        clearanceInvoice: null
      }
    })

    console.log(`📊 Remaining clearances without invoices: ${remainingClearancesWithoutInvoices.length}`)

    if (remainingClearancesWithoutInvoices.length === 0) {
      console.log('✅ All clearances now have invoices!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingClearanceInvoices()
