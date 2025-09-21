import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkInvoicesToBroker() {
  try {
    console.log('🔗 Linking invoices to customs broker...')

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

    console.log(`✅ Found customs broker: ${customsBroker.id}`)

    // Get all invoices without a customs broker
    const invoicesWithoutBroker = await prisma.invoice.findMany({
      where: {
        customsBrokerId: null
      },
      include: {
        trip: {
          include: {
            customer: true
          }
        }
      }
    })

    console.log(`📄 Found ${invoicesWithoutBroker.length} invoices without customs broker`)

    // Link first 15 invoices to our customs broker
    const invoicesToLink = invoicesWithoutBroker.slice(0, 15)

    for (const invoice of invoicesToLink) {
      // Add some customs fee if not present
      const customsFee = invoice.customsFee > 0 ? invoice.customsFee : Math.floor(Math.random() * 500) + 100

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          customsBrokerId: customsBroker.id,
          customsFee: customsFee
        }
      })

      console.log(`🔗 Linked invoice ${invoice.invoiceNumber} to customs broker`)
    }

    // Now create some clearances for these invoices
    const linkedInvoices = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id
      },
      take: 10
    })

    console.log(`📋 Creating clearances for ${linkedInvoices.length} invoices`)

    for (const invoice of linkedInvoices) {
      // Check if clearance already exists
      const existingClearance = await prisma.customsClearance.findFirst({
        where: { invoiceId: invoice.id }
      })

      if (!existingClearance) {
        const statuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'COMPLETED', 'REJECTED']
        const status = statuses[Math.floor(Math.random() * statuses.length)] as any
        
        const customsFee = Math.floor(Math.random() * 800) + 200
        const additionalFees = Math.floor(Math.random() * 200) + 50
        const totalFees = customsFee + additionalFees

        const clearanceData: any = {
          clearanceNumber: `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceId: invoice.id,
          customsBrokerId: customsBroker.userId, // This should be the user ID, not the broker profile ID
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

        console.log(`🏛️ Created clearance for invoice ${invoice.invoiceNumber}`)
      }
    }

    // Update some invoice payment statuses
    const invoicesToUpdate = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id
      }
    })

    for (let i = 0; i < invoicesToUpdate.length; i++) {
      const statuses = ['PENDING', 'SENT', 'PAID', 'PAID', 'PENDING'] // More paid invoices
      const newStatus = statuses[i % statuses.length] as any
      
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

    const invoiceStats = await prisma.invoice.groupBy({
      by: ['paymentStatus'],
      where: {
        customsBrokerId: customsBroker.id
      },
      _count: {
        paymentStatus: true
      }
    })

    console.log('\n📊 Final Summary:')
    console.log(`👤 Broker: ${finalStats?.user.name}`)
    console.log(`📄 Total Invoices: ${finalStats?.invoices.length || 0}`)
    console.log(`💰 Invoice Status:`)
    invoiceStats.forEach(stat => {
      console.log(`   - ${stat.paymentStatus}: ${stat._count.paymentStatus}`)
    })
    console.log(`🏛️ Clearance Stats:`)
    clearanceStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.status}`)
    })
    console.log(`💰 Total Clearance Fees: ${totalFees._sum.totalFees || 0} SAR`)

    console.log('\n🎉 Invoices linked successfully!')

  } catch (error) {
    console.error('❌ Error linking invoices:', error)
  } finally {
    await prisma.$disconnect()
  }
}

linkInvoicesToBroker()
