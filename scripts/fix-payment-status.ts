import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPaymentStatus() {
  try {
    console.log('🔧 Fixing payment statuses...')

    // Get customs broker
    const customsBroker = await prisma.customsBroker.findFirst({
      where: {
        user: {
          email: 'broker@profleet.sa'
        }
      }
    })

    if (!customsBroker) {
      console.log('❌ No customs broker found')
      return
    }

    // Get all invoices for this broker
    const invoices = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id
      }
    })

    console.log(`📄 Found ${invoices.length} invoices`)

    // Update payment statuses to create variety
    const statuses = ['PAID', 'PAID', 'PAID', 'SENT', 'SENT', 'PENDING', 'PENDING', 'OVERDUE']
    
    for (let i = 0; i < invoices.length; i++) {
      const newStatus = statuses[i % statuses.length] as any
      const updateData: any = { 
        paymentStatus: newStatus
      }
      
      // Set paid date for PAID invoices
      if (newStatus === 'PAID') {
        updateData.paidDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      } else {
        updateData.paidDate = null
      }
      
      await prisma.invoice.update({
        where: { id: invoices[i].id },
        data: updateData
      })
      
      console.log(`✅ Updated invoice ${invoices[i].invoiceNumber} to ${newStatus}`)
    }

    // Print summary
    const updatedInvoices = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id
      }
    })

    const statusCounts = updatedInvoices.reduce((acc, invoice) => {
      acc[invoice.paymentStatus] = (acc[invoice.paymentStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 Updated Payment Status Summary:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`)
    })

    // Also update some clearances to have actual completion dates
    const clearances = await prisma.customsClearance.findMany({
      where: {
        customsBrokerId: customsBroker.userId,
        status: { in: ['COMPLETED', 'APPROVED'] }
      }
    })

    for (const clearance of clearances) {
      await prisma.customsClearance.update({
        where: { id: clearance.id },
        data: {
          actualCompletionDate: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
        }
      })
    }

    console.log(`🏛️ Updated ${clearances.length} clearances with completion dates`)
    console.log('\n🎉 Payment statuses fixed successfully!')

  } catch (error) {
    console.error('❌ Error fixing payment statuses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPaymentStatus()
