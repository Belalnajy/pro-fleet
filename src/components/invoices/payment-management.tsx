"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Calendar, CreditCard, DollarSign, Receipt, Clock, CheckCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

interface Payment {
  id: string
  amount: number
  paymentMethod?: string
  paymentDate: string
  reference?: string
  notes?: string
  createdBy?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  amountPaid: number
  remainingAmount: number
  paymentStatus: string
  installmentCount?: number
  installmentsPaid: number
  installmentAmount?: number
  nextInstallmentDate?: string
  payments?: Payment[]
}

interface PaymentManagementProps {
  invoice: Invoice
  onPaymentAdded: (updatedInvoice: Invoice) => void
  apiEndpoint: string // '/api/admin/invoices' or '/api/customs-broker/invoices'
}

export function PaymentManagement({ invoice, onPaymentAdded, apiEndpoint }: PaymentManagementProps) {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(invoice)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: ''
  })

  // Installment form state
  const [installmentForm, setInstallmentForm] = useState({
    installmentCount: '',
    firstInstallmentDate: ''
  })

  // Sync currentInvoice with prop changes
  useEffect(() => {
    setCurrentInvoice(invoice)
  }, [invoice])

  useEffect(() => {
    if (invoice.payments) {
      setPayments(invoice.payments)
    } else {
      fetchPayments()
    }
  }, [invoice.id])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${apiEndpoint}/${invoice.id}/payments`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }

    if (parseFloat(paymentForm.amount) > currentInvoice.remainingAmount) {
      toast.error('المبلغ أكبر من المبلغ المتبقي')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${apiEndpoint}/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference,
          notes: paymentForm.notes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(prev => [data.payment, ...prev])
        // Update local state immediately
        setCurrentInvoice(data.invoice)
        // Also notify parent component
        onPaymentAdded(data.invoice)
        setPaymentForm({ amount: '', paymentMethod: '', reference: '', notes: '' })
        setPaymentDialogOpen(false)
        toast.success('تم إضافة الدفعة بنجاح')
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل في إضافة الدفعة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الدفعة')
    } finally {
      setLoading(false)
    }
  }

  const handleSetInstallments = async () => {
    if (!installmentForm.installmentCount || !installmentForm.firstInstallmentDate) {
      toast.error('يرجى إدخال جميع البيانات المطلوبة')
      return
    }

    const count = parseInt(installmentForm.installmentCount)
    if (count < 2 || count > 12) {
      toast.error('عدد الأقساط يجب أن يكون بين 2 و 12')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${apiEndpoint}/${invoice.id}/installments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentCount: count,
          firstInstallmentDate: installmentForm.firstInstallmentDate
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state immediately
        setCurrentInvoice(data.invoice)
        // Also notify parent component
        onPaymentAdded(data.invoice)
        setInstallmentForm({ installmentCount: '', firstInstallmentDate: '' })
        setInstallmentDialogOpen(false)
        toast.success('تم إعداد خطة الأقساط بنجاح')
      } else {
        const error = await response.json()
        toast.error(error.error || 'فشل في إعداد خطة الأقساط')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إعداد خطة الأقساط')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'في الانتظار', variant: 'secondary' as const },
      SENT: { label: 'تم الإرسال', variant: 'outline' as const },
      PAID: { label: 'مدفوعة', variant: 'default' as const },
      PARTIAL: { label: 'دفع جزئي', variant: 'secondary' as const },
      INSTALLMENT: { label: 'أقساط', variant: 'outline' as const },
      OVERDUE: { label: 'متأخرة', variant: 'destructive' as const },
      CANCELLED: { label: 'ملغية', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  // Safety check to prevent undefined errors
  if (!currentInvoice) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            ملخص المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {/* Amount Paid */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-green-500 rounded-full">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {formatCurrency(currentInvoice.amountPaid)}
                </div>
                <div className="text-sm font-medium text-green-600">المدفوع</div>
              </div>
            </div>

            {/* Remaining Amount */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-orange-500 rounded-full">
                  <Clock className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-700 mb-1">
                  {formatCurrency(currentInvoice.remainingAmount)}
                </div>
                <div className="text-sm font-medium text-orange-600">المتبقي</div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-500 rounded-full">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {formatCurrency(currentInvoice.total)}
                </div>
                <div className="text-sm font-medium text-blue-600">الإجمالي</div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-gray-500 rounded-full">
                  <FileText className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2">
                  {getStatusBadge(currentInvoice.paymentStatus)}
                </div>
                <div className="text-sm font-medium text-gray-600">الحالة</div>
              </div>
            </div>
          </div>

          {/* Installment Info */}
          {currentInvoice.paymentStatus === 'INSTALLMENT' && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500 rounded-full">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900">خطة الأقساط</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium mb-1">عدد الأقساط</div>
                    <div className="text-lg font-bold text-purple-900">{currentInvoice.installmentCount}</div>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium mb-1">المدفوع</div>
                    <div className="text-lg font-bold text-green-600">{currentInvoice.installmentsPaid}</div>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium mb-1">قيمة القسط</div>
                    <div className="text-lg font-bold text-purple-900">{formatCurrency(currentInvoice.installmentAmount || 0)}</div>
                  </div>
                  
                  <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-600 font-medium mb-1">القسط التالي</div>
                    <div className="text-sm font-bold text-purple-900">
                      {currentInvoice.nextInstallmentDate ? 
                        format(new Date(currentInvoice.nextInstallmentDate), 'dd/MM/yyyy', { locale: ar }) : 
                        'غير محدد'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons - Only show if invoice is not fully paid */}
      {currentInvoice.remainingAmount > 0 && currentInvoice.paymentStatus !== 'PAID' && (
        <div className="flex gap-2">
          {/* Payment Button - Show different text based on payment status */}
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={currentInvoice.remainingAmount <= 0}>
                <CreditCard className="h-4 w-4 mr-2" />
                {currentInvoice.paymentStatus === 'INSTALLMENT' ? 'دفع قسط' : 'إضافة دفعة'}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentInvoice.paymentStatus === 'INSTALLMENT' ? 'دفع قسط' : 'إضافة دفعة جديدة'}
              </DialogTitle>
              <DialogDescription>
                {currentInvoice.paymentStatus === 'INSTALLMENT' ? 
                  'قم بدفع قسط من الفاتورة أو أي مبلغ آخر' : 
                  'أضف دفعة جديدة لهذه الفاتورة'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Installment Info */}
              {currentInvoice.paymentStatus === 'INSTALLMENT' && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800 mb-2">
                    <strong>معلومات القسط:</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div>قيمة القسط: {formatCurrency(currentInvoice.installmentAmount || 0)}</div>
                    <div>الأقساط المدفوعة: {currentInvoice.installmentsPaid}/{currentInvoice.installmentCount}</div>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    يمكنك دفع قيمة القسط أو أي مبلغ آخر حتى المبلغ المتبقي
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="amount">المبلغ</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  max={currentInvoice.remainingAmount}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder={currentInvoice.paymentStatus === 'INSTALLMENT' ? 
                    `قيمة القسط: ${formatCurrency(currentInvoice.installmentAmount || 0)}` : 
                    `الحد الأقصى: ${formatCurrency(currentInvoice.remainingAmount)}`
                  }
                />
                {currentInvoice.paymentStatus === 'INSTALLMENT' && (
                  <div className="flex gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPaymentForm(prev => ({ ...prev, amount: (currentInvoice.installmentAmount || 0).toString() }))}
                    >
                      قيمة القسط
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPaymentForm(prev => ({ ...prev, amount: currentInvoice.remainingAmount.toString() }))}
                    >
                      المبلغ المتبقي
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <Select 
                  value={paymentForm.paymentMethod} 
                  onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="card">بطاقة ائتمان</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reference">رقم المرجع</Label>
                <Input
                  id="reference"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="رقم التحويل أو المرجع"
                />
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="ملاحظات إضافية"
                />
              </div>
              <Button onClick={handleAddPayment} disabled={loading} className="w-full">
                {loading ? 'جاري الإضافة...' : 'إضافة الدفعة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {currentInvoice.paymentStatus !== 'INSTALLMENT' && currentInvoice.paymentStatus !== 'PAID' && (
          <Dialog open={installmentDialogOpen} onOpenChange={setInstallmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                إعداد أقساط
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إعداد خطة الأقساط</DialogTitle>
                <DialogDescription>
                  حدد عدد الأقساط لتقسيم المبلغ المتبقي على دفعات شهرية
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="installmentCount">عدد الأقساط</Label>
                  <Select 
                    value={installmentForm.installmentCount} 
                    onValueChange={(value) => setInstallmentForm(prev => ({ ...prev, installmentCount: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عدد الأقساط" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 6, 12].map(count => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} أقساط
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="firstInstallmentDate">تاريخ أول قسط</Label>
                  <Input
                    id="firstInstallmentDate"
                    type="date"
                    value={installmentForm.firstInstallmentDate}
                    onChange={(e) => setInstallmentForm(prev => ({ ...prev, firstInstallmentDate: e.target.value }))}
                  />
                </div>
                {installmentForm.installmentCount && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">قيمة كل قسط:</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(currentInvoice.remainingAmount / parseInt(installmentForm.installmentCount || '1'))}
                    </div>
                  </div>
                )}
                <Button onClick={handleSetInstallments} disabled={loading} className="w-full">
                  {loading ? 'جاري الإعداد...' : 'إعداد خطة الأقساط'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      )}

      {/* Fully Paid Message */}
      {(currentInvoice.remainingAmount <= 0 || currentInvoice.paymentStatus === 'PAID') && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 bg-green-500 rounded-full">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-700 mb-1">
                  تم دفع الفاتورة بالكامل
                </div>
                <div className="text-sm text-green-600">
                  لا يمكن إضافة مدفوعات أو أقساط جديدة
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            تاريخ المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مدفوعات مسجلة
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={payment.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.paymentDate), 'dd/MM/yyyy HH:mm', { locale: ar })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {payment.paymentMethod && (
                        <div className="text-sm font-medium">
                          {payment.paymentMethod === 'cash' ? 'نقدي' :
                           payment.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' :
                           payment.paymentMethod === 'check' ? 'شيك' :
                           payment.paymentMethod === 'card' ? 'بطاقة ائتمان' : 'أخرى'}
                        </div>
                      )}
                      {payment.reference && (
                        <div className="text-sm text-muted-foreground">
                          مرجع: {payment.reference}
                        </div>
                      )}
                    </div>
                  </div>
                  {payment.notes && (
                    <div className="mt-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {payment.notes}
                    </div>
                  )}
                  {index < payments.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
