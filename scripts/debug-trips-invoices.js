const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugTripsAndInvoices() {
  try {
    console.log('🔍 تشخيص مشكلة الرحلات والفواتير...\n')

    // 1. عدد الرحلات الإجمالي
    const totalTrips = await prisma.trip.count()
    console.log(`📊 إجمالي الرحلات: ${totalTrips}`)

    // 2. الرحلات حسب الحالة
    const tripsByStatus = await prisma.trip.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })
    
    console.log('\n📈 الرحلات حسب الحالة:')
    tripsByStatus.forEach(status => {
      console.log(`  - ${status.status}: ${status._count.id} رحلة`)
    })

    // 3. الرحلات التي لها فواتير
    const tripsWithInvoices = await prisma.trip.count({
      where: {
        invoice: {
          isNot: null
        }
      }
    })
    console.log(`\n💰 الرحلات التي لها فواتير: ${tripsWithInvoices}`)

    // 4. الرحلات بدون فواتير
    const tripsWithoutInvoices = await prisma.trip.count({
      where: {
        invoice: null
      }
    })
    console.log(`📝 الرحلات بدون فواتير: ${tripsWithoutInvoices}`)

    // 5. الرحلات بدون فواتير مع التفاصيل
    const tripsWithoutInvoicesDetails = await prisma.trip.findMany({
      where: {
        invoice: null
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        fromCity: {
          select: {
            name: true,
            nameAr: true
          }
        },
        toCity: {
          select: {
            name: true,
            nameAr: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    console.log('\n📋 آخر 10 رحلات بدون فواتير:')
    tripsWithoutInvoicesDetails.forEach((trip, index) => {
      console.log(`${index + 1}. رقم الرحلة: ${trip.tripNumber}`)
      console.log(`   العميل: ${trip.customer?.name || 'غير محدد'}`)
      console.log(`   المسار: ${trip.fromCity?.nameAr || trip.fromCity?.name} → ${trip.toCity?.nameAr || trip.toCity?.name}`)
      console.log(`   الحالة: ${trip.status}`)
      console.log(`   السعر: ${trip.price} ريال`)
      console.log(`   تاريخ الإنشاء: ${trip.createdAt.toLocaleDateString('ar-SA')}`)
      console.log('   ---')
    })

    // 6. إجمالي الفواتير
    const totalInvoices = await prisma.invoice.count()
    console.log(`\n💳 إجمالي الفواتير: ${totalInvoices}`)

    // 7. الفواتير حسب الحالة
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['paymentStatus'],
      _count: {
        id: true
      }
    })
    
    console.log('\n💰 الفواتير حسب حالة الدفع:')
    invoicesByStatus.forEach(status => {
      console.log(`  - ${status.paymentStatus}: ${status._count.id} فاتورة`)
    })

    // 8. التحقق من العلاقة بين الرحلات والفواتير
    const invoicesWithTrips = await prisma.invoice.findMany({
      include: {
        trip: {
          select: {
            id: true,
            tripNumber: true,
            status: true
          }
        }
      },
      take: 5
    })

    console.log('\n🔗 عينة من الفواتير مع الرحلات المرتبطة:')
    invoicesWithTrips.forEach((invoice, index) => {
      console.log(`${index + 1}. فاتورة: ${invoice.invoiceNumber}`)
      console.log(`   رحلة: ${invoice.trip?.tripNumber || 'غير مرتبطة'}`)
      console.log(`   حالة الرحلة: ${invoice.trip?.status || 'غير محددة'}`)
      console.log(`   المبلغ: ${invoice.total} ريال`)
      console.log('   ---')
    })

    console.log('\n✅ انتهى التشخيص')

  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTripsAndInvoices()
