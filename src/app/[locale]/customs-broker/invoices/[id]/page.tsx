"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useTranslation } from "@/hooks/useTranslation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Mail,
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  CreditCard
} from "lucide-react"
import { PaymentManagement } from "@/components/invoices/payment-management"

interface CustomsClearanceInvoiceDetails {
  id: string
  invoiceNumber: string
  clearanceId: string
  customsBrokerId: string
  customsFee: number
  additionalFees: number
  subtotal: number
  taxAmount: number
  total: number
  currency: string
  paymentStatus: string
  dueDate: string
  paidDate?: string
  // New payment tracking fields
  amountPaid: number
  remainingAmount: number
  installmentCount?: number
  installmentsPaid: number
  installmentAmount?: number
  nextInstallmentDate?: string
  payments?: any[]
  notes?: string
  createdAt: string
  updatedAt: string
  clearance?: {
    clearanceNumber: string
    status: string
    notes?: string
  }
}

export default function CustomsClearanceInvoiceDetailsPage({ params: pageParams }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(pageParams)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [invoice, setInvoice] = useState<CustomsClearanceInvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      router.push(`/${locale}/auth/signin`)
    } else if (id) {
      fetchInvoiceDetails()
    }
  }, [session, status, router, id])

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customs-broker/clearance-invoices/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details')
      }
      
      const data = await response.json()
      setInvoice(data)
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل تفاصيل الفاتورة",
        variant: "destructive"
      })
      router.push(`/${locale}/customs-broker/invoices`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setActionLoading("pdf")
      const response = await fetch(`/api/customs-broker/clearance-invoices/${id}/pdf`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `customs-invoice-${invoice?.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "نجح",
        description: "تم تحميل ملف PDF بنجاح"
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل ملف PDF",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PARTIAL":
        return "bg-orange-100 text-orange-800"
      case "INSTALLMENT":
      case "installment":
        return "bg-purple-100 text-purple-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      case "SENT":
        return "bg-blue-100 text-blue-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "PAID":
        return <CheckCircle className="h-4 w-4" />
      case "partial":
      case "PARTIAL":
        return <CreditCard className="h-4 w-4" />

      case "installment":
      case "INSTALLMENT":
        return <DollarSign className="h-4 w-4" />
      case "pending":
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "sent":
      case "SENT":
        return <Mail className="h-4 w-4" />
      case "overdue":
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4" />
      case "cancelled":
      case "CANCELLED":
        return <X className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': 'في الانتظار',
      'SENT': 'تم الإرسال',
      'PAID': 'مدفوعة',
      'PARTIAL': 'جزئي',
      'INSTALLMENT': 'أقساط',
      'OVERDUE': 'متأخرة',
      'CANCELLED': 'ملغية'
    }
    return statusMap[status] || status
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">الفاتورة غير موجودة</h3>
            <p className="text-gray-500">لم يتم العثور على الفاتورة المطلوبة</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/customs-broker/invoices`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden md:inline"> العودة للفواتير</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">فاتورة التخليص الجمركي</h1>
              <p className="text-muted-foreground">
                رقم الفاتورة: {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={actionLoading === "pdf"}
            >
              {actionLoading === "pdf" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              <span className="hidden md:inline">   تحميل PDF</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  تفاصيل الفاتورة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">رقم الفاتورة</label>
                    <p className="font-medium">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">رقم التخليص</label>
                    <p className="font-medium">{invoice.clearance?.clearanceNumber || 'غير محدد'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">حالة الدفع</label>
                    <Badge variant="secondary" className={getStatusColor(invoice.paymentStatus)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(invoice.paymentStatus)}
                        {getStatusText(invoice.paymentStatus)}
                      </div>
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">تاريخ الاستحقاق</label>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Financial Details */}
                <div className="space-y-3">
                  <h4 className="font-medium">التفاصيل المالية</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span>رسوم التخليص:</span>
                      <span className="font-medium">{formatCurrency(invoice.customsFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>رسوم إضافية:</span>
                      <span className="font-medium">{formatCurrency(invoice.additionalFees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ضريبة القيمة المضافة:</span>
                      <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>المبلغ الإجمالي:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>

                {invoice.notes && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">ملاحظات</label>
                      <p className="mt-1">{invoice.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  ملخص المدفوعات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>المبلغ الإجمالي:</span>
                    <span className="font-medium">{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المدفوع:</span>
                    <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المتبقي:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(invoice.remainingAmount)}</span>
                  </div>
                </div>

                {invoice.paymentStatus === 'INSTALLMENT' && invoice.installmentCount && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium">خطة الأقساط</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>عدد الأقساط:</span>
                          <span>{invoice.installmentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الأقساط المدفوعة:</span>
                          <span>{invoice.installmentsPaid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>قيمة القسط:</span>
                          <span>{formatCurrency(invoice.installmentAmount || 0)}</span>
                        </div>
                        {invoice.nextInstallmentDate && (
                          <div className="flex justify-between">
                            <span>القسط التالي:</span>
                            <span>{new Date(invoice.nextInstallmentDate).toLocaleDateString('ar-SA')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Management Section */}
        <div className="mt-6">
          <PaymentManagement
            invoice={{
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              total: invoice.total,
              amountPaid: invoice.amountPaid || 0,
              remainingAmount: invoice.remainingAmount || invoice.total,
              paymentStatus: invoice.paymentStatus,
              installmentCount: invoice.installmentCount,
              installmentsPaid: invoice.installmentsPaid || 0,
              installmentAmount: invoice.installmentAmount,
              nextInstallmentDate: invoice.nextInstallmentDate,
              payments: invoice.payments
            }}
            onPaymentAdded={(updatedInvoice) => {
              // Update the invoice state with new payment information
              setInvoice(prev => prev ? {
                ...prev,
                amountPaid: updatedInvoice.amountPaid,
                remainingAmount: updatedInvoice.remainingAmount,
                paymentStatus: updatedInvoice.paymentStatus,
                installmentsPaid: updatedInvoice.installmentsPaid,
                nextInstallmentDate: updatedInvoice.nextInstallmentDate,
                paidDate: updatedInvoice.paymentStatus === 'PAID' ? new Date().toISOString() : prev.paidDate
              } : null)
            }}
            apiEndpoint="/api/customs-broker/invoices"
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
