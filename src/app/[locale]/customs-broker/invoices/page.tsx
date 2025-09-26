"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { useTranslation } from "@/hooks/useTranslation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  SaudiRiyal,
  CreditCard
} from "lucide-react"
import { PaymentManagement } from "@/components/invoices/payment-management"

interface CustomsClearanceInvoice {
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

export default function CustomsBrokerInvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { locale } = use(params)
  const { t, language } = useTranslation()
  
  const [invoices, setInvoices] = useState<CustomsClearanceInvoice[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})
  const [selectedInvoice, setSelectedInvoice] = useState<CustomsClearanceInvoice | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchInvoices()
    }
  }, [session, status, router, currentPage, statusFilter, searchTerm])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/customs-broker/clearance-invoices?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await response.json()
      setInvoices(data.invoices || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل فواتير التخليص الجمركي",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/${locale}/customs-broker/invoices/${invoiceId}`)
  }

  const handleManagePayments = (invoice: CustomsClearanceInvoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "paid":
        return "bg-green-100 text-green-800"
      case "PARTIAL":
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "INSTALLMENT":
      case "installment":
        return "bg-purple-100 text-purple-800"
      case "PENDING":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
      case "overdue":
        return "bg-red-100 text-red-800"
      case "SENT":
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "CANCELLED":
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-3 w-3" />
      case "partial":
        return <CreditCard className="h-3 w-3" />
      case "installment":
        return <SaudiRiyal className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "sent":
        return <Mail className="h-3 w-3" />
      case "overdue":
        return <AlertTriangle className="h-3 w-3" />
      case "cancelled":
        return <X className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getStatusText = (status: string) => {
    const statusTranslations: Record<string, Record<string, string>> = {
      'ar': {
        'PENDING': 'في الانتظار',
        'SENT': 'تم الإرسال',
        'PAID': 'مدفوعة',
        'PARTIAL': 'جزئي',
        'INSTALLMENT': 'أقساط',
        'OVERDUE': 'متأخرة',
        'CANCELLED': 'ملغية'
      },
      'en': {
        'PENDING': 'Pending',
        'SENT': 'Sent',
        'PAID': 'Paid',
        'PARTIAL': 'Partial',
        'INSTALLMENT': 'Installment',
        'OVERDUE': 'Overdue',
        'CANCELLED': 'Cancelled'
      },
      'ur': {
        'PENDING': 'زیر التواء',
        'SENT': 'بھیج دیا گیا',
        'PAID': 'ادا شدہ',
        'PARTIAL': 'جزوی',
        'INSTALLMENT': 'قسطیں',
        'OVERDUE': 'تاخیر شدہ',
        'CANCELLED': 'منسوخ شدہ'
      }
    }
    
    const currentLang = language || 'ar'
    return statusTranslations[currentLang]?.[status.toUpperCase()] || status
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">فواتير التخليص الجمركي</h1>
            <p className="text-muted-foreground">
              إدارة فواتير خدمات التخليص الجمركي والمدفوعات
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              فواتير التخليص الجمركي
            </CardTitle>
            <CardDescription>
              عرض وإدارة فواتير خدمات التخليص الجمركي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث برقم الفاتورة أو رقم التخليص..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">في الانتظار</SelectItem>
                  <SelectItem value="SENT">تم الإرسال</SelectItem>
                  <SelectItem value="PAID">مدفوعة</SelectItem>
                  <SelectItem value="PARTIAL">جزئي</SelectItem>
                  <SelectItem value="INSTALLMENT">أقساط</SelectItem>
                  <SelectItem value="OVERDUE">متأخرة</SelectItem>
                  <SelectItem value="CANCELLED">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Invoices Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>رقم التخليص</TableHead>
                    <TableHead>رسوم التخليص</TableHead>
                    <TableHead>رسوم إضافية</TableHead>
                    <TableHead>المبلغ الإجمالي</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">لا توجد فواتير متاحة</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.clearance?.clearanceNumber || 'غير محدد'}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.customsFee)}</TableCell>
                        <TableCell>{formatCurrency(invoice.additionalFees)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.total)}
                          {(invoice.paymentStatus === 'PARTIAL' || invoice.paymentStatus === 'INSTALLMENT') && (
                            <div className="text-xs text-muted-foreground">
                              مدفوع: {formatCurrency(invoice.amountPaid)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(invoice.paymentStatus)}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(invoice.paymentStatus)}
                              {getStatusText(invoice.paymentStatus)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewInvoice(invoice.id)}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManagePayments(invoice)}
                              title="إدارة المدفوعات"
                            >
                              <SaudiRiyal className="h-4 w-4" />
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

        {/* Payment Management Dialog */}
        {selectedInvoice && showPaymentDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">إدارة مدفوعات الفاتورة {selectedInvoice.invoiceNumber}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <PaymentManagement
                invoice={{
                  id: selectedInvoice.id,
                  invoiceNumber: selectedInvoice.invoiceNumber,
                  total: selectedInvoice.total,
                  amountPaid: selectedInvoice.amountPaid || 0,
                  remainingAmount: selectedInvoice.remainingAmount || selectedInvoice.total,
                  paymentStatus: selectedInvoice.paymentStatus,
                  installmentCount: selectedInvoice.installmentCount,
                  installmentsPaid: selectedInvoice.installmentsPaid || 0,
                  installmentAmount: selectedInvoice.installmentAmount,
                  nextInstallmentDate: selectedInvoice.nextInstallmentDate,
                  payments: selectedInvoice.payments
                }}
                onPaymentAdded={(updatedInvoice) => {
                  // Update the invoice in the list
                  setInvoices(prev => prev.map(inv => 
                    inv.id === selectedInvoice.id 
                      ? {
                          ...inv,
                          amountPaid: updatedInvoice.amountPaid,
                          remainingAmount: updatedInvoice.remainingAmount,
                          paymentStatus: updatedInvoice.paymentStatus,
                          installmentsPaid: updatedInvoice.installmentsPaid,
                          nextInstallmentDate: updatedInvoice.nextInstallmentDate,
                          paidDate: updatedInvoice.paymentStatus === 'PAID' ? new Date().toISOString() : inv.paidDate
                        }
                      : inv
                  ))
                  // Update selected invoice
                  setSelectedInvoice(prev => prev ? {
                    ...prev,
                    amountPaid: updatedInvoice.amountPaid,
                    remainingAmount: updatedInvoice.remainingAmount,
                    paymentStatus: updatedInvoice.paymentStatus,
                    installmentsPaid: updatedInvoice.installmentsPaid,
                    nextInstallmentDate: updatedInvoice.nextInstallmentDate
                  } : null)
                }}
                apiEndpoint="/api/customs-broker/invoices"
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
