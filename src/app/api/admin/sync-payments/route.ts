import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculatePaymentStatus, validatePaymentAmount } from '@/lib/payment-calculator'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    // إحصائيات الفواتير العادية
    const regularInvoicesStats = await db.invoice.groupBy({
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
    const clearanceInvoicesStats = await db.customsClearanceInvoice.groupBy({
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

    // عدد الفواتير التي تحتاج مزامنة
    const regularInvoicesNeedSync = await db.invoice.findMany({
      include: {
        payments: {
          select: {
            amount: true,
            paymentDate: true
          }
        }
      },
      take: 5 // عينة صغيرة للفحص
    })

    const clearanceInvoicesNeedSync = await db.customsClearanceInvoice.findMany({
      include: {
        payments: {
          select: {
            amount: true,
            paymentDate: true
          }
        }
      },
      take: 5 // عينة صغيرة للفحص
    })

    // فحص الفواتير التي تحتاج مزامنة
    let regularNeedSyncCount = 0
    let clearanceNeedSyncCount = 0

    for (const invoice of regularInvoicesNeedSync) {
      const calculation = calculatePaymentStatus(invoice, invoice.payments)
      const needsUpdate = 
        invoice.amountPaid !== calculation.amountPaid ||
        invoice.remainingAmount !== calculation.remainingAmount ||
        invoice.paymentStatus !== calculation.paymentStatus ||
        invoice.installmentsPaid !== calculation.installmentsPaid

      if (needsUpdate) regularNeedSyncCount++
    }

    for (const invoice of clearanceInvoicesNeedSync) {
      const calculation = calculatePaymentStatus(invoice, invoice.payments)
      const needsUpdate = 
        invoice.amountPaid !== calculation.amountPaid ||
        invoice.remainingAmount !== calculation.remainingAmount ||
        invoice.paymentStatus !== calculation.paymentStatus ||
        invoice.installmentsPaid !== calculation.installmentsPaid

      if (needsUpdate) clearanceNeedSyncCount++
    }

    // فواتير الأقساط
    const installmentInvoices = await db.invoice.findMany({
      where: {
        paymentStatus: 'INSTALLMENT'
      },
      select: {
        invoiceNumber: true,
        installmentCount: true,
        installmentsPaid: true,
        installmentAmount: true,
        nextInstallmentDate: true,
        total: true,
        amountPaid: true,
        remainingAmount: true
      },
      take: 10
    })

    const clearanceInstallmentInvoices = await db.customsClearanceInvoice.findMany({
      where: {
        paymentStatus: 'INSTALLMENT'
      },
      select: {
        invoiceNumber: true,
        installmentCount: true,
        installmentsPaid: true,
        installmentAmount: true,
        nextInstallmentDate: true,
        total: true,
        amountPaid: true,
        remainingAmount: true
      },
      take: 10
    })

    return NextResponse.json({
      regularInvoices: {
        stats: regularInvoicesStats,
        needSyncCount: regularNeedSyncCount,
        totalCount: await db.invoice.count()
      },
      clearanceInvoices: {
        stats: clearanceInvoicesStats,
        needSyncCount: clearanceNeedSyncCount,
        totalCount: await db.customsClearanceInvoice.count()
      },
      installmentInvoices: {
        regular: installmentInvoices,
        clearance: clearanceInstallmentInvoices
      }
    })

  } catch (error) {
    console.error('خطأ في جلب إحصائيات المدفوعات:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب البيانات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 403 }
      )
    }

    const { type } = await request.json()

    if (type === 'regular') {
      return await syncRegularInvoices()
    } else if (type === 'clearance') {
      return await syncClearanceInvoices()
    } else if (type === 'all') {
      const regularResult = await syncRegularInvoices()
      const clearanceResult = await syncClearanceInvoices()
      
      return NextResponse.json({
        success: true,
        message: 'تمت مزامنة جميع الفواتير بنجاح',
        results: {
          regular: regularResult,
          clearance: clearanceResult
        }
      })
    } else {
      return NextResponse.json(
        { error: 'نوع المزامنة غير صحيح' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('خطأ في مزامنة المدفوعات:', error)
    return NextResponse.json(
      { error: 'خطأ في مزامنة البيانات' },
      { status: 500 }
    )
  }
}

async function syncRegularInvoices() {
  const invoices = await db.invoice.findMany({
    include: {
      payments: {
        select: {
          amount: true,
          paymentDate: true
        }
      }
    }
  })

  let updatedCount = 0
  let errorCount = 0
  const errors: string[] = []

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
        await db.invoice.update({
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
        
        updatedCount++
      }
    } catch (error) {
      console.error(`خطأ في تحديث الفاتورة ${invoice.invoiceNumber}:`, error)
      errors.push(`فاتورة ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    message: `تم تحديث ${updatedCount} فاتورة عادية بنجاح`,
    details: {
      totalInvoices: invoices.length,
      updatedCount,
      errorCount,
      errors: errors.slice(0, 10) // أول 10 أخطاء فقط
    }
  })
}

async function syncClearanceInvoices() {
  const clearanceInvoices = await db.customsClearanceInvoice.findMany({
    include: {
      payments: {
        select: {
          amount: true,
          paymentDate: true
        }
      }
    }
  })

  let updatedCount = 0
  let errorCount = 0
  const errors: string[] = []

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
        await db.customsClearanceInvoice.update({
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
        
        updatedCount++
      }
    } catch (error) {
      console.error(`خطأ في تحديث فاتورة التخليص ${invoice.invoiceNumber}:`, error)
      errors.push(`فاتورة ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
      errorCount++
    }
  }

  return NextResponse.json({
    success: true,
    message: `تم تحديث ${updatedCount} فاتورة تخليص جمركي بنجاح`,
    details: {
      totalInvoices: clearanceInvoices.length,
      updatedCount,
      errorCount,
      errors: errors.slice(0, 10) // أول 10 أخطاء فقط
    }
  })
}
