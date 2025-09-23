const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTripsWithoutInvoices() {
  try {
    console.log('🚛 إنشاء رحلات جديدة بدون فواتير...\n')

    // الحصول على بيانات أساسية
    const users = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      take: 3
    })

    const cities = await prisma.city.findMany({
      take: 5
    })

    const vehicleTypes = await prisma.vehicleTypeModel.findMany({
      take: 3
    })

    const temperatures = await prisma.temperatureSetting.findMany({
      take: 2
    })

    if (users.length === 0 || cities.length < 2 || vehicleTypes.length === 0) {
      console.log('❌ لا توجد بيانات أساسية كافية (عملاء، مدن، أنواع مركبات)')
      return
    }

    // إنشاء مركبات إذا لم تكن موجودة
    let vehicles = await prisma.vehicle.findMany({
      take: 3
    })

    if (vehicles.length === 0) {
      console.log('📦 إنشاء مركبات جديدة...')
      
      for (let i = 0; i < 3; i++) {
        const vehicle = await prisma.vehicle.create({
          data: {
            vehicleNumber: `V-${1000 + i}`,
            vehicleTypeId: vehicleTypes[i % vehicleTypes.length].id
          }
        })
        vehicles.push(vehicle)
      }
    }

    // إنشاء 5 رحلات جديدة بدون فواتير
    const tripsToCreate = []
    
    for (let i = 1; i <= 5; i++) {
      const user = users[i % users.length]
      const fromCity = cities[0]
      const toCity = cities[1]
      const vehicle = vehicles[i % vehicles.length]
      const temperature = temperatures[i % temperatures.length]
      
      const tripData = {
        tripNumber: `TWB:${String(1000 + i).padStart(4, '0')}`,
        customerId: user.id,
        vehicleId: vehicle.id,
        fromCityId: fromCity.id,
        toCityId: toCity.id,
        temperatureId: temperature.id,
        scheduledDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // رحلات في الأيام القادمة
        price: Math.floor(Math.random() * 2000) + 1000, // سعر عشوائي بين 1000-3000
        status: i <= 2 ? 'DELIVERED' : i <= 4 ? 'PENDING' : 'ASSIGNED', // حالات مختلفة
        notes: `رحلة تجريبية رقم ${i} - بدون فاتورة`
      }
      
      tripsToCreate.push(tripData)
    }

    // إنشاء الرحلات
    console.log('🚚 إنشاء الرحلات...')
    const createdTrips = []
    
    for (const tripData of tripsToCreate) {
      const trip = await prisma.trip.create({
        data: tripData,
        include: {
          customer: true,
          fromCity: true,
          toCity: true,
          vehicle: {
            include: {
              vehicleType: true
            }
          }
        }
      })
      createdTrips.push(trip)
    }

    console.log(`✅ تم إنشاء ${createdTrips.length} رحلة جديدة بدون فواتير:\n`)

    createdTrips.forEach((trip, index) => {
      console.log(`${index + 1}. رقم الرحلة: ${trip.tripNumber}`)
      console.log(`   العميل: ${trip.customer?.name || 'غير محدد'}`)
      console.log(`   المسار: ${trip.fromCity?.nameAr || trip.fromCity?.name} → ${trip.toCity?.nameAr || trip.toCity?.name}`)
      console.log(`   الحالة: ${trip.status}`)
      console.log(`   السعر: ${trip.price} ريال`)
      console.log(`   المركبة: ${trip.vehicle?.vehicleNumber}`)
      console.log('   ---')
    })

    // التحقق من النتيجة
    const tripsWithoutInvoices = await prisma.trip.count({
      where: {
        invoice: null
      }
    })

    console.log(`\n📊 إجمالي الرحلات بدون فواتير الآن: ${tripsWithoutInvoices}`)
    console.log('\n🎉 يمكنك الآن اختبار إنشاء الفواتير من المحاسب أو الأدمن!')

  } catch (error) {
    console.error('❌ خطأ في إنشاء الرحلات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTripsWithoutInvoices()
