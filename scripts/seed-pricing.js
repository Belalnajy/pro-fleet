const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBasicPricing() {
  try {
    console.log('💰 بدء إضافة التسعير الأساسي...')

    // الحصول على المدن والمركبات
    const cities = await prisma.city.findMany({
      where: { isActive: true }
    })

    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: { vehicleType: true }
    })

    if (cities.length === 0) {
      console.log('❌ لا توجد مدن في النظام. يرجى تشغيل cleanup-cities.js أولاً')
      return
    }

    if (vehicles.length === 0) {
      console.log('❌ لا توجد مركبات في النظام. يرجى إضافة مركبات أولاً')
      return
    }

    console.log(`📍 تم العثور على ${cities.length} مدينة`)
    console.log(`🚛 تم العثور على ${vehicles.length} مركبة`)

    // إنشاء تسعير أساسي بين المدن الرئيسية
    const mainCities = cities.filter(city => 
      ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'].includes(city.name)
    )

    let pricingCount = 0

    for (const fromCity of mainCities) {
      for (const toCity of mainCities) {
        if (fromCity.id !== toCity.id) {
          for (const vehicle of vehicles) {
            // حساب المسافة التقريبية (مبسط)
            const distance = calculateDistance(
              fromCity.latitude, fromCity.longitude,
              toCity.latitude, toCity.longitude
            )

            // حساب السعر بناءً على المسافة ونوع المركبة
            let basePrice = distance * 2 // 2 ريال لكل كيلومتر
            
            // تعديل السعر حسب نوع المركبة
            if (vehicle.vehicleType?.name?.includes('Large') || vehicle.capacity?.includes('طن')) {
              basePrice *= 1.5 // زيادة 50% للمركبات الكبيرة
            }

            const finalPrice = Math.round(basePrice)

            await prisma.pricing.create({
              data: {
                fromCityId: fromCity.id,
                toCityId: toCity.id,
                vehicleId: vehicle.id,
                quantity: 1,
                price: finalPrice,
                currency: 'SAR'
              }
            })

            pricingCount++
            console.log(`✅ تسعير: ${fromCity.nameAr} → ${toCity.nameAr} (${vehicle.vehicleType?.name || 'مركبة'}) = ${finalPrice} ريال`)
          }
        }
      }
    }

    console.log(`🎉 تم إنشاء ${pricingCount} سعر أساسي بنجاح!`)

  } catch (error) {
    console.error('❌ خطأ في إنشاء التسعير:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// دالة حساب المسافة بين نقطتين (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // نصف قطر الأرض بالكيلومتر
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return Math.round(distance)
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

// تشغيل السكريبت
seedBasicPricing()
  .then(() => {
    console.log('✨ انتهت عملية إنشاء التسعير بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشلت عملية إنشاء التسعير:', error)
    process.exit(1)
  })
