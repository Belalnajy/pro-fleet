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
import { Calendar, CreditCard, SaudiRiyal, Receipt, Clock, CheckCircle, FileText } from 'lucide-react'
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
  console.log('PaymentManagement received invoice:', {
    id: invoice.id,
    installmentCount: invoice.installmentCount,
    installmentsPaid: invoice.installmentsPaid,
    installmentAmount: invoice.installmentAmount,
    paymentStatus: invoice.paymentStatus
  })
  
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(invoice)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: ''
  })

  const [installmentForm, setInstallmentForm] = useState({
    installmentCount: '',
    firstInstallmentDate: ''
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    setCurrentInvoice(invoice)
  }, [invoice])

  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [currentInvoice.installmentCount, currentInvoice.paymentStatus])

  useEffect(() => {
    console.log('PaymentManagement received invoice:', invoice)
    setCurrentInvoice(invoice)
    // Always fetch payments from API to get the latest data
    fetchPayments()
  }, [invoice.id])

  const fetchPayments = async () => {
    try {
      console.log('Fetching payments for invoice:', invoice.id, 'from:', `${apiEndpoint}/${invoice.id}/payments`)
      const response = await fetch(`${apiEndpoint}/${invoice.id}/payments`)
      if (response.ok) {
        const data = await response.json()
        console.log('Payments response:', data)
        const payments = data.payments || []
        setPayments(payments)
        
        // Don't recalculate payment data - trust the backend data
        // The invoice data from the API should already have correct payment information
        console.log('Payments fetched:', {
          paymentsCount: payments.length,
          currentInvoiceData: {
            amountPaid: currentInvoice.amountPaid,
            remainingAmount: currentInvoice.remainingAmount,
            installmentsPaid: currentInvoice.installmentsPaid,
            paymentStatus: currentInvoice.paymentStatus
          }
        })
        
        // Keep the original invoice data as it comes from the backend
        // Only update if we need to refresh from server
      } else {
        console.log('Failed to fetch payments, status:', response.status)
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

    if (!paymentForm.paymentMethod) {
      toast.error('يرجى اختيار طريقة الدفع')
      return
    }

    if (parseFloat(paymentForm.amount) > currentInvoice.remainingAmount) {
      toast.error('المبلغ أكبر من المبلغ المتبقي')
      return
    }

    // Additional validation for installment payments
    if (currentInvoice.paymentStatus === 'INSTALLMENT' && currentInvoice.installmentAmount) {
      const paymentAmount = parseFloat(paymentForm.amount)
      if (paymentAmount !== currentInvoice.installmentAmount && paymentAmount !== currentInvoice.remainingAmount) {
        const confirmPayment = window.confirm(
          `قيمة القسط المحددة هي ${currentInvoice.installmentAmount.toFixed(2)} ريال. \nهل تريد المتابعة بمبلغ ${paymentAmount.toFixed(2)} ريال؟`
        )
        if (!confirmPayment) {
          return
        }
      }
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
        // Don't manually add payment to list - fetchPayments will handle this
        
        // Fetch updated invoice data from the main invoice API to get correct payment calculations
        try {
          const invoiceResponse = await fetch(`${apiEndpoint}/${invoice.id}`)
          if (invoiceResponse.ok) {
            const invoiceData = await invoiceResponse.json()
            const updatedInvoice = invoiceData.invoice || invoiceData
            setCurrentInvoice(updatedInvoice)
            setForceUpdate(prev => prev + 1)
            // Also notify parent component with updated data
            onPaymentAdded(updatedInvoice)
          } else {
            // Fallback to the payment response data if invoice fetch fails
            setCurrentInvoice(data.invoice)
            setForceUpdate(prev => prev + 1)
            onPaymentAdded(data.invoice)
          }
        } catch (error) {
          console.error('Error fetching updated invoice:', error)
          // Fallback to the payment response data
          setCurrentInvoice(data.invoice)
          setForceUpdate(prev => prev + 1)
          onPaymentAdded(data.invoice)
        }
        
        // Refresh payments list to show the new payment
        await fetchPayments()
        
        setPaymentForm({ amount: '', paymentMethod: '', reference: '', notes: '' })
        setPaymentDialogOpen(false)
        
        // Force another update after a short delay to ensure UI is refreshed
        setTimeout(() => {
          setForceUpdate(prev => prev + 1)
        }, 100)
        
        const isInstallment = currentInvoice.installmentCount && currentInvoice.installmentCount > 0
        toast.success(isInstallment ? 'تم دفع القسط بنجاح' : 'تم إضافة الدفعة بنجاح')
      } else {
        const error = await response.json()
        const isInstallment = currentInvoice.installmentCount && currentInvoice.installmentCount > 0
        toast.error(error.error || (isInstallment ? 'فشل في دفع القسط' : 'فشل في إضافة الدفعة'))
      }
    } catch (error) {
      const isInstallment = currentInvoice.installmentCount && currentInvoice.installmentCount > 0
      toast.error(isInstallment ? 'حدث خطأ أثناء دفع القسط' : 'حدث خطأ أثناء إضافة الدفعة')
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
        console.log('Installment creation response:', data)
        
        // Update current invoice immediately with installment data
        const immediateUpdate = {
          ...currentInvoice,
          paymentStatus: 'INSTALLMENT',
          installmentCount: count,
          installmentsPaid: 0,
          installmentAmount: Math.ceil((currentInvoice.remainingAmount || currentInvoice.total) / count)
        }
        console.log('Immediate update:', immediateUpdate)
        setCurrentInvoice(immediateUpdate)
        setForceUpdate(prev => prev + 1)
        
        // Fetch updated invoice data from the main invoice API to get correct payment calculations
        try {
          const invoiceResponse = await fetch(`${apiEndpoint}/${invoice.id}`)
          if (invoiceResponse.ok) {
            const invoiceData = await invoiceResponse.json()
            const updatedInvoice = invoiceData.invoice || invoiceData
            console.log('Updated invoice after installment creation:', updatedInvoice)
            setCurrentInvoice(updatedInvoice)
            // Force update to ensure UI reflects changes
            setForceUpdate(prev => prev + 1)
            // Also notify parent component with updated data
            onPaymentAdded(updatedInvoice)
          } else {
            // Fallback to the installment response data if invoice fetch fails
            console.log('Fallback to installment response data:', data.invoice)
            if (data.invoice) {
              setCurrentInvoice(data.invoice)
              setForceUpdate(prev => prev + 1)
              onPaymentAdded(data.invoice)
            } else {
              // Use immediate update if no invoice data in response
              onPaymentAdded(immediateUpdate)
            }
          }
        } catch (error) {
          console.error('Error fetching updated invoice:', error)
          // Fallback to the installment response data
          console.log('Error fallback to installment response data:', data.invoice)
          if (data.invoice) {
            setCurrentInvoice(data.invoice)
            setForceUpdate(prev => prev + 1)
            onPaymentAdded(data.invoice)
          } else {
            // Use immediate update if no invoice data in response
            onPaymentAdded(immediateUpdate)
          }
        }
        
        // Refresh payments list in case installment setup affects payment display
        await fetchPayments()
        
        setInstallmentForm({ installmentCount: '', firstInstallmentDate: '' })
        setInstallmentDialogOpen(false)
        
        // Force another update after a short delay to ensure UI is refreshed
        setTimeout(() => {
          setForceUpdate(prev => prev + 1)
          console.log('Force update after timeout')
        }, 100)
        
        toast.success('تم إعداد خطة الأقساط بنجاح')
      } else {
        const error = await response.json()
        if (error.error === 'Installment plan already exists') {
          toast.error('خطة الأقساط موجودة بالفعل لهذه الفاتورة')
        } else {
          toast.error(error.error || 'فشل في إعداد خطة الأقساط')
        }
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
            <SaudiRiyal className="h-5 w-5" />
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
                  <SaudiRiyal className="h-4 w-4 text-white" />
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
          {(currentInvoice.paymentStatus === 'INSTALLMENT' || (currentInvoice.installmentCount && currentInvoice.installmentCount > 0)) && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-full">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900">خطة الأقساط</h3>
                  </div>
                  <div className="text-sm font-medium text-purple-600">
                    {currentInvoice.paymentStatus === 'INSTALLMENT' ? 'نشطة' : 'معدة'}
                  </div>
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
      {(() => {
        console.log('Button render check:', {
          installmentCount: currentInvoice.installmentCount,
          paymentStatus: currentInvoice.paymentStatus,
          remainingAmount: currentInvoice.remainingAmount,
          forceUpdate
        })
        return null
      })()}
      {currentInvoice.remainingAmount > 0 && currentInvoice.paymentStatus !== 'PAID' && (
        <div className="flex gap-2">
          {/* Payment Button - Show different text based on payment status */}
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={currentInvoice.remainingAmount <= 0}>
                <CreditCard className="h-4 w-4 mr-2" />
                {(currentInvoice.installmentCount && currentInvoice.installmentCount > 0) ? 'دفع قسط' : 'إضافة دفعة'}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {(currentInvoice.installmentCount && currentInvoice.installmentCount > 0) ? 'دفع قسط' : 'إضافة دفعة جديدة'}
              </DialogTitle>
              <DialogDescription>
                {(currentInvoice.installmentCount && currentInvoice.installmentCount > 0) ? 
                  'قم بدفع قسط من الفاتورة أو أي مبلغ آخر' : 
                  'أضف دفعة جديدة لهذه الفاتورة'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Installment Info */}
              {(currentInvoice.installmentCount && currentInvoice.installmentCount > 0) && (
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
                {loading ? 'جاري الإضافة...' : 
                  ((currentInvoice.installmentCount && currentInvoice.installmentCount > 0) ? 'دفع القسط' : 'إضافة الدفعة')
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {currentInvoice.paymentStatus !== 'INSTALLMENT' && currentInvoice.paymentStatus !== 'PAID' && !currentInvoice.installmentCount && (
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
