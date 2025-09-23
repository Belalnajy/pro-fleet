const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateExistingClearances() {
  console.log('🔄 Updating Existing Customs Clearances with Percentage Data')
  console.log('=' .repeat(60))

  try {
    // Get all existing clearances
    const clearances = await prisma.customsClearance.findMany({
      include: {
        invoice: {
          include: {
            trip: {
              include: {
                customer: true,
                fromCity: true,
                toCity: true
              }
            }
          }
        }
      }
    })

    console.log(`📋 Found ${clearances.length} existing clearances to update`)
    console.log('')

    let updatedCount = 0

    for (const clearance of clearances) {
      // Skip if already has percentage data
      if (clearance.customsFeeType && clearance.customsFeeType !== 'FIXED') {
        console.log(`⏭️  Skipping ${clearance.clearanceNumber} - already has percentage data`)
        continue
      }

      const invoice = clearance.invoice
      if (!invoice) {
        console.log(`⚠️  Skipping ${clearance.clearanceNumber} - no invoice found`)
        continue
      }

      // Randomly assign fee types for demonstration
      const scenarios = [
        { customsFeeType: 'FIXED', additionalFeesType: 'FIXED' },
        { customsFeeType: 'PERCENTAGE', additionalFeesType: 'FIXED' },
        { customsFeeType: 'FIXED', additionalFeesType: 'PERCENTAGE' },
        { customsFeeType: 'PERCENTAGE', additionalFeesType: 'PERCENTAGE' }
      ]

      const scenario = scenarios[updatedCount % scenarios.length]
      
      let newCustomsFee = clearance.customsFee
      let newAdditionalFees = clearance.additionalFees
      let customsFeePercentage = 0
      let additionalFeesPercentage = 0

      // Convert to percentage if needed
      if (scenario.customsFeeType === 'PERCENTAGE') {
        // Calculate percentage based on current fee
        customsFeePercentage = ((clearance.customsFee / invoice.total) * 100)
        // Round to reasonable percentage
        customsFeePercentage = Math.round(customsFeePercentage * 10) / 10
        // Recalculate actual fee
        newCustomsFee = (invoice.total * customsFeePercentage) / 100
      }

      if (scenario.additionalFeesType === 'PERCENTAGE') {
        // Calculate percentage based on current fee
        additionalFeesPercentage = ((clearance.additionalFees / invoice.total) * 100)
        // Round to reasonable percentage
        additionalFeesPercentage = Math.round(additionalFeesPercentage * 10) / 10
        // Recalculate actual fee
        newAdditionalFees = (invoice.total * additionalFeesPercentage) / 100
      }

      const newTotalFees = newCustomsFee + newAdditionalFees

      // Update clearance
      await prisma.customsClearance.update({
        where: { id: clearance.id },
        data: {
          customsFee: newCustomsFee,
          additionalFees: newAdditionalFees,
          totalFees: newTotalFees,
          customsFeeType: scenario.customsFeeType,
          customsFeePercentage: customsFeePercentage,
          additionalFeesType: scenario.additionalFeesType,
          additionalFeesPercentage: additionalFeesPercentage
        }
      })

      // Update corresponding clearance invoice if exists
      const clearanceInvoice = await prisma.customsClearanceInvoice.findUnique({
        where: { clearanceId: clearance.id }
      })

      if (clearanceInvoice) {
        const subtotal = newTotalFees
        const taxAmount = subtotal * 0.15 // 15% VAT
        const total = subtotal + taxAmount

        await prisma.customsClearanceInvoice.update({
          where: { id: clearanceInvoice.id },
          data: {
            customsFee: newCustomsFee,
            additionalFees: newAdditionalFees,
            subtotal,
            taxAmount,
            total,
            remainingAmount: total - (clearanceInvoice.amountPaid || 0)
          }
        })
      }

      console.log(`✅ Updated ${clearance.clearanceNumber}:`)
      console.log(`   📋 Invoice: ${invoice.invoiceNumber} (${invoice.total} SAR)`)
      console.log(`   🚚 Route: ${invoice.trip.fromCity.name} → ${invoice.trip.toCity.name}`)
      console.log(`   💰 Customs Fee: ${scenario.customsFeeType === 'PERCENTAGE' ? customsFeePercentage + '%' : 'Fixed'} = ${newCustomsFee.toFixed(2)} SAR`)
      console.log(`   💰 Additional Fees: ${scenario.additionalFeesType === 'PERCENTAGE' ? additionalFeesPercentage + '%' : 'Fixed'} = ${newAdditionalFees.toFixed(2)} SAR`)
      console.log(`   💰 Total Fees: ${newTotalFees.toFixed(2)} SAR`)
      console.log('')

      updatedCount++
    }

    console.log(`✅ Successfully updated ${updatedCount} customs clearances!`)
    console.log('')
    console.log('📊 Summary of fee types:')
    console.log('  • Fixed + Fixed: Traditional flat fees')
    console.log('  • Percentage + Fixed: Customs fee as % of invoice')
    console.log('  • Fixed + Percentage: Additional fees as % of invoice')
    console.log('  • Percentage + Percentage: Both fees as % of invoice')

  } catch (error) {
    console.error('❌ Error updating clearances:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateExistingClearances()
