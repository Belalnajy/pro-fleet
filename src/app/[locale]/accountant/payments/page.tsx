"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  Calendar,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface Payment {
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
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  status: string
  createdAt: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  limit: number
}

export default function AccountantPaymentsPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [payments, setPayments] = useState<Payment[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showRecordDialog, setShowRecordDialog] = useState(false)
  const [recordingPayment, setRecordingPayment] = useState(false)

  // New payment form state
  const [newPayment, setNewPayment] = useState({
    invoiceId: "",
    amount: "",
    paymentMethod: "",
    referenceNumber: "",
    notes: ""
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchPayments()
    }
  }, [session, status, router, currentPage, searchTerm, dateFrom, dateTo])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      })

      const response = await fetch(`/api/accountant/payments?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }
      
      const data = await response.json()
      setPayments(data.payments)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل المدفوعات",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    try {
      setRecordingPayment(true)
      
      const response = await fetch('/api/accountant/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: newPayment.invoiceId,
          amount: parseFloat(newPayment.amount),
          paymentMethod: newPayment.paymentMethod,
          referenceNumber: newPayment.referenceNumber,
          notes: newPayment.notes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record payment')
      }

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح"
      })

      setShowRecordDialog(false)
      setNewPayment({
        invoiceId: "",
        amount: "",
        paymentMethod: "",
        referenceNumber: "",
        notes: ""
      })
      fetchPayments()
    } catch (error: any) {
      console.error('Error recording payment:', error)
      toast({
        title: "خطأ",
        description: error.message || "فشل في تسجيل الدفعة",
        variant: "destructive"
      })
    } finally {
      setRecordingPayment(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "تحويل بنكي":
        return "bg-blue-100 text-blue-800"
      case "نقدي":
        return "bg-green-100 text-green-800"
      case "شيك":
        return "bg-yellow-100 text-yellow-800"
      case "بطاقة ائتمان":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل المدفوعات...</p>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة المدفوعات</h1>
            <p className="text-gray-600">تتبع وإدارة جميع المدفوعات المستلمة</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  تسجيل دفعة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                  <DialogDescription>
                    قم بتسجيل دفعة جديدة لفاتورة موجودة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invoiceId">رقم الفاتورة</Label>
                    <Input
                      id="invoiceId"
                      placeholder="INV-2025-001"
                      value={newPayment.invoiceId}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, invoiceId: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">المبلغ</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                    <Select value={newPayment.paymentMethod} onValueChange={(value) => setNewPayment(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                        <SelectItem value="نقدي">نقدي</SelectItem>
                        <SelectItem value="شيك">شيك</SelectItem>
                        <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referenceNumber">رقم المرجع</Label>
                    <Input
                      id="referenceNumber"
                      placeholder="REF-123456"
                      value={newPayment.referenceNumber}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Textarea
                      id="notes"
                      placeholder="ملاحظات إضافية..."
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRecordPayment}
                      disabled={recordingPayment || !newPayment.invoiceId || !newPayment.amount || !newPayment.paymentMethod}
                      className="flex-1"
                    >
                      {recordingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      تسجيل الدفعة
                    </Button>
                    <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.totalCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المبلغ الإجمالي</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()} ريال
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">هذا الشهر</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(payment => {
                  const paymentDate = new Date(payment.paymentDate)
                  const now = new Date()
                  return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
                }).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.filter(payment => payment.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="البحث برقم الفاتورة، رقم الرحلة، أو اسم العميل..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="من تاريخ"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  placeholder="إلى تاريخ"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>المدفوعات</CardTitle>
            <CardDescription>
              {pagination && `عرض ${payments.length} من ${pagination.totalCount} مدفوعة`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>المسار</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>تاريخ الدفع</TableHead>
                    <TableHead>رقم المرجع</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{payment.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">
                            رحلة: {payment.tripNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.customer.name}</div>
                          <div className="text-sm text-gray-500">{payment.customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{payment.route.from}</div>
                          <div className="text-gray-500">إلى {payment.route.to}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {payment.amount.toLocaleString()} ريال
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                          {payment.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {payment.referenceNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          مكتملة
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  صفحة {pagination.currentPage} من {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    التالي
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
