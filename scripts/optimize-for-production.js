const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function optimizeForProduction() {
  console.log('🚀 تحسين النظام للإنتاج...\n')

  let totalSaved = 0

  try {
    // 1. تنظيف قاعدة البيانات
    console.log('🗄️ تنظيف قاعدة البيانات...')
    
    // حذف tracking logs أقدم من 7 أيام
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const deletedTracking = await prisma.trackingLog.deleteMany({
      where: { timestamp: { lt: sevenDaysAgo } }
    })
    
    // حذف الإشعارات المقروءة أقدم من 3 أيام
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: threeDaysAgo }
      }
    })
    
    console.log(`✅ حذف ${deletedTracking.count} سجل تتبع قديم`)
    console.log(`✅ حذف ${deletedNotifications.count} إشعار مقروء`)
    
    // 2. تحسين الفهارس (إذا لزم الأمر)
    console.log('\n🔍 تحسين الفهارس...')
    // يمكن إضافة استعلامات تحسين الفهارس هنا
    
    // 3. إحصائيات نهائية
    const currentStats = {
      trackingLogs: await prisma.trackingLog.count(),
      notifications: await prisma.notification.count(),
      trips: await prisma.trip.count(),
      invoices: await prisma.invoice.count(),
      users: await prisma.user.count()
    }
    
    console.log('\n📊 إحصائيات قاعدة البيانات بعد التحسين:')
    console.log(`📍 Tracking Logs: ${currentStats.trackingLogs}`)
    console.log(`🔔 الإشعارات: ${currentStats.notifications}`)
    console.log(`🚛 الرحلات: ${currentStats.trips}`)
    console.log(`📄 الفواتير: ${currentStats.invoices}`)
    console.log(`👥 المستخدمون: ${currentStats.users}`)
    
    // 4. تنظيف الملفات المؤقتة
    console.log('\n🗂️ تنظيف الملفات المؤقتة...')
    
    const tempDirs = ['.next', 'node_modules/.cache', '.vercel']
    let cleanedFiles = 0
    
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        try {
          const stats = await fs.promises.stat(dir)
          if (stats.isDirectory()) {
            // لا نحذف هذه المجلدات لأنها مهمة، فقط نعد الملفات
            console.log(`📁 ${dir} موجود`)
          }
        } catch (error) {
          // تجاهل الأخطاء
        }
      }
    }
    
    // 5. نصائح للتحسين
    console.log('\n💡 نصائح للتحسين:')
    console.log('1. شغل هذا السكريبت كل أسبوع')
    console.log('2. راقب حجم قاعدة البيانات بانتظام')
    console.log('3. استخدم CDN للملفات الثقيلة في الإنتاج')
    console.log('4. فعل ضغط البيانات في الإنتاج')
    console.log('5. استخدم قاعدة بيانات أكبر للإنتاج النهائي')
    
    // 6. إعدادات الإنتاج المقترحة
    console.log('\n⚙️ إعدادات الإنتاج المقترحة:')
    console.log('DATABASE_URL=postgresql://user:pass@host:5432/profleet_prod')
    console.log('NEXTAUTH_SECRET=your-super-secret-key-here')
    console.log('CLOUDINARY_URL=cloudinary://key:secret@cloud')
    console.log('NODE_ENV=production')
    
    console.log('\n🎉 تم تحسين النظام للإنتاج بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ في التحسين:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل التحسين
optimizeForProduction()
