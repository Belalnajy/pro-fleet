import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrentUser() {
  try {
    console.log('🔍 Checking all customs broker users...')

    // Find all customs broker users
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMS_BROKER' },
      include: {
        customsBrokerProfile: true
      }
    })

    console.log(`Found ${users.length} customs broker users:`)
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Active: ${user.isActive}`)
      
      // Find customs broker profile
      const customsBroker = await prisma.customsBroker.findUnique({
        where: { userId: user.id }
      })
      
      if (customsBroker) {
        console.log(`   - Broker ID: ${customsBroker.id}`)
        console.log(`   - License: ${customsBroker.licenseNumber}`)
        
        // Count invoices
        const invoiceCount = await prisma.invoice.count({
          where: { customsBrokerId: customsBroker.id }
        })
        
        console.log(`   - Invoices: ${invoiceCount}`)
      } else {
        console.log(`   - ❌ No customs broker profile`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentUser()
