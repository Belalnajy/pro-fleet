const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCustomsClearances() {
  try {
    console.log('🔍 Checking existing data...')
    
    // Check if we have customs brokers
    const customsBrokers = await prisma.user.findMany({
      where: { role: 'CUSTOMS_BROKER' }
    })
    
    console.log(`Found ${customsBrokers.length} customs brokers`)
    
    if (customsBrokers.length === 0) {
      console.log('❌ No customs brokers found. Please run the main seed script first.')
      return
    }
    
    // Check if we have invoices
    const invoices = await prisma.invoice.findMany({
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
    
    console.log(`Found ${invoices.length} invoices`)
    
    if (invoices.length === 0) {
      console.log('❌ No invoices found. Please run the main seed script first.')
      return
    }
    
    // Check existing clearances
    const existingClearances = await prisma.customsClearance.findMany()
    console.log(`Found ${existingClearances.length} existing customs clearances`)
    
    if (existingClearances.length > 0) {
      console.log('✅ Customs clearances already exist. Skipping seed.')
      return
    }
    
    console.log('🌱 Creating demo customs clearances...')
    
    const customsBroker = customsBrokers[0] // Use first customs broker
    
    // Create clearances for the first few invoices
    const clearancesToCreate = invoices.slice(0, Math.min(5, invoices.length))
    
    for (let i = 0; i < clearancesToCreate.length; i++) {
      const invoice = clearancesToCreate[i]
      const clearanceNumber = `CLR-${Date.now()}-${String(i + 1).padStart(3, '0')}`
      
      const customsFee = Math.floor(Math.random() * 2000) + 500 // 500-2500 SAR
      const additionalFees = Math.floor(Math.random() * 500) + 100 // 100-600 SAR
      const totalFees = customsFee + additionalFees
      
      const statuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      const estimatedDate = new Date()
      estimatedDate.setDate(estimatedDate.getDate() + Math.floor(Math.random() * 10) + 1) // 1-10 days from now
      
      let actualCompletionDate = null
      if (status === 'COMPLETED') {
        actualCompletionDate = new Date()
        actualCompletionDate.setDate(actualCompletionDate.getDate() - Math.floor(Math.random() * 5)) // 0-5 days ago
      }
      
      await prisma.customsClearance.create({
        data: {
          clearanceNumber,
          invoiceId: invoice.id,
          customsBrokerId: customsBroker.id,
          status,
          customsFee,
          additionalFees,
          totalFees,
          estimatedCompletionDate: estimatedDate,
          actualCompletionDate,
          notes: `Demo clearance for trip ${invoice.trip.fromCity.name} to ${invoice.trip.toCity.name}. Customer: ${invoice.trip.customer.name}`
        }
      })
      
      console.log(`✅ Created clearance ${clearanceNumber} for invoice ${invoice.invoiceNumber}`)
    }
    
    console.log('🎉 Successfully created demo customs clearances!')
    
    // Display summary
    const finalClearances = await prisma.customsClearance.findMany({
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
    
    console.log('\n📊 Summary:')
    console.log(`Total clearances: ${finalClearances.length}`)
    finalClearances.forEach(clearance => {
      console.log(`- ${clearance.clearanceNumber}: ${clearance.status} (${clearance.invoice.trip.fromCity.name} → ${clearance.invoice.trip.toCity.name})`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding customs clearances:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCustomsClearances()
