const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCustomsTariffs() {
  try {
    console.log('🛃 بدء إضافة التعريفات الجمركية...')

    // حذف التعريفات القديمة
    await prisma.customsTariff.deleteMany()
    console.log('🗑️ تم حذف التعريفات القديمة')

    // التعريفات الجمركية المختلفة
    const tariffs = [
      // إلكترونيات
      {
        hsCode: '8471.30',
        description: 'Portable computers and tablets',
        descriptionAr: 'أجهزة كمبيوتر محمولة وأجهزة لوحية',
        dutyRate: 0, // معفاة من الرسوم الجمركية
        vatRate: 15,
        additionalFees: 0,
        category: 'electronics'
      },
      {
        hsCode: '8517.12',
        description: 'Mobile phones and smartphones',
        descriptionAr: 'هواتف محمولة وهواتف ذكية',
        dutyRate: 0,
        vatRate: 15,
        additionalFees: 0,
        category: 'electronics'
      },
      {
        hsCode: '8528.72',
        description: 'Television sets and monitors',
        descriptionAr: 'أجهزة تلفزيون وشاشات',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'electronics'
      },

      // ملابس ومنسوجات
      {
        hsCode: '6109.10',
        description: 'T-shirts and cotton shirts',
        descriptionAr: 'قمصان قطنية وتي شيرت',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'textiles'
      },
      {
        hsCode: '6203.42',
        description: 'Men\'s trousers and pants',
        descriptionAr: 'بناطيل وسراويل رجالية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'textiles'
      },
      {
        hsCode: '6204.62',
        description: 'Women\'s dresses and skirts',
        descriptionAr: 'فساتين وتنانير نسائية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'textiles'
      },

      // مواد غذائية
      {
        hsCode: '0901.21',
        description: 'Roasted coffee',
        descriptionAr: 'قهوة محمصة',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'food'
      },
      {
        hsCode: '1704.90',
        description: 'Confectionery and sweets',
        descriptionAr: 'حلويات وسكاكر',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'food'
      },
      {
        hsCode: '1905.31',
        description: 'Biscuits and cookies',
        descriptionAr: 'بسكويت وكوكيز',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'food'
      },
      {
        hsCode: '0402.10',
        description: 'Milk powder',
        descriptionAr: 'حليب مجفف',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'food'
      },

      // أدوية ومستحضرات طبية
      {
        hsCode: '3004.90',
        description: 'Pharmaceutical products',
        descriptionAr: 'مستحضرات صيدلانية',
        dutyRate: 0, // معفاة
        vatRate: 15,
        additionalFees: 0,
        category: 'medical'
      },
      {
        hsCode: '3005.90',
        description: 'Medical supplies and bandages',
        descriptionAr: 'مستلزمات طبية وضمادات',
        dutyRate: 0,
        vatRate: 15,
        additionalFees: 0,
        category: 'medical'
      },

      // مستحضرات تجميل
      {
        hsCode: '3304.99',
        description: 'Beauty and makeup products',
        descriptionAr: 'مستحضرات تجميل ومكياج',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'cosmetics'
      },
      {
        hsCode: '3303.00',
        description: 'Perfumes and fragrances',
        descriptionAr: 'عطور ومستحضرات عطرية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'cosmetics'
      },
      {
        hsCode: '3305.10',
        description: 'Shampoo and hair products',
        descriptionAr: 'شامبو ومنتجات العناية بالشعر',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'cosmetics'
      },

      // قطع غيار سيارات
      {
        hsCode: '8708.30',
        description: 'Brake parts and systems',
        descriptionAr: 'قطع غيار فرامل',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'automotive'
      },
      {
        hsCode: '8708.40',
        description: 'Gear boxes and transmission parts',
        descriptionAr: 'علب تروس وقطع ناقل حركة',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'automotive'
      },
      {
        hsCode: '4011.10',
        description: 'Car tires',
        descriptionAr: 'إطارات سيارات',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'automotive'
      },

      // أثاث
      {
        hsCode: '9403.60',
        description: 'Wooden furniture',
        descriptionAr: 'أثاث خشبي',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'furniture'
      },
      {
        hsCode: '9403.20',
        description: 'Metal furniture',
        descriptionAr: 'أثاث معدني',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'furniture'
      },
      {
        hsCode: '9404.90',
        description: 'Mattresses and bedding',
        descriptionAr: 'مراتب ومفروشات',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'furniture'
      },

      // أجهزة منزلية
      {
        hsCode: '8418.10',
        description: 'Refrigerators and freezers',
        descriptionAr: 'ثلاجات ومجمدات',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'appliances'
      },
      {
        hsCode: '8450.11',
        description: 'Washing machines',
        descriptionAr: 'غسالات ملابس',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'appliances'
      },
      {
        hsCode: '8414.51',
        description: 'Air conditioners',
        descriptionAr: 'مكيفات هواء',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'appliances'
      },

      // مواد بناء
      {
        hsCode: '2523.29',
        description: 'Cement and concrete',
        descriptionAr: 'أسمنت وخرسانة',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'construction'
      },
      {
        hsCode: '7210.41',
        description: 'Steel and iron products',
        descriptionAr: 'منتجات حديد وصلب',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'construction'
      },
      {
        hsCode: '6907.21',
        description: 'Ceramic tiles',
        descriptionAr: 'بلاط سيراميك',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'construction'
      },

      // ألعاب وترفيه
      {
        hsCode: '9503.00',
        description: 'Toys and games',
        descriptionAr: 'ألعاب أطفال',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'toys'
      },
      {
        hsCode: '9504.50',
        description: 'Video game consoles',
        descriptionAr: 'أجهزة ألعاب فيديو',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'toys'
      },

      // كتب ومطبوعات
      {
        hsCode: '4901.99',
        description: 'Books and printed materials',
        descriptionAr: 'كتب ومطبوعات',
        dutyRate: 0, // معفاة
        vatRate: 15,
        additionalFees: 0,
        category: 'books'
      },

      // معدات رياضية
      {
        hsCode: '9506.91',
        description: 'Sports equipment',
        descriptionAr: 'معدات رياضية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'sports'
      },
      {
        hsCode: '9506.31',
        description: 'Golf equipment',
        descriptionAr: 'معدات جولف',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'sports'
      },

      // مجوهرات وساعات
      {
        hsCode: '7113.11',
        description: 'Silver jewelry',
        descriptionAr: 'مجوهرات فضية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'jewelry'
      },
      {
        hsCode: '7113.19',
        description: 'Gold jewelry',
        descriptionAr: 'مجوهرات ذهبية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'jewelry'
      },
      {
        hsCode: '9101.11',
        description: 'Wrist watches',
        descriptionAr: 'ساعات يد',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'jewelry'
      },

      // أحذية وحقائب
      {
        hsCode: '6403.99',
        description: 'Leather shoes',
        descriptionAr: 'أحذية جلدية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'footwear'
      },
      {
        hsCode: '6404.19',
        description: 'Sports shoes',
        descriptionAr: 'أحذية رياضية',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'footwear'
      },
      {
        hsCode: '4202.21',
        description: 'Handbags and purses',
        descriptionAr: 'حقائب يد ومحافظ',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'accessories'
      },

      // معدات مكتبية
      {
        hsCode: '8443.31',
        description: 'Printers and scanners',
        descriptionAr: 'طابعات وماسحات ضوئية',
        dutyRate: 0,
        vatRate: 15,
        additionalFees: 0,
        category: 'office'
      },
      {
        hsCode: '9403.10',
        description: 'Office furniture',
        descriptionAr: 'أثاث مكتبي',
        dutyRate: 5,
        vatRate: 15,
        additionalFees: 0,
        category: 'office'
      },

      // آلات ومعدات صناعية
      {
        hsCode: '8422.30',
        description: 'Industrial packaging machines',
        descriptionAr: 'آلات تعبئة وتغليف صناعية',
        dutyRate: 0,
        vatRate: 15,
        additionalFees: 0,
        category: 'industrial'
      },
      {
        hsCode: '8424.81',
        description: 'Agricultural machinery',
        descriptionAr: 'آلات زراعية',
        dutyRate: 0,
        vatRate: 15,
        additionalFees: 0,
        category: 'industrial'
      },

      // منتجات خاصة برسوم عالية
      {
        hsCode: '2402.20',
        description: 'Cigarettes containing tobacco',
        descriptionAr: 'سجائر تحتوي على تبغ',
        dutyRate: 100, // رسوم عالية
        vatRate: 15,
        additionalFees: 50, // رسوم إضافية
        category: 'tobacco'
      },
      {
        hsCode: '2203.00',
        description: 'Beer (non-alcoholic)',
        descriptionAr: 'مشروبات شعير (غير كحولية)',
        dutyRate: 50,
        vatRate: 15,
        additionalFees: 25,
        category: 'beverages'
      }
    ]

    // إدخال التعريفات في قاعدة البيانات
    let createdCount = 0
    for (const tariff of tariffs) {
      try {
        await prisma.customsTariff.create({
          data: tariff
        })
        createdCount++
        console.log(`✅ تم إضافة: ${tariff.hsCode} - ${tariff.descriptionAr}`)
      } catch (error) {
        console.log(`⚠️ تخطي ${tariff.hsCode} - قد يكون موجوداً بالفعل`)
      }
    }

    console.log(`\n🎉 تم إنشاء ${createdCount} تعريفة جمركية بنجاح!`)

    // عرض إحصائيات
    const stats = await prisma.customsTariff.groupBy({
      by: ['category'],
      _count: true
    })

    console.log('\n📊 إحصائيات التعريفات حسب الفئة:')
    stats.forEach(stat => {
      const categoryNames = {
        electronics: 'إلكترونيات',
        textiles: 'ملابس ومنسوجات',
        food: 'مواد غذائية',
        medical: 'أدوية ومستحضرات طبية',
        cosmetics: 'مستحضرات تجميل',
        automotive: 'قطع غيار سيارات',
        furniture: 'أثاث',
        appliances: 'أجهزة منزلية',
        construction: 'مواد بناء',
        toys: 'ألعاب',
        books: 'كتب',
        sports: 'معدات رياضية',
        jewelry: 'مجوهرات',
        footwear: 'أحذية',
        accessories: 'إكسسوارات',
        office: 'معدات مكتبية',
        industrial: 'معدات صناعية',
        tobacco: 'تبغ',
        beverages: 'مشروبات',
        other: 'أخرى'
      }
      console.log(`  - ${categoryNames[stat.category] || stat.category}: ${stat._count} تعريفة`)
    })

    // عرض أمثلة على التعريفات المختلفة
    console.log('\n📋 أمثلة على التعريفات:')
    console.log('  🆓 معفاة من الرسوم:')
    const exempted = await prisma.customsTariff.findMany({
      where: { dutyRate: 0 },
      take: 3
    })
    exempted.forEach(t => {
      console.log(`    - ${t.descriptionAr} (${t.hsCode})`)
    })

    console.log('  💰 رسوم عادية (5%):')
    const normal = await prisma.customsTariff.findMany({
      where: { dutyRate: 5 },
      take: 3
    })
    normal.forEach(t => {
      console.log(`    - ${t.descriptionAr} (${t.hsCode})`)
    })

    console.log('  ⚠️ رسوم عالية:')
    const high = await prisma.customsTariff.findMany({
      where: { dutyRate: { gt: 10 } },
      take: 3
    })
    high.forEach(t => {
      console.log(`    - ${t.descriptionAr} (${t.hsCode}) - ${t.dutyRate}%`)
    })

  } catch (error) {
    console.error('❌ خطأ في إنشاء التعريفات الجمركية:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
seedCustomsTariffs()
  .then(() => {
    console.log('\n✨ انتهت عملية إنشاء التعريفات الجمركية بنجاح!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 فشلت عملية إنشاء التعريفات الجمركية:', error)
    process.exit(1)
  })
