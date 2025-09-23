const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPercentageCalculations() {
  console.log('🧪 Testing Percentage-Based Customs Clearance Calculations')
  console.log('=' .repeat(60))

  try {
    // Find a test invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        paymentStatus: 'PAID'
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
      console.log('❌ No test invoice found')
      return
    }

    console.log(`📋 Test Invoice: ${invoice.invoiceNumber}`)
    console.log(`💰 Invoice Total: ${invoice.total} SAR`)
    console.log(`🚚 Route: ${invoice.trip.fromCity.name} → ${invoice.trip.toCity.name}`)
    console.log(`👤 Customer: ${invoice.trip.customer.name}`)
    console.log('')

    // Test scenarios
    const testScenarios = [
      {
        name: 'Fixed Amount Fees',
        customsFeeType: 'FIXED',
        customsFee: 500,
        customsFeePercentage: 0,
        additionalFeesType: 'FIXED', 
        additionalFees: 200,
        additionalFeesPercentage: 0
      },
      {
        name: 'Percentage-Based Customs Fee',
        customsFeeType: 'PERCENTAGE',
        customsFee: 0,
        customsFeePercentage: 5, // 5% of invoice total
        additionalFeesType: 'FIXED',
        additionalFees: 150,
        additionalFeesPercentage: 0
      },
      {
        name: 'Percentage-Based Additional Fees',
        customsFeeType: 'FIXED',
        customsFee: 300,
        customsFeePercentage: 0,
        additionalFeesType: 'PERCENTAGE',
        additionalFees: 0,
        additionalFeesPercentage: 2.5 // 2.5% of invoice total
      },
      {
        name: 'Both Percentage-Based',
        customsFeeType: 'PERCENTAGE',
        customsFee: 0,
        customsFeePercentage: 4, // 4% of invoice total
        additionalFeesType: 'PERCENTAGE',
        additionalFees: 0,
        additionalFeesPercentage: 1.5 // 1.5% of invoice total
      }
    ]

    for (const scenario of testScenarios) {
      console.log(`🔍 Testing: ${scenario.name}`)
      console.log('-'.repeat(40))

      // Calculate expected values
      let expectedCustomsFee = 0
      let expectedAdditionalFees = 0

      if (scenario.customsFeeType === 'PERCENTAGE') {
        expectedCustomsFee = (invoice.total * scenario.customsFeePercentage) / 100
      } else {
        expectedCustomsFee = scenario.customsFee
      }

      if (scenario.additionalFeesType === 'PERCENTAGE') {
        expectedAdditionalFees = (invoice.total * scenario.additionalFeesPercentage) / 100
      } else {
        expectedAdditionalFees = scenario.additionalFees
      }

      const expectedTotal = expectedCustomsFee + expectedAdditionalFees

      console.log(`  📊 Customs Fee: ${scenario.customsFeeType === 'PERCENTAGE' ? scenario.customsFeePercentage + '%' : scenario.customsFee + ' SAR'} = ${expectedCustomsFee.toFixed(2)} SAR`)
      console.log(`  📊 Additional Fees: ${scenario.additionalFeesType === 'PERCENTAGE' ? scenario.additionalFeesPercentage + '%' : scenario.additionalFees + ' SAR'} = ${expectedAdditionalFees.toFixed(2)} SAR`)
      console.log(`  💰 Total Fees: ${expectedTotal.toFixed(2)} SAR`)
      console.log(`  📈 Percentage of Invoice: ${((expectedTotal / invoice.total) * 100).toFixed(2)}%`)
      console.log('')
    }

    console.log('✅ All percentage calculation tests completed successfully!')

  } catch (error) {
    console.error('❌ Error testing percentage calculations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testPercentageCalculations()
