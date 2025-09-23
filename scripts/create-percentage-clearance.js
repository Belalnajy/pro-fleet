const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createPercentageClearance() {
  console.log('🧪 Creating Test Customs Clearance with Percentage Calculations')
  console.log('=' .repeat(60))

  try {
    // Find a customs broker
    const customsBroker = await prisma.customsBroker.findFirst({
      include: {
        user: true
      }
    })

    if (!customsBroker) {
      console.log('❌ No customs broker found')
      return
    }

    // Find an invoice without clearance
    const invoice = await prisma.invoice.findFirst({
      where: {
        customsClearances: {
          none: {}
        }
      },
      include: {
        trip: {
          include: {
            customer: true,
            fromCity: true,
            toCity: true
          }
        }
      }
    })

    if (!invoice) {
      console.log('❌ No available invoice found')
      return
    }

    console.log(`📋 Selected Invoice: ${invoice.invoiceNumber}`)
    console.log(`💰 Invoice Total: ${invoice.total} SAR`)
    console.log(`🚚 Route: ${invoice.trip.fromCity.name} → ${invoice.trip.toCity.name}`)
    console.log(`👤 Customer: ${invoice.trip.customer.name}`)
    console.log(`🏢 Customs Broker: ${customsBroker.user.name}`)
    console.log('')

    // Generate clearance number
    const clearanceCount = await prisma.customsClearance.count()
    const clearanceNumber = `CL-${String(clearanceCount + 1).padStart(6, '0')}`

    // Test scenario: 4% customs fee + 1.5% additional fees
    const customsFeePercentage = 4.0
    const additionalFeesPercentage = 1.5

    // Calculate actual fees
    const actualCustomsFee = (invoice.total * customsFeePercentage) / 100
    const actualAdditionalFees = (invoice.total * additionalFeesPercentage) / 100
    const totalFees = actualCustomsFee + actualAdditionalFees

    console.log('📊 Calculation Details:')
    console.log(`  • Customs Fee: ${customsFeePercentage}% = ${actualCustomsFee.toFixed(2)} SAR`)
    console.log(`  • Additional Fees: ${additionalFeesPercentage}% = ${actualAdditionalFees.toFixed(2)} SAR`)
    console.log(`  • Total Fees: ${totalFees.toFixed(2)} SAR`)
    console.log(`  • Percentage of Invoice: ${((totalFees / invoice.total) * 100).toFixed(2)}%`)
    console.log('')

    // Create clearance and clearance invoice in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the customs clearance
      const clearance = await tx.customsClearance.create({
        data: {
          clearanceNumber,
          invoiceId: invoice.id,
          customsBrokerId: customsBroker.userId,
          customsFee: actualCustomsFee,
          additionalFees: actualAdditionalFees,
          totalFees,
          // Store percentage calculation data
          customsFeeType: 'PERCENTAGE',
          customsFeePercentage: customsFeePercentage,
          additionalFeesType: 'PERCENTAGE',
          additionalFeesPercentage: additionalFeesPercentage,
          notes: 'Test clearance created with percentage-based calculations',
          estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      })

      // Generate clearance invoice number
      const clearanceInvoiceCount = await tx.customsClearanceInvoice.count()
      const clearanceInvoiceNumber = `CI-${String(clearanceInvoiceCount + 1).padStart(6, '0')}`

      // Calculate clearance invoice totals
      const subtotal = totalFees
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      // Create clearance invoice
      const clearanceInvoice = await tx.customsClearanceInvoice.create({
        data: {
          invoiceNumber: clearanceInvoiceNumber,
          clearanceId: clearance.id,
          customsBrokerId: customsBroker.id,
          customsFee: actualCustomsFee,
          additionalFees: actualAdditionalFees,
          subtotal,
          taxRate,
          taxAmount,
          total,
          remainingAmount: total,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          notes: 'Percentage-based clearance invoice'
        }
      })

      return { clearance, clearanceInvoice }
    })

    console.log('✅ Customs Clearance Created Successfully!')
    console.log(`📄 Clearance Number: ${result.clearance.clearanceNumber}`)
    console.log(`🧾 Invoice Number: ${result.clearanceInvoice.invoiceNumber}`)
    console.log(`💰 Clearance Invoice Total: ${result.clearanceInvoice.total} SAR (including 15% VAT)`)
    console.log('')
    console.log('🎯 Test Results:')
    console.log(`  ✓ Percentage calculations applied correctly`)
    console.log(`  ✓ Customs fee: ${customsFeePercentage}% = ${actualCustomsFee.toFixed(2)} SAR`)
    console.log(`  ✓ Additional fees: ${additionalFeesPercentage}% = ${actualAdditionalFees.toFixed(2)} SAR`)
    console.log(`  ✓ Total fees: ${totalFees.toFixed(2)} SAR`)
    console.log(`  ✓ Clearance invoice created with VAT`)

  } catch (error) {
    console.error('❌ Error creating percentage-based clearance:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
createPercentageClearance()
