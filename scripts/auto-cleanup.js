const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function autoCleanup() {
  try {
    console.log('🔄 تشغيل التنظيف التلقائي...\n')

    // 1. حذف tracking logs أقدم من 3 أيام (للحفاظ على البيانات الحديثة)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const deletedTracking = await prisma.trackingLog.deleteMany({
      where: {
        timestamp: { lt: threeDaysAgo }
      }
    })

    // 2. حذف الإشعارات المقروءة أقدم من يوم واحد
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: oneDayAgo }
      }
    })

    console.log(`✅ تم حذف ${deletedTracking.count} سجل تتبع قديم`)
    console.log(`✅ تم حذف ${deletedNotifications.count} إشعار مقروء`)

    // إحصائيات سريعة
    const currentTracking = await prisma.trackingLog.count()
    const currentNotifications = await prisma.notification.count()

    console.log(`\n📊 الوضع الحالي:`)
    console.log(`📍 Tracking logs: ${currentTracking}`)
    console.log(`🔔 الإشعارات: ${currentNotifications}`)

    console.log('\n✨ تم التنظيف التلقائي بنجاح!')

  } catch (error) {
    console.error('❌ خطأ في التنظيف التلقائي:', error)
  } finally {
    await prisma.$disconnect()
  }
}

autoCleanup()
