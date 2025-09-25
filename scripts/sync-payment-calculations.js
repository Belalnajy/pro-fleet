/**
 * سكريپت مزامنة حسابات المدفوعات والأقساط
 * يحدث جميع الفواتير الموجودة لضمان تسق البيانات مع النظام الجديد
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// دالة حساب حالة المدفوعات (نسخة JavaScript من TypeScript utility)
function calculatePaymentStatus(invoice, payments = [], newPaymentAmount = 0) {
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const amountPaid = totalPayments + newPaymentAmount
  let remainingAmount = invoice.total - amountPaid
  // Fix floating point precision errors
  if (Math.abs(remainingAmount) < 0.01) {
    remainingAmount = 0
  } else {
    remainingAmount = Math.max(0, remainingAmount)
  }
  
  let paymentStatus = 'PENDING'
  let installmentsPaid = 0
  let nextInstallmentDate = null
  
  // التحقق من انتهاء الموعد المحدد
  const isOverdue = new Date() > new Date(invoice.dueDate) && remainingAmount > 0
  
  if (remainingAmount === 0 || amountPaid >= invoice.total) {
    // مدفوعة بالكامل
    paymentStatus = 'PAID'
    installmentsPaid = invoice.installmentCount || 0
  } else if (amountPaid > 0) {
    // دفع جزئي أو أقساط
    if (invoice.installmentCount && invoice.installmentAmount && invoice.installmentCount > 0) {
      // نظام الأقساط
      paymentStatus = 'INSTALLMENT'
      installmentsPaid = Math.floor(amountPaid / invoice.installmentAmount)
      installmentsPaid = Math.min(installmentsPaid, invoice.installmentCount)
      
      // حساب موعد القسط التالي
      if (installmentsPaid < invoice.installmentCount && remainingAmount > 0) {
        const lastPaymentDate = payments.length > 0 
          ? new Date(Math.max(...payments.map(p => new Date(p.paymentDate).getTime())))
          : new Date()
        
        nextInstallmentDate = new Date(lastPaymentDate)
        nextInstallmentDate.setMonth(nextInstallmentDate.getMonth() + 1)
      }
    } else {
      // دفع جزئي عادي
      paymentStatus = 'PARTIAL'
    }
  } else {
    // لم يتم الدفع بعد
    if (invoice.paymentStatus === 'SENT') {
      paymentStatus = 'SENT'
    } else if (invoice.paymentStatus === 'CANCELLED') {
      paymentStatus = 'CANCELLED'
    } else {
      paymentStatus = 'PENDING'
    }
  }
  
  // التحقق من التأخير
  if (isOverdue && paymentStatus !== 'PAID' && paymentStatus !== 'CANCELLED') {
    paymentStatus = 'OVERDUE'
  }
  
  return {
    amountPaid,
    remainingAmount,
    paymentStatus,
    installmentsPaid,
    nextInstallmentDate,
    isFullyPaid: amountPaid >= invoice.total,
    isOverdue
  }
}

async function syncRegularInvoices() {
  console.log('🔄 مزامنة الفواتير العادية...')
  
  const invoices = await prisma.invoice.findMany({
    include: {
      payments: {
        select: {
          amount: true,
          paymentDate: true
        }
      }
    }
  })
  
  console.log(`📊 تم العثور على ${invoices.length} فاتورة عادية`)
  
  let updatedCount = 0
  let errorCount = 0
  
  for (const invoice of invoices) {
    try {
      const calculation = calculatePaymentStatus(invoice, invoice.payments)
      
      // التحقق من الحاجة للتحديث
      const needsUpdate = 
        invoice.amountPaid !== calculation.amountPaid ||
        invoice.remainingAmount !== calculation.remainingAmount ||
        invoice.paymentStatus !== calculation.paymentStatus ||
        invoice.installmentsPaid !== calculation.installmentsPaid ||
        (invoice.nextInstallmentDate?.getTime() !== calculation.nextInstallmentDate?.getTime())
      
      if (needsUpdate) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: calculation.amountPaid,
            remainingAmount: calculation.remainingAmount,
            paymentStatus: calculation.paymentStatus,
            installmentsPaid: calculation.installmentsPaid,
            nextInstallmentDate: calculation.nextInstallmentDate,
            paidDate: calculation.isFullyPaid && !invoice.paidDate ? new Date() : invoice.paidDate
          }
        })
        
        console.log(`✅ تم تحديث الفاتورة ${invoice.invoiceNumber}:`)
        console.log(`   - المبلغ المدفوع: ${invoice.amountPaid} → ${calculation.amountPaid}`)
        console.log(`   - المبلغ المتبقي: ${invoice.remainingAmount} → ${calculation.remainingAmount}`)
        console.log(`   - الحالة: ${invoice.paymentStatus} → ${calculation.paymentStatus}`)
        
        updatedCount++
      }
    } catch (error) {
      console.error(`❌ خطأ في تحديث الفاتورة ${invoice.invoiceNumber}:`, error.message)
      errorCount++
    }
  }
  
  console.log(`✅ تم تحديث ${updatedCount} فاتورة عادية بنجاح`)
  if (errorCount > 0) {
    console.log(`❌ فشل في تحديث ${errorCount} فاتورة`)
  }
}

async function syncClearanceInvoices() {
  console.log('🔄 مزامنة فواتير التخليص الجمركي...')
  
  const clearanceInvoices = await prisma.customsClearanceInvoice.findMany({
    include: {
      payments: {
        select: {
          amount: true,
          paymentDate: true
        }
      }
    }
  })
  
  console.log(`📊 تم العثور على ${clearanceInvoices.length} فاتورة تخليص جمركي`)
  
  let updatedCount = 0
  let errorCount = 0
  
  for (const invoice of clearanceInvoices) {
    try {
      const calculation = calculatePaymentStatus(invoice, invoice.payments)
      
      // التحقق من الحاجة للتحديث
      const needsUpdate = 
        invoice.amountPaid !== calculation.amountPaid ||
        invoice.remainingAmount !== calculation.remainingAmount ||
        invoice.paymentStatus !== calculation.paymentStatus ||
        invoice.installmentsPaid !== calculation.installmentsPaid ||
        (invoice.nextInstallmentDate?.getTime() !== calculation.nextInstallmentDate?.getTime())
      
      if (needsUpdate) {
        await prisma.customsClearanceInvoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: calculation.amountPaid,
            remainingAmount: calculation.remainingAmount,
            paymentStatus: calculation.paymentStatus,
            installmentsPaid: calculation.installmentsPaid,
            nextInstallmentDate: calculation.nextInstallmentDate,
            paidDate: calculation.isFullyPaid && !invoice.paidDate ? new Date() : invoice.paidDate
          }
        })
        
        console.log(`✅ تم تحديث فاتورة التخليص ${invoice.invoiceNumber}:`)
        console.log(`   - المبلغ المدفوع: ${invoice.amountPaid} → ${calculation.amountPaid}`)
        console.log(`   - المبلغ المتبقي: ${invoice.remainingAmount} → ${calculation.remainingAmount}`)
        console.log(`   - الحالة: ${invoice.paymentStatus} → ${calculation.paymentStatus}`)
        
        updatedCount++
      }
    } catch (error) {
      console.error(`❌ خطأ في تحديث فاتورة التخليص ${invoice.invoiceNumber}:`, error.message)
      errorCount++
    }
  }
  
  console.log(`✅ تم تحديث ${updatedCount} فاتورة تخليص جمركي بنجاح`)
  if (errorCount > 0) {
    console.log(`❌ فشل في تحديث ${errorCount} فاتورة`)
  }
}

async function generatePaymentReport() {
  console.log('📊 إنشاء تقرير المدفوعات...')
  
  // إحصائيات الفواتير العادية
  const regularInvoicesStats = await prisma.invoice.groupBy({
    by: ['paymentStatus'],
    _count: {
      id: true
    },
    _sum: {
      total: true,
      amountPaid: true,
      remainingAmount: true
    }
  })
  
  // إحصائيات فواتير التخليص الجمركي
  const clearanceInvoicesStats = await prisma.customsClearanceInvoice.groupBy({
    by: ['paymentStatus'],
    _count: {
      id: true
    },
    _sum: {
      total: true,
      amountPaid: true,
      remainingAmount: true
    }
  })
  
  console.log('\n📈 تقرير الفواتير العادية:')
  regularInvoicesStats.forEach(stat => {
    console.log(`   ${stat.paymentStatus}: ${stat._count.id} فاتورة`)
    console.log(`     - إجمالي القيمة: ${stat._sum.total?.toFixed(2) || 0} ريال`)
    console.log(`     - المبلغ المدفوع: ${stat._sum.amountPaid?.toFixed(2) || 0} ريال`)
    console.log(`     - المبلغ المتبقي: ${stat._sum.remainingAmount?.toFixed(2) || 0} ريال`)
  })
  
  console.log('\n📈 تقرير فواتير التخليص الجمركي:')
  clearanceInvoicesStats.forEach(stat => {
    console.log(`   ${stat.paymentStatus}: ${stat._count.id} فاتورة`)
    console.log(`     - إجمالي القيمة: ${stat._sum.total?.toFixed(2) || 0} ريال`)
    console.log(`     - المبلغ المدفوع: ${stat._sum.amountPaid?.toFixed(2) || 0} ريال`)
    console.log(`     - المبلغ المتبقي: ${stat._sum.remainingAmount?.toFixed(2) || 0} ريال`)
  })
  
  // فواتير الأقساط
  const installmentInvoices = await prisma.invoice.findMany({
    where: {
      paymentStatus: 'INSTALLMENT'
    },
    select: {
      invoiceNumber: true,
      installmentCount: true,
      installmentsPaid: true,
      installmentAmount: true,
      nextInstallmentDate: true
    }
  })
  
  if (installmentInvoices.length > 0) {
    console.log('\n💳 فواتير الأقساط:')
    installmentInvoices.forEach(invoice => {
      console.log(`   ${invoice.invoiceNumber}: ${invoice.installmentsPaid}/${invoice.installmentCount} أقساط`)
      console.log(`     - قيمة القسط: ${invoice.installmentAmount} ريال`)
      console.log(`     - القسط التالي: ${invoice.nextInstallmentDate ? new Date(invoice.nextInstallmentDate).toLocaleDateString('ar-SA') : 'غير محدد'}`)
    })
  }
}

async function main() {
  try {
    console.log('🚀 بدء مزامنة حسابات المدفوعات والأقساط...')
    console.log('=' .repeat(60))
    
    await syncRegularInvoices()
    console.log()
    await syncClearanceInvoices()
    console.log()
    await generatePaymentReport()
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ تمت مزامنة جميع المدفوعات بنجاح!')
    
  } catch (error) {
    console.error('❌ خطأ في مزامنة المدفوعات:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريپت
if (require.main === module) {
  main()
}

module.exports = {
  syncRegularInvoices,
  syncClearanceInvoices,
  generatePaymentReport,
  calculatePaymentStatus
}
