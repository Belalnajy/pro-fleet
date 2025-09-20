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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Download,
  Mail,
  Edit,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Truck,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2
} from "lucide-react"

interface InvoiceDetails {
  id: string
  invoiceNumber: string
  tripNumber: string
  customer: {
    id: string
    name: string
    email: string
    phone?: string
  }
  route: {
    from: string
    to: string
  }
  driver: string
  vehicle: {
    type: string
    capacity: number
  }
  customsBroker: string
  subtotal: number
  taxAmount: number
  customsFee: number
  total: number
  paymentStatus: string
  dueDate: string
  paidDate?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

export default function InvoiceDetailsPage({ params: pageParams }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(pageParams)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    subtotal: 0,
    taxAmount: 0,
    customsFee: 0,
    total: 0,
    paymentStatus: '',
    dueDate: '',
    notes: ''
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push(`/${locale}/auth/signin`)
    } else if (id) {
      fetchInvoiceDetails()
      
      // Check if edit mode is requested via query parameter
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('edit') === 'true') {
        setIsEditing(true)
      }
    }
  }, [session, status, router, id])

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/accountant/invoices/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details')
      }
      
      const data = await response.json()
      setInvoice(data)
      
      // Initialize edit form with current data
      setEditForm({
        subtotal: data.subtotal || 0,
        taxAmount: data.taxAmount || 0,
        customsFee: data.customsFee || 0,
        total: data.total || 0,
        paymentStatus: data.paymentStatus || '',
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
        notes: data.notes || ''
      })
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل تفاصيل الفاتورة",
        variant: "destructive"
      })
      router.push(`/${locale}/accountant/invoices`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      setActionLoading("email")
      const response = await fetch(`/api/accountant/invoices/${id}/send-email`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to send email')
      }
      
      toast({
        title: "تم الإرسال",
        description: "تم إرسال الفاتورة بالبريد الإلكتروني بنجاح"
      })
      
      fetchInvoiceDetails()
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "خطأ",
        description: "فشل في إرسال البريد الإلكتروني",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setActionLoading("download")
      
      const response = await fetch(`/api/accountant/invoices/${id}/pdf`)
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice-${invoice?.invoiceNumber || id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "تم التحميل",
        description: "تم تحميل الفاتورة بصيغة PDF بنجاح"
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "خطأ",
        description: t("downloadFailed"),
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveEdit = async () => {
    try {
      setActionLoading("save")
      
      const response = await fetch(`/api/accountant/invoices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update invoice')
      }
      
      toast({
        title: "تم الحفظ",
        description: "تم تحديث الفاتورة بنجاح"
      })
      
      setIsEditing(false)
      fetchInvoiceDetails()
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحديث الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset form to original values
    if (invoice) {
      setEditForm({
        subtotal: invoice.subtotal || 0,
        taxAmount: invoice.taxAmount || 0,
        customsFee: invoice.customsFee || 0,
        total: invoice.total || 0,
        paymentStatus: invoice.paymentStatus || '',
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
        notes: invoice.notes || ''
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "sent":
        return <Mail className="h-4 w-4" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />
      case "cancelled":
        return <X className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "مدفوعة"
      case "pending":
        return "في الانتظار"
      case "sent":
        return "مرسلة"
      case "overdue":
        return "متأخرة"
      case "cancelled":
        return "ملغية"
      default:
        return status
    }
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "ACCOUNTANT") {
    return null
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لم يتم العثور على الفاتورة</p>
            <Button onClick={() => router.push(`/${locale}/accountant/invoices`)} className="mt-4">
              العودة للفواتير
            </Button>
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
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/accountant/invoices`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <div>
              <h1 className="text-3xl font-bold">تفاصيل الفاتورة</h1>
              <p className="text-gray-600">{invoice.invoiceNumber}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={actionLoading === "save"}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={actionLoading === "save"}
                >
                  {actionLoading === "save" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  حفظ التغييرات
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  disabled={!!actionLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={actionLoading === "download"}
                >
                  {actionLoading === "download" ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  تحميل PDF
                </Button>
                
                {invoice.paymentStatus === "PENDING" && (
                  <Button
                    onClick={handleSendEmail}
                    disabled={actionLoading === "email"}
                  >
                    {actionLoading === "email" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    إرسال بالبريد
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    معلومات الفاتورة
                  </CardTitle>
                  <Badge className={getStatusColor(invoice.paymentStatus)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(invoice.paymentStatus)}
                      <span>{getStatusText(invoice.paymentStatus)}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("invoiceNumber")}</p>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("tripNumber")}</p>
                    <p className="font-semibold">{invoice.tripNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("createdAt")}</p>
                    <p className="font-semibold">
                      {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("dueDate")}</p>
                    <p className="font-semibold">
                      {new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  {invoice.paidDate && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">{t("paidDate")}</p>
                        <p className="font-semibold text-green-600">
                          {new Date(invoice.paidDate).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer & Trip Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  معلومات العميل والرحلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">العميل</h4>
                    <div className="space-y-2">
                      <p className="font-medium">{invoice.customer.name}</p>
                      <p className="text-sm text-gray-600">{invoice.customer.email}</p>
                      {invoice.customer.phone && (
                        <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">تفاصيل الرحلة</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{t("from")}: {invoice.route.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{t("to")}: {invoice.route.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">
                          {invoice.vehicle.type} - {invoice.vehicle.capacity} {t("ton")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{t("driver")}: {invoice.driver}</p>
                      <p className="text-sm text-gray-600">{t("customsBroker")}: {invoice.customsBroker}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  الملخص المالي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("subtotal")}</span>
                    <span className="font-medium">
                      {invoice.subtotal.toLocaleString()} ريال
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("taxAmount")} (15%)</span>
                    <span className="font-medium">
                      {invoice.taxAmount.toLocaleString()} ريال
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("customsFee")}</span>
                    <span className="font-medium">
                      {invoice.customsFee?.toLocaleString() || '0'} ريال
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t("total")}</span>
                    <span className="text-primary">
                      {invoice.total?.toLocaleString() || '0'} ريال
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            {isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    تعديل الفاتورة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="subtotal">{t("subtotal")}</Label>
                      <Input
                        id="subtotal"
                        type="number"
                        step="0.01"
                        value={editForm.subtotal}
                        onChange={(e) => setEditForm(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="taxAmount">{t("taxAmount")}</Label>
                      <Input
                        id="taxAmount"
                        type="number"
                        step="0.01"
                        value={editForm.taxAmount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customsFee">{t("customsFee")}</Label>
                      <Input
                        id="customsFee"
                        type="number"
                        step="0.01"
                        value={editForm.customsFee}
                        onChange={(e) => setEditForm(prev => ({ ...prev, customsFee: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="total">{t("total")}</Label>
                      <Input
                        id="total"
                        type="number"
                        step="0.01"
                        value={editForm.total}
                        onChange={(e) => setEditForm(prev => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentStatus">{t("paymentStatus")}</Label>
                      <Select
                        value={editForm.paymentStatus}
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, paymentStatus: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة الدفع" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">{t("PENDING")}</SelectItem>
                          <SelectItem value="SENT">{t("SENT")}</SelectItem>
                          <SelectItem value="PAID">{t("PAID")}</SelectItem>
                          <SelectItem value="OVERDUE">{t("OVERDUE")}</SelectItem>
                          <SelectItem value="CANCELLED">{t("CANCELLED")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dueDate">{t("dueDate")}</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">{t("notes")}</Label>
                      <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="أدخل ملاحظات إضافية..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
