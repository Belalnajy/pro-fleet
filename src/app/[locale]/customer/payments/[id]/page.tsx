"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Calendar,
  SaudiRiyal,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  MapPin,
  Truck,
  Receipt,
  Loader2,
  Download,
  Printer
} from "lucide-react"

interface PaymentDetails {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  notes?: string
  status: string
  createdAt: string
  invoice: {
    id: string
    invoiceNumber: string
    invoiceType: 'REGULAR' | 'CLEARANCE'
    tripNumber: string
    total: number
    paidAmount: number
    remainingAmount: number
    paymentStatus: string
    dueDate: string
    route: {
      from: string
      to: string
    }
    customer: {
      name: string
      email: string
      phone?: string
    }
    customsBroker?: {
      name: string
      email: string
      phone?: string
    }
  }
}

export default function PaymentDetailsPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const { locale, id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
      return
    }

    fetchPaymentDetails()
  }, [session, status, router, locale, id])

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/payments/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setPayment(data)
      } else if (response.status === 404) {
        toast({
          title: "الدفعة غير موجودة",
          description: "لم يتم العثور على الدفعة المطلوبة",
          variant: "destructive",
        })
        router.push(`/${locale}/customer/payments`)
      } else {
        toast({
          title: "خطأ",
          description: "فشل في جلب تفاصيل الدفعة",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payment details:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب تفاصيل الدفعة",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadReceipt = async () => {
    try {
      const response = await fetch(`/api/customer/payments/${id}/receipt`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `payment-receipt-${payment?.invoice.invoiceNumber}-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "تم التحميل",
          description: "تم تحميل إيصال الدفع بنجاح",
        })
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل إيصال الدفع",
        variant: "destructive",
      })
    }
  }

  const printReceipt = () => {
    window.print()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    console.log('Payment Status in [id] page:', status) // للتشخيص
    const statusConfig = {
      PAID: { variant: "default" as const, label: "مدفوعة", icon: CheckCircle },
      PARTIAL: { variant: "secondary" as const, label: "مدفوعة جزئياً", icon: Clock },
      PENDING: { variant: "outline" as const, label: "في الانتظار", icon: AlertCircle },
      SENT: { variant: "outline" as const, label: "مرسل", icon: FileText },
      INSTALLMENT: { variant: "secondary" as const, label: "نظام أقساط", icon: Calendar },
      OVERDUE: { variant: "destructive" as const, label: "متأخرة", icon: AlertCircle },
      CANCELLED: { variant: "destructive" as const, label: "ملغية", icon: AlertCircle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: "secondary" as const, 
      label: status || "غير محدد", 
      icon: AlertCircle 
    }
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'نقداً',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك',
      credit_card: 'بطاقة ائتمان'
    }
    return methods[method as keyof typeof methods] || method
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout title="تفاصيل الدفعة" subtitle="عرض تفاصيل الدفعة">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!payment) {
    return (
      <DashboardLayout title="تفاصيل الدفعة" subtitle="عرض تفاصيل الدفعة">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">الدفعة غير موجودة</h3>
          <p className="text-muted-foreground mb-4">لم يتم العثور على الدفعة المطلوبة</p>
          <Button onClick={() => router.push(`/${locale}/customer/payments`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للمدفوعات
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="تفاصيل الدفعة" 
      subtitle={`دفعة رقم ${payment.id.slice(-8)}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadReceipt}>
            <Download className="h-4 w-4 mr-2" />
            تحميل الإيصال
          </Button>
          <Button variant="outline" size="sm" onClick={printReceipt}>
            <Printer className="h-4 w-4 mr-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={() => router.push(`/${locale}/customer/payments`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              ملخص الدفعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(payment.amount)}
                </div>
                <div className="text-sm text-muted-foreground">المبلغ المدفوع</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold mb-2">
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </div>
                <div className="text-sm text-muted-foreground">طريقة الدفع</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium mb-2">
                  {formatDate(payment.paymentDate)}
                </div>
                <div className="text-sm text-muted-foreground">تاريخ الدفع</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              تفاصيل الدفعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">رقم الدفعة</div>
                <div className="font-mono">{payment.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">حالة الدفعة</div>
                <div>{getStatusBadge(payment.status)}</div>
              </div>
              {payment.reference && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">رقم المرجع</div>
                  <div className="font-mono">{payment.reference}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">تاريخ الإنشاء</div>
                <div>{formatDateTime(payment.createdAt)}</div>
              </div>
            </div>
            {payment.notes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">ملاحظات</div>
                <div className="bg-muted p-3 rounded-lg">{payment.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل الفاتورة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">رقم الفاتورة</div>
                <div className="font-semibold text-lg">{payment.invoice.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">نوع الفاتورة</div>
                <div>
                  <Badge variant={payment.invoice.invoiceType === 'CLEARANCE' ? 'secondary' : 'outline'}>
                    {payment.invoice.invoiceType === 'CLEARANCE' ? 'تخليص جمركي' : 'فاتورة عادية'}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">رقم الرحلة</div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  {payment.invoice.tripNumber}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">حالة الدفع</div>
                <div>{getStatusBadge(payment.invoice.paymentStatus)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">المسار</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {payment.invoice.route.from} ← {payment.invoice.route.to}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">تاريخ الاستحقاق</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(payment.invoice.dueDate)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold mb-1">{formatCurrency(payment.invoice.total)}</div>
                <div className="text-sm text-muted-foreground">المبلغ الإجمالي</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(payment.invoice.paidAmount)}</div>
                <div className="text-sm text-muted-foreground">المبلغ المدفوع</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">{formatCurrency(payment.invoice.remainingAmount)}</div>
                <div className="text-sm text-muted-foreground">المبلغ المتبقي</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Broker Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">الاسم</div>
                <div className="font-medium">{payment.invoice.customer.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">البريد الإلكتروني</div>
                <div className="text-sm">{payment.invoice.customer.email}</div>
              </div>
              {payment.invoice.customer.phone && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">الهاتف</div>
                  <div className="text-sm">{payment.invoice.customer.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customs Broker Info */}
          {payment.invoice.customsBroker && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  المخلص الجمركي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">الاسم</div>
                  <div className="font-medium">{payment.invoice.customsBroker.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">البريد الإلكتروني</div>
                  <div className="text-sm">{payment.invoice.customsBroker.email}</div>
                </div>
                {payment.invoice.customsBroker.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">الهاتف</div>
                    <div className="text-sm">{payment.invoice.customsBroker.phone}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => router.push(`/${locale}/customer/invoices`)}>
                <FileText className="h-4 w-4 mr-2" />
                عرض الفواتير
              </Button>
              <Button variant="outline" onClick={() => router.push(`/${locale}/customer/payments`)}>
                <CreditCard className="h-4 w-4 mr-2" />
                عرض جميع المدفوعات
              </Button>
              <Button variant="outline" onClick={() => router.push(`/${locale}/customer/payments/record?invoiceId=${payment.invoice.id}`)}>
                <SaudiRiyal className="h-4 w-4 mr-2" />
                إضافة دفعة أخرى
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
