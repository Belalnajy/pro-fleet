const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMigrationStatus() {
  try {
    console.log('🔍 فحص حالة أرقام الرحلات والفواتير...\n')

    // فحص أرقام الرحلات
    const oldTripsCount = await prisma.trip.count({
      where: {
        OR: [
          { tripNumber: { startsWith: "TWB:" } },
          { tripNumber: { startsWith: "TRP-" } },
          { tripNumber: { startsWith: "INV-" } }
        ]
      }
    })

    const newTripsCount = await prisma.trip.count({
      where: {
        tripNumber: { startsWith: "PRO-" }
      }
    })

    const sampleOldTrips = await prisma.trip.findMany({
      where: {
        OR: [
          { tripNumber: { startsWith: "TWB:" } },
          { tripNumber: { startsWith: "TRP-" } },
          { tripNumber: { startsWith: "INV-" } }
        ]
      },
      select: {
        tripNumber: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log('📊 أرقام الرحلات:')
    console.log(`   - التنسيق القديم: ${oldTripsCount}`)
    console.log(`   - التنسيق الجديد: ${newTripsCount}`)
    console.log(`   - إجمالي: ${oldTripsCount + newTripsCount}`)
    
    if (sampleOldTrips.length > 0) {
      console.log('\n📝 عينة من الرحلات بالتنسيق القديم:')
      sampleOldTrips.forEach(trip => {
        console.log(`   - ${trip.tripNumber} (${trip.createdAt.toLocaleDateString()})`)
      })
    }

    // فحص الفواتير العادية
    const oldInvoicesCount = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: "INV-" } }
    })

    const newInvoicesCount = await prisma.invoice.count({
      where: { invoiceNumber: { startsWith: "PRO-INV-" } }
    })

    const sampleOldInvoices = await prisma.invoice.findMany({
      where: { invoiceNumber: { startsWith: "INV-" } },
      select: { invoiceNumber: true, createdAt: true },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })

    console.log('\n💰 الفواتير العادية:')
    console.log(`   - التنسيق القديم: ${oldInvoicesCount}`)
    console.log(`   - التنسيق الجديد: ${newInvoicesCount}`)
    
    if (sampleOldInvoices.length > 0) {
      console.log('\n📝 عينة من الفواتير العادية بالتنسيق القديم:')
      sampleOldInvoices.forEach(invoice => {
        console.log(`   - ${invoice.invoiceNumber} (${invoice.createdAt.toLocaleDateString()})`)
      })
    }

    // فحص فواتير التخليص الجمركي
    const oldClearanceCount = await prisma.customsClearanceInvoice.count({
      where: { invoiceNumber: { startsWith: "CI-" } }
    })

    const newClearanceCount = await prisma.customsClearanceInvoice.count({
      where: { invoiceNumber: { startsWith: "PRO-CLR-" } }
    })

    const sampleOldClearance = await prisma.customsClearanceInvoice.findMany({
      where: { invoiceNumber: { startsWith: "CI-" } },
      select: { invoiceNumber: true, createdAt: true },
      take: 3,
      orderBy: { createdAt: 'desc' }
    })

    console.log('\n🏛️ فواتير التخليص الجمركي:')
    console.log(`   - التنسيق القديم: ${oldClearanceCount}`)
    console.log(`   - التنسيق الجديد: ${newClearanceCount}`)
    
    if (sampleOldClearance.length > 0) {
      console.log('\n📝 عينة من فواتير التخليص بالتنسيق القديم:')
      sampleOldClearance.forEach(invoice => {
        console.log(`   - ${invoice.invoiceNumber} (${invoice.createdAt.toLocaleDateString()})`)
      })
    }

    const totalOldRecords = oldTripsCount + oldInvoicesCount + oldClearanceCount
    const totalNewRecords = newTripsCount + newInvoicesCount + newClearanceCount

    console.log('\n📈 الملخص العام:')
    console.log(`   - إجمالي السجلات بالتنسيق القديم: ${totalOldRecords}`)
    console.log(`   - إجمالي السجلات بالتنسيق الجديد: ${totalNewRecords}`)
    console.log(`   - يحتاج ترحيل: ${totalOldRecords > 0 ? 'نعم ✅' : 'لا ❌'}`)

    if (totalOldRecords > 0) {
      console.log('\n🚀 جاهز لتشغيل سكريپتات الترحيل!')
    } else {
      console.log('\n✅ جميع الأرقام محدثة بالفعل!')
    }

  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigrationStatus()
