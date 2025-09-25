#!/usr/bin/env node

/**
 * سكريپت تشغيل مزامنة المدفوعات من سطر الأوامر
 * يمكن تشغيله بالأوامر التالية:
 * 
 * npm run sync-payments
 * node scripts/run-payment-sync.js
 * node scripts/run-payment-sync.js --type=regular
 * node scripts/run-payment-sync.js --type=clearance
 * node scripts/run-payment-sync.js --type=all
 */

const { syncRegularInvoices, syncClearanceInvoices, generatePaymentReport } = require('./sync-payment-calculations')

// تحليل المعاملات من سطر الأوامر
const args = process.argv.slice(2)
const typeArg = args.find(arg => arg.startsWith('--type='))
const type = typeArg ? typeArg.split('=')[1] : 'all'

// عرض المساعدة
function showHelp() {
  console.log(`
🔧 سكريپت مزامنة المدفوعات والأقساط

الاستخدام:
  node scripts/run-payment-sync.js [--type=TYPE]

الخيارات:
  --type=regular    مزامنة الفواتير العادية فقط
  --type=clearance  مزامنة فواتير التخليص الجمركي فقط
  --type=all        مزامنة جميع الفواتير (افتراضي)
  --help           عرض هذه المساعدة

أمثلة:
  node scripts/run-payment-sync.js
  node scripts/run-payment-sync.js --type=regular
  node scripts/run-payment-sync.js --type=clearance
  node scripts/run-payment-sync.js --type=all

📝 ملاحظة: تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل التشغيل
`)
}

// دالة رئيسية
async function main() {
  // التحقق من طلب المساعدة
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  // التحقق من صحة نوع المزامنة
  if (!['regular', 'clearance', 'all'].includes(type)) {
    console.error(`❌ نوع المزامنة غير صحيح: ${type}`)
    console.error('الأنواع المدعومة: regular, clearance, all')
    process.exit(1)
  }

  console.log('🚀 بدء مزامنة حسابات المدفوعات والأقساط...')
  console.log(`📋 نوع المزامنة: ${type}`)
  console.log('=' .repeat(60))

  try {
    const startTime = Date.now()

    switch (type) {
      case 'regular':
        console.log('🔄 مزامنة الفواتير العادية...')
        await syncRegularInvoices()
        break

      case 'clearance':
        console.log('🔄 مزامنة فواتير التخليص الجمركي...')
        await syncClearanceInvoices()
        break

      case 'all':
        console.log('🔄 مزامنة جميع الفواتير...')
        await syncRegularInvoices()
        console.log()
        await syncClearanceInvoices()
        break
    }

    console.log()
    await generatePaymentReport()

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log(`✅ تمت المزامنة بنجاح في ${duration} ثانية!`)

  } catch (error) {
    console.error('\n❌ خطأ في مزامنة المدفوعات:', error.message)
    console.error('تفاصيل الخطأ:', error)
    process.exit(1)
  }
}

// تشغيل السكريپت
if (require.main === module) {
  main().catch(error => {
    console.error('❌ خطأ غير متوقع:', error)
    process.exit(1)
  })
}

module.exports = { main }
