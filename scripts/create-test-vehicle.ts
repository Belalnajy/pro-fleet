import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function createTestVehicle() {
  try {
    console.log('🚛 Creating test vehicle...')
    
    // Get first vehicle type
    const vehicleType = await db.vehicleTypeModel.findFirst({
      where: { isActive: true }
    })
    
    if (!vehicleType) {
      console.error('❌ No vehicle types found!')
      return
    }
    
    console.log('Found vehicle type:', vehicleType)
    
    // Create a test vehicle
    const vehicle = await db.vehicle.create({
      data: {
        vehicleTypeId: vehicleType.id,
        vehicleNumber: 'TEST-001',
        isActive: true
      }
    })
    
    console.log('✅ Test vehicle created:', vehicle)
    
    // List all vehicles
    const allVehicles = await db.vehicle.findMany({
      include: {
        vehicleType: true
      }
    })
    
    console.log('📋 All vehicles in database:')
    allVehicles.forEach(v => {
      console.log(`- ${v.vehicleNumber} (${v.vehicleType?.name}) - Active: ${v.isActive}`)
    })
    
  } catch (error) {
    console.error('❌ Error creating test vehicle:', error)
  } finally {
    await db.$disconnect()
  }
}

createTestVehicle()
