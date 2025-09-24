"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  ChevronRight,
  Eye,
  FileText,
  Clock,
  AlertCircle,
  Banknote
} from "lucide-react"

interface Payment {
  id: string
  invoiceNumber: string
  invoiceType: 'REGULAR' | 'CLEARANCE'
  tripNumber: string
  route: {
    from: string
    to: string
  }
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  notes?: string
  status: string
  total: number
  remainingAmount: number
  customsBroker?: {
    name: string
  }
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  limit: number
}

export default function CustomerPaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'REGULAR' | 'CLEARANCE'>('all')
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: 10
  })
  const [stats, setStats] = useState({
    totalPayments: 0,
    totalAmount: 0,
    paidInvoices: 0,
    pendingAmount: 0
  })
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
      return
    }

    fetchPayments()
  }, [session, status, router, locale, pagination.currentPage, searchTerm, filterType, filterMethod, filterStatus])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        invoiceType: filterType === 'all' ? '' : filterType,
        paymentMethod: filterMethod === 'all' ? '' : filterMethod,
        status: filterStatus === 'all' ? '' : filterStatus
      })

      const response = await fetch(`/api/customer/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setPagination(data.pagination || pagination)
        setStats(data.stats || stats)
      } else {
        toast({
          title: "خطأ",
          description: "فشل في جلب المدفوعات",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب المدفوعات",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setPaymentDetailsOpen(true)
  }

  const handleRecordPayment = () => {
    router.push(`/${locale}/customer/payments/record`)
  }

  const handleFilterChange = (type: string, value: string) => {
    switch (type) {
      case 'invoiceType':
        setFilterType(value as 'all' | 'REGULAR' | 'CLEARANCE')
        break
      case 'paymentMethod':
        setFilterMethod(value)
        break
      case 'status':
        setFilterStatus(value)
        break
    }
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { variant: "default" as const, label: "مدفوع", icon: CheckCircle },
      PARTIAL: { variant: "secondary" as const, label: "مدفوع جزئياً", icon: Clock },
      PENDING: { variant: "outline" as const, label: "معلق", icon: AlertCircle },
      SENT: { variant: "outline" as const, label: "مرسل", icon: FileText },
      INSTALLMENT: { variant: "secondary" as const, label: "أقساط", icon: Calendar },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getInvoiceTypeBadge = (type: string) => {
    if (type === 'CLEARANCE') {
      return <Badge variant="secondary">تخليص جمركي</Badge>
    }
    return <Badge variant="outline">فاتورة عادية</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA')
  }

  const exportPayments = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        invoiceType: filterType === 'all' ? '' : filterType,
        paymentMethod: filterMethod === 'all' ? '' : filterMethod,
        status: filterStatus === 'all' ? '' : filterStatus,
        export: 'true'
      })

      const response = await fetch(`/api/customer/payments/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `customer-payments-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "نجح التصدير",
          description: "تم تصدير المدفوعات بنجاح",
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير المدفوعات",
        variant: "destructive",
      })
    }
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout title="المدفوعات" subtitle="إدارة مدفوعاتك">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="المدفوعات" 
      subtitle="إدارة مدفوعاتك وتتبع حالة الفواتير"
      actions={
        <div className="flex gap-2">
          <Button onClick={exportPayments} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            تصدير
          </Button>
          <Button onClick={() => router.push(`/${locale}/customer/payments/record`)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            تسجيل دفعة
          </Button>
        </div>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
            <p className="text-xs text-muted-foreground">دفعة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبلغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">المبلغ الإجمالي</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المدفوع</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">مدفوع</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ المعلق</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">معلق</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الفاتورة أو الرحلة..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={(value) => handleFilterChange('invoiceType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="نوع الفاتورة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="REGULAR">فاتورة عادية</SelectItem>
                <SelectItem value="CLEARANCE">تخليص جمركي</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطرق</SelectItem>
                <SelectItem value="cash">نقداً</SelectItem>
                <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                <SelectItem value="check">شيك</SelectItem>
                <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="PAID">مدفوع</SelectItem>
                <SelectItem value="PARTIAL">مدفوع جزئياً</SelectItem>
                <SelectItem value="PENDING">معلق</SelectItem>
                <SelectItem value="SENT">مرسل</SelectItem>
                <SelectItem value="INSTALLMENT">أقساط</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchPayments} variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              تطبيق
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>المدفوعات ({pagination.totalCount})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>نوع الفاتورة</TableHead>
                  <TableHead>رقم الرحلة</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>تاريخ الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">لا توجد مدفوعات</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {getInvoiceTypeBadge(payment.invoiceType)}
                      </TableCell>
                      <TableCell>{payment.tripNumber}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.route.from} ← {payment.route.to}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.paymentMethod === 'cash' && 'نقداً'}
                          {payment.paymentMethod === 'bank_transfer' && 'تحويل بنكي'}
                          {payment.paymentMethod === 'check' && 'شيك'}
                          {payment.paymentMethod === 'credit_card' && 'بطاقة ائتمان'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                عرض {((pagination.currentPage - 1) * pagination.limit) + 1} إلى {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} من {pagination.totalCount} مدفوعة
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
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

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={paymentDetailsOpen} onOpenChange={setPaymentDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل الدفعة</DialogTitle>
              <DialogDescription>
                تفاصيل الدفعة رقم {selectedPayment.reference || selectedPayment.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">رقم الفاتورة</Label>
                  <p className="text-sm font-medium">{selectedPayment.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">نوع الفاتورة</Label>
                  <div className="mt-1">{getInvoiceTypeBadge(selectedPayment.invoiceType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">رقم الرحلة</Label>
                  <p className="text-sm font-medium">{selectedPayment.tripNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">المسار</Label>
                  <p className="text-sm">{selectedPayment.route.from} ← {selectedPayment.route.to}</p>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">المبلغ المدفوع</Label>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">طريقة الدفع</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {selectedPayment.paymentMethod === 'cash' && 'نقداً'}
                      {selectedPayment.paymentMethod === 'bank_transfer' && 'تحويل بنكي'}
                      {selectedPayment.paymentMethod === 'check' && 'شيك'}
                      {selectedPayment.paymentMethod === 'credit_card' && 'بطاقة ائتمان'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">تاريخ الدفع</Label>
                  <p className="text-sm">{formatDate(selectedPayment.paymentDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">حالة الفاتورة</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>

              {selectedPayment.reference && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">رقم المرجع</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{selectedPayment.reference}</p>
                </div>
              )}

              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ملاحظات</Label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedPayment.notes}</p>
                </div>
              )}

              {/* Invoice Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">ملخص الفاتورة</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>إجمالي الفاتورة:</span>
                    <span className="font-medium">{formatCurrency(selectedPayment.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ المتبقي:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(selectedPayment.remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setPaymentDetailsOpen(false)}>
                إغلاق
              </Button>
              {selectedPayment.remainingAmount > 0 && (
                <Button onClick={handleRecordPayment}>
                  <Plus className="h-4 w-4 mr-2" />
                  تسجيل دفعة أخرى
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
