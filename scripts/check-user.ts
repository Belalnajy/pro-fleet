import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    console.log('🔍 Checking broker user...')

    // Find the broker user
    const user = await prisma.user.findUnique({
      where: { email: 'broker@profleet.sa' }
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('✅ User found:')
    console.log('  - ID:', user.id)
    console.log('  - Email:', user.email)
    console.log('  - Name:', user.name)
    console.log('  - Role:', user.role)
    console.log('  - Active:', user.isActive)

    // Find customs broker profile
    const customsBroker = await prisma.customsBroker.findUnique({
      where: { userId: user.id }
    })
    
    if (customsBroker) {
      console.log('✅ Customs Broker profile found:')
      console.log('  - Broker ID:', customsBroker.id)
      console.log('  - License:', customsBroker.licenseNumber)
    } else {
      console.log('❌ No customs broker profile found!')
    }

    // Check invoices
    const invoices = await prisma.invoice.findMany({
      where: { customsBrokerId: customsBroker?.id }
    })

    console.log(`📄 Found ${invoices.length} invoices for this broker`)

    // Check clearances
    const clearances = await prisma.customsClearance.findMany({
      where: { customsBrokerId: user.id }
    })

    console.log(`🏛️ Found ${clearances.length} clearances for this broker`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
