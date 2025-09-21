import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function distributeInvoices() {
  try {
    console.log('🔄 Distributing invoices among customs brokers...')

    // Get all customs brokers
    const customsBrokers = await prisma.customsBroker.findMany({
      include: {
        user: true
      }
    })

    console.log(`👥 Found ${customsBrokers.length} customs brokers`)

    if (customsBrokers.length === 0) {
      console.log('❌ No customs brokers found')
      return
    }

    // Get all invoices without customs broker
    const unassignedInvoices = await prisma.invoice.findMany({
      where: {
        customsBrokerId: null
      }
    })

    console.log(`📄 Found ${unassignedInvoices.length} unassigned invoices`)

    if (unassignedInvoices.length === 0) {
      console.log('✅ All invoices are already assigned')
      return
    }

    // Distribute invoices evenly among brokers
    let brokerIndex = 0
    const updates = []

    for (const invoice of unassignedInvoices) {
      const broker = customsBrokers[brokerIndex % customsBrokers.length]
      
      updates.push(
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { customsBrokerId: broker.id }
        })
      )

      console.log(`📋 Assigning invoice ${invoice.invoiceNumber} to ${broker.user.name}`)
      brokerIndex++
    }

    // Execute all updates
    await Promise.all(updates)

    // Print summary
    console.log('\n📊 Distribution Summary:')
    for (const broker of customsBrokers) {
      const invoiceCount = await prisma.invoice.count({
        where: { customsBrokerId: broker.id }
      })
      console.log(`   - ${broker.user.name}: ${invoiceCount} invoices`)
    }

    console.log('\n🎉 Invoice distribution completed!')

  } catch (error) {
    console.error('❌ Error distributing invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

distributeInvoices()
