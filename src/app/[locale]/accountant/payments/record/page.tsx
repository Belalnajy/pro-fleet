"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  ArrowLeft,
  Search,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  customer: {
    name: string
    email: string
  }
  total: number
  paymentStatus: string
  dueDate: string
}

export default function RecordPaymentPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [searchingInvoice, setSearchingInvoice] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceSearch, setInvoiceSearch] = useState("")
  
  const [paymentData, setPaymentData] = useState({
    invoiceId: searchParams.get('invoiceId') || "",
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ""
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push(`/${locale}/auth/signin`)
    } else if (paymentData.invoiceId) {
      searchInvoice(paymentData.invoiceId)
    }
  }, [session, status, router])

  const searchInvoice = async (invoiceNumber: string) => {
    if (!invoiceNumber.trim()) return
    
    try {
      setSearchingInvoice(true)
      
      // Simulate API call to search invoice
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock invoice data
      const mockInvoice: Invoice = {
        id: "inv_" + Date.now(),
        invoiceNumber: invoiceNumber,
        customer: {
          name: "شركة النقل المتقدم",
          email: "info@transport.com"
        },
        total: 5500,
        paymentStatus: "PENDING",
        dueDate: "2025-01-15"
      }
      
      setSelectedInvoice(mockInvoice)
      setPaymentData(prev => ({
        ...prev,
        invoiceId: mockInvoice.id,
        amount: mockInvoice.total.toString()
      }))
      
    } catch (error) {
      console.error('Error searching invoice:', error)
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الفاتورة",
        variant: "destructive"
      })
      setSelectedInvoice(null)
    } finally {
      setSearchingInvoice(false)
    }
  }

  const handleRecordPayment = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/accountant/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: paymentData.invoiceId,
          amount: parseFloat(paymentData.amount),
          paymentMethod: paymentData.paymentMethod,
          referenceNumber: paymentData.referenceNumber,
          paymentDate: paymentData.paymentDate,
          notes: paymentData.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record payment')
      }

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push("/accountant/payments")}>
            عرض المدفوعات
          </Button>
        )
      })

      // Reset form
      setPaymentData({
        invoiceId: "",
        amount: "",
        paymentMethod: "",
        referenceNumber: "",
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ""
      })
      setSelectedInvoice(null)
      setInvoiceSearch("")
      
    } catch (error: any) {
      console.error('Error recording payment:', error)
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل الدفعة",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return (
      selectedInvoice &&
      paymentData.amount &&
      paymentData.paymentMethod &&
      paymentData.paymentDate &&
      parseFloat(paymentData.amount) > 0
    )
  }

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "ACCOUNTANT") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/accountant/payments")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold">تسجيل دفعة جديدة</h1>
            <p className="text-gray-600">قم بتسجيل دفعة جديدة لفاتورة موجودة</p>
          </div>
        </div>

        {/* Invoice Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث عن الفاتورة
            </CardTitle>
            <CardDescription>
              ابحث عن الفاتورة باستخدام رقم الفاتورة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="رقم الفاتورة (مثال: INV-2025-001)"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchInvoice(invoiceSearch)}
              />
              <Button 
                onClick={() => searchInvoice(invoiceSearch)}
                disabled={searchingInvoice || !invoiceSearch.trim()}
              >
                {searchingInvoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {selectedInvoice && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">{selectedInvoice.invoiceNumber}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        العميل: {selectedInvoice.customer.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        تاريخ الاستحقاق: {new Date(selectedInvoice.dueDate).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {selectedInvoice.total.toLocaleString()} ريال
                      </p>
                      <p className="text-sm text-gray-500">المبلغ المستحق</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        {selectedInvoice && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                تفاصيل الدفعة
              </CardTitle>
              <CardDescription>
                أدخل تفاصيل الدفعة المستلمة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ المدفوع *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
                  <Select 
                    value={paymentData.paymentMethod} 
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="check">شيك</SelectItem>
                      <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                      <SelectItem value="online">دفع إلكتروني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDate">تاريخ الدفع *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">رقم المرجع</Label>
                  <Input
                    id="referenceNumber"
                    placeholder="REF-123456"
                    value={paymentData.referenceNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  placeholder="ملاحظات إضافية حول الدفعة..."
                  rows={3}
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleRecordPayment}
                  disabled={loading || !isFormValid()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      تسجيل الدفعة
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentData({
                      invoiceId: "",
                      amount: "",
                      paymentMethod: "",
                      referenceNumber: "",
                      paymentDate: new Date().toISOString().split('T')[0],
                      notes: ""
                    })
                    setSelectedInvoice(null)
                    setInvoiceSearch("")
                  }}
                >
                  إعادة تعيين
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900">نصائح لتسجيل الدفعات</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• تأكد من صحة رقم الفاتورة قبل التسجيل</li>
                  <li>• أدخل المبلغ الصحيح المستلم من العميل</li>
                  <li>• احتفظ برقم المرجع للمتابعة المستقبلية</li>
                  <li>• يمكنك تسجيل دفعات جزئية للفواتير الكبيرة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
