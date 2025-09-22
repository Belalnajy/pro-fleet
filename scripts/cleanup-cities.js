const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// البيانات الجديدة النظيفة للمدن السعودية
const cleanCitiesData = [
  {
    name: "Riyadh",
    nameAr: "الرياض",
    country: "Saudi Arabia",
    latitude: 24.7136,
    longitude: 46.6753,
    isActive: true
  },
  {
    name: "Jeddah", 
    nameAr: "جدة",
    country: "Saudi Arabia",
    latitude: 21.4858,
    longitude: 39.1925,
    isActive: true
  },
  {
    name: "Dammam",
    nameAr: "الدمام", 
    country: "Saudi Arabia",
    latitude: 26.4207,
    longitude: 50.0888,
    isActive: true
  },
  {
    name: "Mecca",
    nameAr: "مكة المكرمة",
    country: "Saudi Arabia", 
    latitude: 21.3891,
    longitude: 39.8579,
    isActive: true
  },
  {
    name: "Medina",
    nameAr: "المدينة المنورة",
    country: "Saudi Arabia",
    latitude: 24.5247,
    longitude: 39.5692,
    isActive: true
  },
  {
    name: "Khobar",
    nameAr: "الخبر",
    country: "Saudi Arabia",
    latitude: 26.2172,
    longitude: 50.1971,
    isActive: true
  },
  {
    name: "Taif",
    nameAr: "الطائف",
    country: "Saudi Arabia",
    latitude: 21.2703,
    longitude: 40.4158,
    isActive: true
  },
  {
    name: "Tabuk",
    nameAr: "تبوك",
    country: "Saudi Arabia",
    latitude: 28.3998,
    longitude: 36.5700,
    isActive: true
  },
  {
    name: "Buraidah",
    nameAr: "بريدة",
    country: "Saudi Arabia",
    latitude: 26.3260,
    longitude: 43.9750,
    isActive: true
  },
  {
    name: "Khamis Mushait",
    nameAr: "خميس مشيط",
    country: "Saudi Arabia",
    latitude: 18.3000,
    longitude: 42.7333,
    isActive: true
  },
  {
    name: "Hail",
    nameAr: "حائل",
    country: "Saudi Arabia",
    latitude: 27.5114,
    longitude: 41.7208,
    isActive: true
  },
  {
    name: "Hofuf",
    nameAr: "الهفوف",
    country: "Saudi Arabia",
    latitude: 25.3647,
    longitude: 49.5747,
    isActive: true
  },
  {
    name: "Jubail",
    nameAr: "الجبيل",
    country: "Saudi Arabia",
    latitude: 27.0174,
    longitude: 49.6583,
    isActive: true
  },
  {
    name: "Yanbu",
    nameAr: "ينبع",
    country: "Saudi Arabia",
    latitude: 24.0896,
    longitude: 38.0618,
    isActive: true
  },
  {
    name: "Abha",
    nameAr: "أبها",
    country: "Saudi Arabia",
    latitude: 18.2164,
    longitude: 42.5053,
    isActive: true
  }
]

async function cleanupAndSeedCities() {
  try {
    console.log('🧹 بدء عملية تنظيف البيانات...')

    // 1. حذف سجلات التتبع (tracking logs) أولاً - لأنها تعتمد على الرحلات
    console.log('🗑️ حذف سجلات التتبع...')
    const deletedTrackingLogs = await prisma.trackingLog.deleteMany({})
    console.log(`✅ تم حذف ${deletedTrackingLogs.count} سجل تتبع`)

    // 2. حذف التخليص الجمركي (customs clearances) - مرتبط بالفواتير
    console.log('🗑️ حذف التخليص الجمركي...')
    try {
      const deletedCustoms = await prisma.customsClearance.deleteMany({})
      console.log(`✅ تم حذف ${deletedCustoms.count} تخليص جمركي`)
    } catch (error) {
      console.log('⚠️ لا يوجد جدول تخليص جمركي أو فارغ')
    }

    // 3. حذف الفواتير (invoices) - بعد حذف التخليص الجمركي
    console.log('🗑️ حذف الفواتير...')
    const deletedInvoices = await prisma.invoice.deleteMany({})
    console.log(`✅ تم حذف ${deletedInvoices.count} فاتورة`)

    // 4. حذف الرحلات (trips) - بعد حذف ما يعتمد عليها
    console.log('🗑️ حذف الرحلات...')
    const deletedTrips = await prisma.trip.deleteMany({})
    console.log(`✅ تم حذف ${deletedTrips.count} رحلة`)

    // 5. حذف التسعير (pricing) - لأنه يعتمد على المدن
    console.log('🗑️ حذف التسعير...')
    const deletedPricing = await prisma.pricing.deleteMany({})
    console.log(`✅ تم حذف ${deletedPricing.count} سعر`)

    // 6. حذف العناوين المحفوظة (saved addresses) - مرتبطة بالمدن
    console.log('🗑️ حذف العناوين المحفوظة...')
    const deletedAddresses = await prisma.savedAddress.deleteMany({})
    console.log(`✅ تم حذف ${deletedAddresses.count} عنوان محفوظ`)

    // 7. أخيراً حذف المدن
    console.log('🗑️ حذف المدن القديمة...')
    const deletedCities = await prisma.city.deleteMany({})
    console.log(`✅ تم حذف ${deletedCities.count} مدينة`)

    // 8. إضافة المدن الجديدة النظيفة
    console.log('🏙️ إضافة المدن الجديدة...')
    for (const cityData of cleanCitiesData) {
      await prisma.city.create({
        data: cityData
      })
      console.log(`✅ تمت إضافة مدينة: ${cityData.nameAr} (${cityData.name})`)
    }

    console.log('🎉 تم تنظيف وإعادة إنشاء البيانات بنجاح!')
    console.log(`📊 إجمالي المدن الجديدة: ${cleanCitiesData.length}`)

  } catch (error) {
    console.error('❌ خطأ في عملية التنظيف:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
cleanupAndSeedCities()
  .then(() => {
    console.log('✨ انتهت عملية التنظيف بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشلت عملية التنظيف:', error)
    process.exit(1)
  })
