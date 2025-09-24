#!/usr/bin/env node

/**
 * سكريبت اختبار نظام الدفع للعملاء
 * يختبر كلاً من الفواتير العادية وفواتير التخليص الجمركي
 */

const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testCustomerPaymentSystem() {
  console.log('🧪 بدء اختبار نظام الدفع للعملاء...\n')

  try {
    // 1. البحث عن عميل للاختبار
    const customer = await db.user.findFirst({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true }
    })

    if (!customer) {
      console.log('❌ لم يتم العثور على عملاء في النظام')
      return
    }

    console.log(`👤 العميل المختار للاختبار: ${customer.name} (${customer.email})`)

    // 2. فحص الفواتير العادية للعميل
    console.log('\n📋 فحص الفواتير العادية:')
    const regularInvoices = await db.invoice.findMany({
      where: {
        trip: { customerId: customer.id }
      },
      include: {
        trip: {
          select: {
            tripNumber: true,
            fromCity: { select: { name: true, nameAr: true } },
            toCity: { select: { name: true, nameAr: true } }
          }
        },
        payments: true
      },
      take: 3
    })

    console.log(`   📊 عدد الفواتير العادية: ${regularInvoices.length}`)
    
    regularInvoices.forEach((invoice, index) => {
      console.log(`   ${index + 1}. فاتورة ${invoice.invoiceNumber}:`)
      console.log(`      - المبلغ الإجمالي: ${invoice.total} ريال`)
      console.log(`      - المبلغ المدفوع: ${invoice.amountPaid || 0} ريال`)
      console.log(`      - المبلغ المتبقي: ${invoice.remainingAmount !== null ? invoice.remainingAmount : (invoice.total - (invoice.amountPaid || 0))} ريال`)
      console.log(`      - حالة الدفع: ${invoice.paymentStatus}`)
      console.log(`      - عدد المدفوعات: ${invoice.payments?.length || 0}`)
      console.log(`      - الرحلة: ${invoice.trip.fromCity.nameAr} → ${invoice.trip.toCity.nameAr}`)
    })

    // 3. فحص فواتير التخليص الجمركي للعميل
    console.log('\n🏛️ فحص فواتير التخليص الجمركي:')
    const clearanceInvoices = await db.customsClearanceInvoice.findMany({
      where: {
        clearance: {
          invoice: {
            trip: { customerId: customer.id }
          }
        }
      },
      include: {
        clearance: {
          include: {
            invoice: {
              include: {
                trip: {
                  select: {
                    tripNumber: true,
                    fromCity: { select: { name: true, nameAr: true } },
                    toCity: { select: { name: true, nameAr: true } }
                  }
                }
              }
            }
          }
        },
        payments: true,
        customsBroker: {
          include: { user: { select: { name: true } } }
        }
      },
      take: 3
    })

    console.log(`   📊 عدد فواتير التخليص: ${clearanceInvoices.length}`)
    
    clearanceInvoices.forEach((invoice, index) => {
      console.log(`   ${index + 1}. فاتورة تخليص ${invoice.invoiceNumber}:`)
      console.log(`      - المبلغ الإجمالي: ${invoice.total} ريال`)
      console.log(`      - المبلغ المدفوع: ${invoice.amountPaid || 0} ريال`)
      console.log(`      - المبلغ المتبقي: ${invoice.remainingAmount !== null ? invoice.remainingAmount : (invoice.total - (invoice.amountPaid || 0))} ريال`)
      console.log(`      - حالة الدفع: ${invoice.paymentStatus}`)
      console.log(`      - عدد المدفوعات: ${invoice.payments?.length || 0}`)
      console.log(`      - المخلص الجمركي: ${invoice.customsBroker.user.name}`)
      console.log(`      - الرحلة: ${invoice.clearance.invoice.trip.fromCity.nameAr} → ${invoice.clearance.invoice.trip.toCity.nameAr}`)
    })

    // 4. فحص APIs الدفع
    console.log('\n🔧 فحص APIs الدفع:')
    
    // فحص API الفواتير العادية
    if (regularInvoices.length > 0) {
      const testInvoice = regularInvoices.find(inv => inv.paymentStatus !== 'PAID') || regularInvoices[0]
      console.log(`   🧪 اختبار API الفواتير العادية مع الفاتورة: ${testInvoice.invoiceNumber}`)
      console.log(`   📡 API Endpoint: /api/customer/invoices/${testInvoice.id}/payments`)
      
      // فحص المدفوعات الموجودة
      const existingPayments = await db.payment.findMany({
        where: { invoiceId: testInvoice.id },
        orderBy: { createdAt: 'desc' }
      })
      console.log(`   💰 المدفوعات الموجودة: ${existingPayments.length}`)
    }

    // فحص API فواتير التخليص
    if (clearanceInvoices.length > 0) {
      const testClearanceInvoice = clearanceInvoices.find(inv => inv.paymentStatus !== 'PAID') || clearanceInvoices[0]
      console.log(`   🧪 اختبار API فواتير التخليص مع الفاتورة: ${testClearanceInvoice.invoiceNumber}`)
      console.log(`   📡 API Endpoint: /api/customer/clearance-invoices/${testClearanceInvoice.id}/payments`)
      
      // فحص المدفوعات الموجودة
      const existingClearancePayments = await db.clearancePayment.findMany({
        where: { invoiceId: testClearanceInvoice.id },
        orderBy: { createdAt: 'desc' }
      })
      console.log(`   💰 المدفوعات الموجودة: ${existingClearancePayments.length}`)
    }

    // 5. فحص حسابات المبالغ المتبقية
    console.log('\n🧮 فحص حسابات المبالغ المتبقية:')
    
    const allInvoices = [
      ...regularInvoices.map(inv => ({ ...inv, type: 'REGULAR' })),
      ...clearanceInvoices.map(inv => ({ ...inv, type: 'CLEARANCE' }))
    ]

    let correctCalculations = 0
    let incorrectCalculations = 0

    allInvoices.forEach(invoice => {
      const expectedRemaining = invoice.total - (invoice.amountPaid || 0)
      const actualRemaining = invoice.remainingAmount !== null ? invoice.remainingAmount : expectedRemaining
      
      if (Math.abs(expectedRemaining - actualRemaining) < 0.01) {
        correctCalculations++
      } else {
        incorrectCalculations++
        console.log(`   ❌ خطأ في حساب المبلغ المتبقي للفاتورة ${invoice.invoiceNumber}:`)
        console.log(`      - المتوقع: ${expectedRemaining}`)
        console.log(`      - الفعلي: ${actualRemaining}`)
      }
    })

    console.log(`   ✅ حسابات صحيحة: ${correctCalculations}`)
    console.log(`   ❌ حسابات خاطئة: ${incorrectCalculations}`)

    // 6. توصيات الإصلاح
    console.log('\n💡 التوصيات:')
    
    if (regularInvoices.length === 0) {
      console.log('   ⚠️  لا توجد فواتير عادية للعميل - قم بإنشاء رحلات وفواتير للاختبار')
    }
    
    if (clearanceInvoices.length === 0) {
      console.log('   ⚠️  لا توجد فواتير تخليص جمركي للعميل - قم بإنشاء تخليصات جمركية للاختبار')
    }
    
    if (incorrectCalculations > 0) {
      console.log('   🔧 يوجد أخطاء في حسابات المبالغ المتبقية - قم بتشغيل سكريبت الإصلاح')
    }
    
    if (correctCalculations > 0 && incorrectCalculations === 0) {
      console.log('   🎉 جميع الحسابات صحيحة!')
    }

    console.log('\n✅ انتهى اختبار نظام الدفع للعملاء')

  } catch (error) {
    console.error('❌ خطأ أثناء اختبار نظام الدفع:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testCustomerPaymentSystem()
}

module.exports = { testCustomerPaymentSystem }
