import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDistribution() {
  try {
    console.log('📊 Checking current invoice distribution...')

    // Get all customs brokers with their invoices
    const customsBrokers = await prisma.customsBroker.findMany({
      include: {
        user: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            paymentStatus: true,
            total: true
          }
        }
      }
    })

    console.log(`\n👥 Found ${customsBrokers.length} customs brokers:\n`)

    for (const broker of customsBrokers) {
      console.log(`🏢 ${broker.user.name} (${broker.user.email})`)
      console.log(`   - License: ${broker.licenseNumber}`)
      console.log(`   - Invoices: ${broker.invoices.length}`)
      
      if (broker.invoices.length > 0) {
        const paidCount = broker.invoices.filter(inv => inv.paymentStatus === 'PAID').length
        const pendingCount = broker.invoices.filter(inv => inv.paymentStatus === 'PENDING').length
        const sentCount = broker.invoices.filter(inv => inv.paymentStatus === 'SENT').length
        const overdueCount = broker.invoices.filter(inv => inv.paymentStatus === 'OVERDUE').length
        
        console.log(`   - Payment Status:`)
        console.log(`     • PAID: ${paidCount}`)
        console.log(`     • SENT: ${sentCount}`)
        console.log(`     • PENDING: ${pendingCount}`)
        console.log(`     • OVERDUE: ${overdueCount}`)
        
        const totalAmount = broker.invoices.reduce((sum, inv) => sum + inv.total, 0)
        console.log(`   - Total Amount: ${totalAmount.toFixed(2)} SAR`)
      }
      console.log('')
    }

    // Check unassigned invoices
    const unassignedCount = await prisma.invoice.count({
      where: { customsBrokerId: null }
    })
    
    if (unassignedCount > 0) {
      console.log(`⚠️ ${unassignedCount} invoices are not assigned to any broker`)
    } else {
      console.log('✅ All invoices are assigned to brokers')
    }

  } catch (error) {
    console.error('❌ Error checking distribution:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDistribution()
