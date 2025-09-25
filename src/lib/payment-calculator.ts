/**
 * Payment and Installment Calculator Utility
 * يحسب حالة المدفوعات والأقساط بدقة ويضمن التسق في جميع أنحاء النظام
 */

export interface PaymentCalculationResult {
  amountPaid: number
  remainingAmount: number
  paymentStatus: PaymentStatus
  installmentsPaid: number
  nextInstallmentDate: Date | null
  isFullyPaid: boolean
  isOverdue: boolean
}

export type PaymentStatus = 
  | 'PENDING'      // في انتظار الدفع
  | 'SENT'         // تم الإرسال
  | 'PAID'         // مدفوعة بالكامل
  | 'PARTIAL'      // دفع جزئي
  | 'INSTALLMENT'  // دفع بالأقساط
  | 'OVERDUE'      // متأخرة
  | 'CANCELLED'    // ملغية

export interface InvoiceData {
  total: number
  dueDate: Date
  installmentCount?: number | null
  installmentAmount?: number | null
  currentAmountPaid?: number
  currentPaymentStatus?: PaymentStatus
}

export interface PaymentRecord {
  amount: number
  paymentDate: Date
}

/**
 * حساب حالة المدفوعات والأقساط الجديدة
 */
export function calculatePaymentStatus(
  invoice: InvoiceData,
  payments: PaymentRecord[] = [],
  newPaymentAmount?: number
): PaymentCalculationResult {
  
  // حساب إجمالي المدفوعات
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const amountPaid = totalPayments + (newPaymentAmount || 0)
  const remainingAmount = Math.max(0, invoice.total - amountPaid)
  
  // تحديد حالة الدفع
  let paymentStatus: PaymentStatus = 'PENDING'
  let installmentsPaid = 0
  let nextInstallmentDate: Date | null = null
  
  // التحقق من انتهاء الموعد المحدد
  const isOverdue = new Date() > new Date(invoice.dueDate) && remainingAmount > 0
  
  if (amountPaid >= invoice.total) {
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
    if (invoice.currentPaymentStatus === 'SENT') {
      paymentStatus = 'SENT'
    } else if (invoice.currentPaymentStatus === 'CANCELLED') {
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

/**
 * إعداد خطة الأقساط
 */
export function setupInstallmentPlan(
  totalAmount: number,
  installmentCount: number,
  firstInstallmentDate?: Date
): {
  installmentAmount: number
  nextInstallmentDate: Date
  installmentSchedule: Array<{
    installmentNumber: number
    amount: number
    dueDate: Date
  }>
} {
  if (installmentCount <= 0) {
    throw new Error('عدد الأقساط يجب أن يكون أكبر من صفر')
  }
  
  const installmentAmount = Math.round((totalAmount / installmentCount) * 100) / 100
  const nextInstallmentDate = firstInstallmentDate || new Date()
  
  // إنشاء جدول الأقساط
  const installmentSchedule: Array<{
    installmentNumber: number
    amount: number
    dueDate: Date
  }> = []
  
  for (let i = 0; i < installmentCount; i++) {
    const dueDate = new Date(nextInstallmentDate)
    dueDate.setMonth(dueDate.getMonth() + i)
    
    installmentSchedule.push({
      installmentNumber: i + 1,
      amount: i === installmentCount - 1 
        ? totalAmount - (installmentAmount * (installmentCount - 1)) // آخر قسط يأخذ الباقي
        : installmentAmount,
      dueDate
    })
  }
  
  return {
    installmentAmount,
    nextInstallmentDate,
    installmentSchedule
  }
}

/**
 * التحقق من صحة مبلغ الدفعة
 */
export function validatePaymentAmount(
  paymentAmount: number,
  invoice: InvoiceData,
  currentPayments: PaymentRecord[] = []
): {
  isValid: boolean
  error?: string
  warnings?: string[]
} {
  const warnings: string[] = []
  
  if (paymentAmount <= 0) {
    return { isValid: false, error: 'مبلغ الدفعة يجب أن يكون أكبر من صفر' }
  }
  
  const currentCalculation = calculatePaymentStatus(invoice, currentPayments)
  
  if (paymentAmount > currentCalculation.remainingAmount) {
    return { 
      isValid: false, 
      error: `مبلغ الدفعة (${paymentAmount}) أكبر من المبلغ المتبقي (${currentCalculation.remainingAmount})` 
    }
  }
  
  // تحذيرات للأقساط
  if (invoice.installmentAmount && currentCalculation.paymentStatus === 'INSTALLMENT') {
    if (paymentAmount !== invoice.installmentAmount && paymentAmount !== currentCalculation.remainingAmount) {
      warnings.push(`قيمة القسط المحددة هي ${invoice.installmentAmount} ريال`)
    }
  }
  
  return { isValid: true, warnings }
}

/**
 * تحديث حالة الفاتورة بعد إضافة دفعة
 */
export function updateInvoiceAfterPayment(
  invoice: InvoiceData,
  payments: PaymentRecord[],
  newPayment: { amount: number; paymentDate: Date }
): PaymentCalculationResult {
  const allPayments = [...payments, newPayment]
  return calculatePaymentStatus(invoice, allPayments)
}

/**
 * الحصول على معلومات الأقساط المتبقية
 */
export function getRemainingInstallments(
  invoice: InvoiceData,
  payments: PaymentRecord[]
): Array<{
  installmentNumber: number
  amount: number
  dueDate: Date
  isPaid: boolean
  isOverdue: boolean
}> {
  if (!invoice.installmentCount || !invoice.installmentAmount) {
    return []
  }
  
  const calculation = calculatePaymentStatus(invoice, payments)
  const installmentPlan = setupInstallmentPlan(
    invoice.total,
    invoice.installmentCount,
    new Date() // يمكن تحسين هذا لاستخدام تاريخ أول قسط
  )
  
  return installmentPlan.installmentSchedule.map((installment, index) => ({
    ...installment,
    isPaid: index < calculation.installmentsPaid,
    isOverdue: new Date() > installment.dueDate && index >= calculation.installmentsPaid
  }))
}
