import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedCustomsBroker() {
  try {
    console.log('🌱 Seeding customs broker data...')

    // Create customs broker user if not exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'broker@profleet.sa' }
    })

    let customsBrokerUser
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      customsBrokerUser = await prisma.user.create({
        data: {
          email: 'broker@profleet.sa',
          name: 'أحمد المخلص الجمركي',
          phone: '+966501234567',
          password: hashedPassword,
          role: 'CUSTOMS_BROKER',
          isActive: true,
        }
      })
      console.log('✅ Created customs broker user')
    } else {
      customsBrokerUser = existingUser
      console.log('✅ Found existing customs broker user')
    }

    // Create customs broker profile if not exists
    let customsBroker = await prisma.customsBroker.findUnique({
      where: { userId: customsBrokerUser.id }
    })

    if (!customsBroker) {
      customsBroker = await prisma.customsBroker.create({
        data: {
          userId: customsBrokerUser.id,
          licenseNumber: 'CB-2024-001',
        }
      })
      console.log('✅ Created customs broker profile')
    }

    // Get some existing trips to create invoices for
    const trips = await prisma.trip.findMany({
      where: {
        status: 'DELIVERED'
      },
      take: 10,
      include: {
        customer: true
      }
    })

    console.log(`📦 Found ${trips.length} delivered trips`)

    // Create invoices for these trips if they don't exist
    for (const trip of trips) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { tripId: trip.id }
      })

      if (!existingInvoice) {
        const subtotal = trip.price || 1000
        const taxAmount = subtotal * 0.15
        const customsFee = Math.floor(Math.random() * 500) + 100 // Random fee between 100-600
        const total = subtotal + taxAmount + customsFee

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${trip.tripNumber}`,
            tripId: trip.id,
            customsBrokerId: customsBroker.id,
            customsFee,
            taxRate: 0.15,
            taxAmount,
            subtotal,
            total,
            currency: 'SAR',
            paymentStatus: ['PENDING', 'SENT', 'PAID'][Math.floor(Math.random() * 3)] as any,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          }
        })
        
        console.log(`📄 Created invoice for trip ${trip.tripNumber}`)
      }
    }

    // Create some customs clearances
    const invoices = await prisma.invoice.findMany({
      where: {
        customsBrokerId: customsBroker.id
      },
      take: 8
    })

    for (const invoice of invoices) {
      const existingClearance = await prisma.customsClearance.findFirst({
        where: { invoiceId: invoice.id }
      })

      if (!existingClearance) {
        const status = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'][Math.floor(Math.random() * 4)] as any
        const customsFee = Math.floor(Math.random() * 800) + 200
        const additionalFees = Math.floor(Math.random() * 200) + 50
        const totalFees = customsFee + additionalFees

        const clearanceData: any = {
          clearanceNumber: `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceId: invoice.id,
          customsBrokerId: customsBrokerUser.id,
          status,
          customsFee,
          additionalFees,
          totalFees,
          estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          notes: 'تخليص جمركي للشحنة'
        }

        if (status === 'COMPLETED') {
          clearanceData.actualCompletionDate = new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
        }

        await prisma.customsClearance.create({
          data: clearanceData
        })
        console.log(`🏛️ Created customs clearance for invoice ${invoice.invoiceNumber}`)
      }
    }

    // Create some customs documents
    const clearances = await prisma.customsClearance.findMany({
      where: {
        customsBrokerId: customsBrokerUser.id
      },
      take: 5
    })

    for (const clearance of clearances) {
      const documentTypes = ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_DECLARATION']
      
      for (let i = 0; i < 3; i++) {
        const existingDoc = await prisma.customsDocument.findFirst({
          where: {
            clearanceId: clearance.id,
            documentType: documentTypes[i] as any
          }
        })

        if (!existingDoc) {
          await prisma.customsDocument.create({
            data: {
              clearanceId: clearance.id,
              documentType: documentTypes[i] as any,
              documentName: `${documentTypes[i]}_${clearance.clearanceNumber}.pdf`,
              filePath: `/uploads/customs/${clearance.clearanceNumber}/${documentTypes[i]}.pdf`,
              fileSize: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
              mimeType: 'application/pdf',
              status: ['PENDING', 'APPROVED', 'REJECTED'][Math.floor(Math.random() * 3)] as any,
              notes: 'مستند مرفوع للتخليص الجمركي'
            }
          })
        }
      }
      console.log(`📋 Created documents for clearance ${clearance.clearanceNumber}`)
    }

    console.log('🎉 Customs broker seeding completed successfully!')

    // Print summary
    const summary = await prisma.customsBroker.findUnique({
      where: { id: customsBroker.id },
      include: {
        user: true,
        invoices: true,
        _count: {
          select: {
            invoices: true
          }
        }
      }
    })

    const clearanceStats = await prisma.customsClearance.groupBy({
      by: ['status'],
      where: {
        customsBrokerId: customsBrokerUser.id
      },
      _count: {
        status: true
      }
    })

    const totalFees = await prisma.customsClearance.aggregate({
      where: {
        customsBrokerId: customsBrokerUser.id,
        status: 'COMPLETED'
      },
      _sum: {
        totalFees: true
      }
    })

    console.log('\n📊 Summary:')
    console.log(`👤 Broker: ${summary?.user.name} (${summary?.user.email})`)
    console.log(`📄 Total Invoices: ${summary?._count.invoices || 0}`)
    console.log(`🏛️ Clearance Stats:`)
    clearanceStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat._count.status}`)
    })
    console.log(`💰 Total Fees Collected: ${totalFees._sum.totalFees || 0} SAR`)

  } catch (error) {
    console.error('❌ Error seeding customs broker data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCustomsBroker()
