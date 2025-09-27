const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function emergencyCleanup() {
  try {
    console.log('🚨 بدء التنظيف الطارئ لتوفير مساحة...\n')

    let totalDeleted = 0

    // 1. حذف جميع tracking logs الأقدم من أسبوعين (الأكثر استهلاكاً للمساحة)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    console.log('📍 حذف tracking logs القديمة...')
    const deletedTracking = await prisma.trackingLog.deleteMany({
      where: {
        timestamp: { lt: twoWeeksAgo }
      }
    })
    console.log(`✅ تم حذف ${deletedTracking.count} سجل تتبع`)
    totalDeleted += deletedTracking.count

    // 2. حذف جميع الإشعارات المقروءة
    console.log('🔔 حذف الإشعارات المقروءة...')
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { isRead: true }
    })
    console.log(`✅ تم حذف ${deletedNotifications.count} إشعار مقروء`)
    totalDeleted += deletedNotifications.count

    // 3. حذف الإشعارات غير المقروءة الأقدم من شهر
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    console.log('🔔 حذف الإشعارات القديمة غير المقروءة...')
    const deletedOldNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: false,
        createdAt: { lt: oneMonthAgo }
      }
    })
    console.log(`✅ تم حذف ${deletedOldNotifications.count} إشعار قديم`)
    totalDeleted += deletedOldNotifications.count

    // 4. تنظيف sessions منتهية الصلاحية
    console.log('🔐 حذف الجلسات المنتهية...')
    try {
      const deletedSessions = await prisma.session.deleteMany({
        where: {
          expires: { lt: new Date() }
        }
      })
      console.log(`✅ تم حذف ${deletedSessions.count} جلسة منتهية`)
      totalDeleted += deletedSessions.count
    } catch (error) {
      console.log('⚠️ لا توجد جلسات للحذف أو خطأ في الوصول')
    }

    // 5. تنظيف verification tokens القديمة
    console.log('🎫 حذف رموز التحقق القديمة...')
    try {
      const deletedTokens = await prisma.verificationToken.deleteMany({
        where: {
          expires: { lt: new Date() }
        }
      })
      console.log(`✅ تم حذف ${deletedTokens.count} رمز تحقق منتهي`)
      totalDeleted += deletedTokens.count
    } catch (error) {
      console.log('⚠️ لا توجد رموز تحقق للحذف أو خطأ في الوصول')
    }

    // 6. إحصائيات نهائية
    console.log('\n📊 إحصائيات التنظيف:')
    console.log(`🗑️ إجمالي السجلات المحذوفة: ${totalDeleted.toLocaleString()}`)
    
    // تحليل الوضع الحالي
    const currentTracking = await prisma.trackingLog.count()
    const currentNotifications = await prisma.notification.count()
    
    console.log('\n📈 الوضع الحالي بعد التنظيف:')
    console.log(`📍 Tracking logs المتبقية: ${currentTracking.toLocaleString()}`)
    console.log(`🔔 الإشعارات المتبقية: ${currentNotifications.toLocaleString()}`)

    console.log('\n🎉 تم التنظيف الطارئ بنجاح!')
    console.log('💡 نصيحة: شغل هذا السكريبت كل أسبوع لتجنب امتلاء قاعدة البيانات')

  } catch (error) {
    console.error('❌ خطأ في التنظيف الطارئ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل التنظيف الطارئ
emergencyCleanup()
