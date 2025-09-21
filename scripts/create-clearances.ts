import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createClearances() {
  try {
    console.log('🏛️ Creating customs clearances...')

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

    // Get invoices that don't have clearances yet
    const invoicesWithoutClearances = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id,
        customsClearances: {
          none: {}
        }
      },
      take: 8
    })

    console.log(`📄 Found ${invoicesWithoutClearances.length} invoices without clearances`)

    for (const invoice of invoicesWithoutClearances) {
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']
      const status = statuses[Math.floor(Math.random() * statuses.length)] as any
      
      const customsFee = Math.floor(Math.random() * 800) + 200
      const additionalFees = Math.floor(Math.random() * 200) + 50
      const totalFees = customsFee + additionalFees

      const clearanceData: any = {
        clearanceNumber: `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        invoiceId: invoice.id,
        customsBrokerId: customsBroker.userId,
        status,
        customsFee,
        additionalFees,
        totalFees,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'تخليص جمركي للشحنة'
      }

      if (status === 'COMPLETED') {
        clearanceData.actualCompletionDate = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
      }

      await prisma.customsClearance.create({
        data: clearanceData
      })

      console.log(`✅ Created clearance for invoice ${invoice.invoiceNumber}`)
    }

    // Update some invoice payment statuses to show variety
    const invoicesToUpdate = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id
      },
      take: 6
    })

    for (let i = 0; i < invoicesToUpdate.length; i++) {
      const statuses = ['PENDING', 'SENT', 'PAID']
      const newStatus = statuses[i % 3] as any
      
      await prisma.invoice.update({
        where: { id: invoicesToUpdate[i].id },
        data: { 
          paymentStatus: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null
        }
      })
    }

    console.log('💰 Updated invoice payment statuses')

    // Print final summary
    const finalStats = await prisma.customsBroker.findUnique({
      where: { id: customsBroker.id },
      include: {
        user: true,
        invoices: true
      }
    })

    const clearanceStats = await prisma.customsClearance.groupBy({
      by: ['status'],
      where: {
        customsBrokerId: customsBroker.userId
      },
      _count: {
        status: true
      }
    })

    const totalFees = await prisma.customsClearance.aggregate({
      where: {
        customsBrokerId: customsBroker.userId,
        status: 'COMPLETED'
      },
      _sum: {
        totalFees: true
      }
    })

    console.log('\n📊 Final Summary:')
    console.log(`👤 Broker: ${finalStats?.user.name}`)
    console.log(`📄 Total Invoices: ${finalStats?.invoices.length || 0}`)
    console.log(`🏛️ Clearance Stats:`)
    clearanceStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.status}`)
    })
    console.log(`💰 Total Fees Collected: ${totalFees._sum.totalFees || 0} SAR`)

    console.log('\n🎉 Clearances created successfully!')

  } catch (error) {
    console.error('❌ Error creating clearances:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createClearances()
