#!/usr/bin/env node

/**
 * سكريبت اختبار APIs الدفع للعملاء
 * يختبر إضافة مدفوعات للفواتير العادية وفواتير التخليص الجمركي
 */

const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function testPaymentAPIs() {
  console.log('🧪 بدء اختبار APIs الدفع...\n')

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

    console.log(`👤 العميل المختار للاختبار: ${customer.name}`)

    // 2. البحث عن فاتورة عادية غير مدفوعة بالكامل
    const unpaidInvoice = await db.invoice.findFirst({
      where: {
        trip: { customerId: customer.id },
        paymentStatus: { in: ['PENDING', 'SENT', 'PARTIAL'] }
      },
      include: {
        trip: {
          select: {
            tripNumber: true,
            fromCity: { select: { nameAr: true } },
            toCity: { select: { nameAr: true } }
          }
        }
      }
    })

    if (unpaidInvoice) {
      console.log(`\n💳 اختبار دفع فاتورة عادية:`)
      console.log(`   📋 الفاتورة: ${unpaidInvoice.invoiceNumber}`)
      console.log(`   💰 المبلغ الإجمالي: ${unpaidInvoice.total} ريال`)
      console.log(`   💸 المبلغ المدفوع: ${unpaidInvoice.amountPaid || 0} ريال`)
      console.log(`   📊 المبلغ المتبقي: ${unpaidInvoice.remainingAmount !== null ? unpaidInvoice.remainingAmount : (unpaidInvoice.total - (unpaidInvoice.amountPaid || 0))} ريال`)

      // محاولة إضافة دفعة تجريبية
      const testPaymentAmount = Math.min(100, unpaidInvoice.total - (unpaidInvoice.amountPaid || 0))
      
      if (testPaymentAmount > 0) {
        try {
          const payment = await db.payment.create({
            data: {
              invoiceId: unpaidInvoice.id,
              amount: testPaymentAmount,
              paymentMethod: 'cash',
              reference: 'TEST-PAYMENT-' + Date.now(),
              notes: 'دفعة اختبار من السكريبت',
              createdBy: customer.id,
              paymentDate: new Date()
            }
          })

          // تحديث الفاتورة
          const newAmountPaid = (unpaidInvoice.amountPaid || 0) + testPaymentAmount
          const newRemainingAmount = unpaidInvoice.total - newAmountPaid
          let newPaymentStatus = unpaidInvoice.paymentStatus
          
          if (newRemainingAmount <= 0) {
            newPaymentStatus = 'PAID'
          } else if (newAmountPaid > 0) {
            newPaymentStatus = 'PARTIAL'
          }

          await db.invoice.update({
            where: { id: unpaidInvoice.id },
            data: {
              amountPaid: newAmountPaid,
              remainingAmount: newRemainingAmount,
              paymentStatus: newPaymentStatus,
              paidDate: newPaymentStatus === 'PAID' ? new Date() : null
            }
          })

          console.log(`   ✅ تم إضافة دفعة بمبلغ ${testPaymentAmount} ريال بنجاح`)
          console.log(`   📝 رقم المرجع: ${payment.reference}`)
          console.log(`   📊 الحالة الجديدة: ${newPaymentStatus}`)
        } catch (error) {
          console.log(`   ❌ فشل في إضافة الدفعة: ${error.message}`)
        }
      } else {
        console.log(`   ⚠️  الفاتورة مدفوعة بالكامل، لا يمكن إضافة دفعة`)
      }
    } else {
      console.log(`\n⚠️  لم يتم العثور على فواتير عادية غير مدفوعة للعميل`)
    }

    // 3. البحث عن فاتورة تخليص جمركي غير مدفوعة بالكامل
    const unpaidClearanceInvoice = await db.customsClearanceInvoice.findFirst({
      where: {
        clearance: {
          invoice: {
            trip: { customerId: customer.id }
          }
        },
        paymentStatus: { in: ['PENDING', 'SENT', 'PARTIAL'] }
      },
      include: {
        clearance: {
          include: {
            invoice: {
              include: {
                trip: {
                  select: {
                    tripNumber: true,
                    fromCity: { select: { nameAr: true } },
                    toCity: { select: { nameAr: true } }
                  }
                }
              }
            }
          }
        },
        customsBroker: {
          include: { user: { select: { name: true } } }
        }
      }
    })

    if (unpaidClearanceInvoice) {
      console.log(`\n🏛️ اختبار دفع فاتورة تخليص جمركي:`)
      console.log(`   📋 الفاتورة: ${unpaidClearanceInvoice.invoiceNumber}`)
      console.log(`   💰 المبلغ الإجمالي: ${unpaidClearanceInvoice.total} ريال`)
      console.log(`   💸 المبلغ المدفوع: ${unpaidClearanceInvoice.amountPaid || 0} ريال`)
      console.log(`   📊 المبلغ المتبقي: ${unpaidClearanceInvoice.remainingAmount !== null ? unpaidClearanceInvoice.remainingAmount : (unpaidClearanceInvoice.total - (unpaidClearanceInvoice.amountPaid || 0))} ريال`)
      console.log(`   👨‍💼 المخلص الجمركي: ${unpaidClearanceInvoice.customsBroker.user.name}`)

      // محاولة إضافة دفعة تجريبية
      const testClearancePaymentAmount = Math.min(100, unpaidClearanceInvoice.total - (unpaidClearanceInvoice.amountPaid || 0))
      
      if (testClearancePaymentAmount > 0) {
        try {
          const clearancePayment = await db.clearancePayment.create({
            data: {
              invoiceId: unpaidClearanceInvoice.id,
              amount: testClearancePaymentAmount,
              paymentMethod: 'bank_transfer',
              reference: 'TEST-CLEARANCE-PAYMENT-' + Date.now(),
              notes: 'دفعة اختبار تخليص جمركي من السكريبت',
              createdBy: customer.id,
              paymentDate: new Date()
            }
          })

          // تحديث فاتورة التخليص
          const newAmountPaid = (unpaidClearanceInvoice.amountPaid || 0) + testClearancePaymentAmount
          const newRemainingAmount = unpaidClearanceInvoice.total - newAmountPaid
          let newPaymentStatus = unpaidClearanceInvoice.paymentStatus
          
          if (newRemainingAmount <= 0) {
            newPaymentStatus = 'PAID'
          } else if (newAmountPaid > 0) {
            newPaymentStatus = 'PARTIAL'
          }

          await db.customsClearanceInvoice.update({
            where: { id: unpaidClearanceInvoice.id },
            data: {
              amountPaid: newAmountPaid,
              remainingAmount: newRemainingAmount,
              paymentStatus: newPaymentStatus,
              paidDate: newPaymentStatus === 'PAID' ? new Date() : null
            }
          })

          console.log(`   ✅ تم إضافة دفعة تخليص بمبلغ ${testClearancePaymentAmount} ريال بنجاح`)
          console.log(`   📝 رقم المرجع: ${clearancePayment.reference}`)
          console.log(`   📊 الحالة الجديدة: ${newPaymentStatus}`)
        } catch (error) {
          console.log(`   ❌ فشل في إضافة دفعة التخليص: ${error.message}`)
        }
      } else {
        console.log(`   ⚠️  فاتورة التخليص مدفوعة بالكامل، لا يمكن إضافة دفعة`)
      }
    } else {
      console.log(`\n⚠️  لم يتم العثور على فواتير تخليص جمركي غير مدفوعة للعميل`)
    }

    // 4. إحصائيات نهائية
    console.log(`\n📊 إحصائيات نهائية:`)
    
    const totalRegularInvoices = await db.invoice.count({
      where: { trip: { customerId: customer.id } }
    })
    
    const totalClearanceInvoices = await db.customsClearanceInvoice.count({
      where: {
        clearance: {
          invoice: {
            trip: { customerId: customer.id }
          }
        }
      }
    })

    const totalPayments = await db.payment.count({
      where: {
        invoice: {
          trip: { customerId: customer.id }
        }
      }
    })

    const totalClearancePayments = await db.clearancePayment.count({
      where: {
        invoice: {
          clearance: {
            invoice: {
              trip: { customerId: customer.id }
            }
          }
        }
      }
    })

    console.log(`   📋 إجمالي الفواتير العادية: ${totalRegularInvoices}`)
    console.log(`   🏛️ إجمالي فواتير التخليص: ${totalClearanceInvoices}`)
    console.log(`   💳 إجمالي المدفوعات العادية: ${totalPayments}`)
    console.log(`   🏛️ إجمالي مدفوعات التخليص: ${totalClearancePayments}`)

    console.log('\n✅ انتهى اختبار APIs الدفع')

  } catch (error) {
    console.error('❌ خطأ أثناء اختبار APIs الدفع:', error)
  } finally {
    await db.$disconnect()
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testPaymentAPIs()
}

module.exports = { testPaymentAPIs }
