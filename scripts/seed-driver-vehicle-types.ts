import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting to seed driver-vehicle-type relationships...')

  try {
    // Get all drivers and vehicle types
    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    })

    const vehicleTypes = await prisma.vehicleTypeModel.findMany()

    console.log(`Found ${drivers.length} drivers and ${vehicleTypes.length} vehicle types`)

    if (drivers.length === 0) {
      console.log('❌ No drivers found. Please create some drivers first.')
      return
    }

    if (vehicleTypes.length === 0) {
      console.log('❌ No vehicle types found. Please create some vehicle types first.')
      return
    }

    // Clear existing relationships
    await prisma.driverVehicleType.deleteMany()
    console.log('🧹 Cleared existing driver-vehicle-type relationships')

    let relationshipsCreated = 0

    // Assign vehicle types to drivers
    for (const driver of drivers) {
      // Each driver can operate 1-3 random vehicle types
      const numVehicleTypes = Math.floor(Math.random() * 3) + 1
      const shuffledVehicleTypes = vehicleTypes.sort(() => 0.5 - Math.random())
      const assignedVehicleTypes = shuffledVehicleTypes.slice(0, numVehicleTypes)

      for (const vehicleType of assignedVehicleTypes) {
        try {
          await prisma.driverVehicleType.create({
            data: {
              driverId: driver.id,
              vehicleTypeId: vehicleType.id
            }
          })
          relationshipsCreated++
          console.log(`✅ Assigned ${vehicleType.name} to ${driver.user.name}`)
        } catch (error) {
          console.log(`⚠️ Skipped duplicate assignment: ${vehicleType.name} to ${driver.user.name}`)
        }
      }
    }

    console.log(`🎉 Successfully created ${relationshipsCreated} driver-vehicle-type relationships`)

    // Show summary
    const summary = await prisma.driver.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        },
        vehicleTypes: {
          include: {
            vehicleType: {
              select: {
                name: true,
                nameAr: true
              }
            }
          }
        }
      }
    })

    console.log('\n📊 Summary of driver assignments:')
    summary.forEach(driver => {
      const vehicleTypeNames = driver.vehicleTypes.map(vt => vt.vehicleType.nameAr || vt.vehicleType.name).join(', ')
      console.log(`👨‍💼 ${driver.user.name}: ${vehicleTypeNames || 'No vehicle types assigned'}`)
    })

  } catch (error) {
    console.error('❌ Error seeding driver-vehicle-type relationships:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
