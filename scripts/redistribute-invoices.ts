import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function redistributeInvoices() {
  try {
    console.log('🔄 Redistributing invoices evenly among customs brokers...')

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

    // Get all invoices
    const allInvoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'asc' }
    })

    console.log(`📄 Found ${allInvoices.length} total invoices`)

    // Calculate invoices per broker
    const invoicesPerBroker = Math.floor(allInvoices.length / customsBrokers.length)
    const remainingInvoices = allInvoices.length % customsBrokers.length

    console.log(`📊 Target distribution: ${invoicesPerBroker} invoices per broker (+${remainingInvoices} extra)`)

    // Redistribute invoices
    let invoiceIndex = 0
    const updates = []

    for (let brokerIndex = 0; brokerIndex < customsBrokers.length; brokerIndex++) {
      const broker = customsBrokers[brokerIndex]
      const invoicesToAssign = invoicesPerBroker + (brokerIndex < remainingInvoices ? 1 : 0)
      
      console.log(`\n📋 Assigning ${invoicesToAssign} invoices to ${broker.user.name}:`)
      
      for (let i = 0; i < invoicesToAssign && invoiceIndex < allInvoices.length; i++) {
        const invoice = allInvoices[invoiceIndex]
        
        updates.push(
          prisma.invoice.update({
            where: { id: invoice.id },
            data: { customsBrokerId: broker.id }
          })
        )
        
        console.log(`   - ${invoice.invoiceNumber}`)
        invoiceIndex++
      }
    }

    // Execute all updates
    await Promise.all(updates)

    // Print final summary
    console.log('\n📊 Final Distribution:')
    for (const broker of customsBrokers) {
      const invoiceCount = await prisma.invoice.count({
        where: { customsBrokerId: broker.id }
      })
      console.log(`   - ${broker.user.name}: ${invoiceCount} invoices`)
    }

    console.log('\n🎉 Invoice redistribution completed!')

  } catch (error) {
    console.error('❌ Error redistributing invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

redistributeInvoices()
