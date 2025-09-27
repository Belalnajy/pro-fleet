const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function analyzeDatabase() {
  try {
    console.log('🔍 تحليل حجم البيانات في قاعدة البيانات...\n')

    // تحليل الجداول الكبيرة
    const trackingLogs = await prisma.trackingLog.count()
    const notifications = await prisma.notification.count()
    const trips = await prisma.trip.count()
    const invoices = await prisma.invoice.count()
    const payments = await prisma.payment.count()
    const users = await prisma.user.count()

    console.log('📊 إحصائيات الجداول:')
    console.log(`📍 Tracking Logs: ${trackingLogs.toLocaleString()} سجل`)
    console.log(`🔔 Notifications: ${notifications.toLocaleString()} إشعار`)
    console.log(`🚛 Trips: ${trips.toLocaleString()} رحلة`)
    console.log(`📄 Invoices: ${invoices.toLocaleString()} فاتورة`)
    console.log(`💰 Payments: ${payments.toLocaleString()} دفعة`)
    console.log(`👥 Users: ${users.toLocaleString()} مستخدم\n`)

    // تحليل الإشعارات القديمة المقروءة
    const readNotifications = await prisma.notification.count({
      where: { isRead: true }
    })

    // تحليل tracking logs أقدم من شهر
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const oldTrackingLogs = await prisma.trackingLog.count({
      where: {
        timestamp: { lt: oneMonthAgo }
      }
    })

    console.log('🧹 البيانات القابلة للحذف:')
    console.log(`📖 الإشعارات المقروءة: ${readNotifications.toLocaleString()}`)
    console.log(`📍 Tracking logs أقدم من شهر: ${oldTrackingLogs.toLocaleString()}\n`)

    // تحليل الرحلات المكتملة القديمة
    const oldCompletedTrips = await prisma.trip.count({
      where: {
        status: { in: ['DELIVERED', 'CANCELLED'] },
        updatedAt: { lt: oneMonthAgo }
      }
    })

    console.log(`🚛 الرحلات المكتملة القديمة: ${oldCompletedTrips.toLocaleString()}`)

  } catch (error) {
    console.error('❌ خطأ في تحليل قاعدة البيانات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanupDatabase() {
  try {
    console.log('🧹 بدء تنظيف قاعدة البيانات...\n')

    // 1. حذف الإشعارات المقروءة الأقدم من أسبوعين
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: twoWeeksAgo }
      }
    })

    console.log(`✅ تم حذف ${deletedNotifications.count} إشعار مقروء قديم`)

    // 2. حذف tracking logs الأقدم من شهر
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const deletedTrackingLogs = await prisma.trackingLog.deleteMany({
      where: {
        timestamp: { lt: oneMonthAgo }
      }
    })

    console.log(`✅ تم حذف ${deletedTrackingLogs.count} سجل تتبع قديم`)

    // 3. تنظيف البيانات المؤقتة (إن وجدت)
    // يمكن إضافة المزيد حسب الحاجة

    console.log('\n🎉 تم تنظيف قاعدة البيانات بنجاح!')
    
    // إعادة تحليل بعد التنظيف
    console.log('\n📊 إعادة تحليل بعد التنظيف:')
    await analyzeDatabase()

  } catch (error) {
    console.error('❌ خطأ في تنظيف قاعدة البيانات:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل التحليل أولاً
if (process.argv.includes('--analyze')) {
  analyzeDatabase()
} else if (process.argv.includes('--clean')) {
  cleanupDatabase()
} else {
  console.log('استخدم:')
  console.log('node cleanup-database.js --analyze  # لتحليل البيانات')
  console.log('node cleanup-database.js --clean    # لتنظيف البيانات')
}
