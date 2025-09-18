"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
  Trash2
} from "lucide-react"

interface Invoice {
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
  trip?: {
    customer?: {
      name?: string
    }
    fromCity?: {
      name?: string
    }
    toCity?: {
      name?: string
    }
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

export default function AccountantInvoicesPage({ params }: { params: { locale: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const locale = params.locale
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push("/auth/signin")
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

      const response = await fetch(`/api/accountant/invoices?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await response.json()
      setInvoices(data.invoices)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل الفواتير",
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

  // Handle viewing invoice details
  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/${locale}/accountant/invoices/${invoiceId}`)
  }

  // Handle PDF download
  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    const loadingKey = `pdf-${invoiceId}`
    try {
      setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
      
      toast({
        title: "جاري التحميل...",
        description: "يتم إنشاء ملف PDF للفاتورة"
      })
      
      const response = await fetch(`/api/accountant/invoices/${invoiceId}/pdf`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      // Create blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "تم بنجاح",
        description: `تم تحميل فاتورة ${invoiceNumber} بصيغة PDF`
      })
      
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Handle sending email
  const handleSendEmail = async (invoiceId: string, customerEmail: string) => {
    const loadingKey = `email-${invoiceId}`
    try {
      setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
      
      toast({
        title: "جاري الإرسال...",
        description: "يتم إرسال الفاتورة بالبريد الإلكتروني"
      })
      
      const response = await fetch(`/api/accountant/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: customerEmail
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send email')
      }
      
      const result = await response.json()
      
      toast({
        title: "تم بنجاح",
        description: result.message || `تم إرسال الفاتورة إلى ${customerEmail}`
      })
      
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "خطأ",
        description: "فشل في إرسال الفاتورة بالبريد الإلكتروني",
        variant: "destructive"
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Handle editing invoice
  const handleEditInvoice = (invoiceId: string) => {
    // Navigate to invoice details page in edit mode
    router.push(`/${locale}/accountant/invoices/${invoiceId}?edit=true`)
  }

  // Handle deleting invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')
    
    if (!confirmDelete) return
    
    const loadingKey = `delete-${invoiceId}`
    try {
      setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
      
      const response = await fetch(`/api/accountant/invoices/${invoiceId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }
      
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفاتورة بنجاح"
      })
      
      // Refresh the invoices list
      fetchInvoices()
      
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "خطأ",
        description: "فشل في حذف الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
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
        return <CheckCircle className="h-3 w-3" />
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

  const handleExportInvoices = async () => {
    setExportLoading(true)
    try {
      // Create CSV content
      const csvHeaders = [
        'رقم الفاتورة',
        'العميل',
        'المسار',
        'المبلغ الإجمالي',
        'حالة الدفع',
        'تاريخ الإنشاء',
        'تاريخ الاستحقاق'
      ].join(',')
      
      const csvRows = invoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.trip?.customer?.name || 'غير محدد',
        `${invoice.trip?.fromCity?.name || ''} - ${invoice.trip?.toCity?.name || ''}`,
        `${invoice.total} ريال`,
        getStatusText(invoice.paymentStatus),
        new Date(invoice.createdAt).toLocaleDateString('ar-SA'),
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SA') : 'غير محدد'
      ].join(','))
      
      const csvContent = [csvHeaders, ...csvRows].join('\n')
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `invoices-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير الفواتير إلى ملف CSV",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير الفواتير",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل الفواتير...</p>
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
            <h1 className="text-3xl font-bold">إدارة الفواتير</h1>
            <p className="text-gray-600">مراقبة وإدارة جميع الفواتير والمدفوعات</p>
          </div>
          <Button onClick={handleExportInvoices} disabled={exportLoading}>
            {exportLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {exportLoading ? "جاري التصدير..." : "تصدير التقرير"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.totalCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.paymentStatus === 'PENDING').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مدفوعة</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.paymentStatus === 'PAID').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متأخرة</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => {
                  const dueDate = new Date(inv.dueDate)
                  const now = new Date()
                  return (inv.paymentStatus === 'PENDING' || inv.paymentStatus === 'SENT') && dueDate < now
                }).length}
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
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">في الانتظار</SelectItem>
                  <SelectItem value="SENT">مرسلة</SelectItem>
                  <SelectItem value="PAID">مدفوعة</SelectItem>
                  <SelectItem value="OVERDUE">متأخرة</SelectItem>
                  <SelectItem value="CANCELLED">ملغية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>الفواتير</CardTitle>
            <CardDescription>
              {pagination && `عرض ${invoices.length} من ${pagination.totalCount} فاتورة`}
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
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">
                            رحلة: {invoice.tripNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customer.name}</div>
                          <div className="text-sm text-gray-500">{invoice.customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{invoice.route.from}</div>
                          <div className="text-gray-500">إلى {invoice.route.to}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {invoice.total?.toLocaleString() || '0'} ريال
                        </div>
                        <div className="text-sm text-gray-500">
                          ضريبة: {invoice.taxAmount?.toLocaleString() || '0'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.paymentStatus)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(invoice.paymentStatus)}
                            <span>{getStatusText(invoice.paymentStatus)}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
                        </div>
                        {invoice.paidDate && (
                          <div className="text-sm text-green-600">
                            دُفعت: {new Date(invoice.paidDate).toLocaleDateString('ar-SA')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewInvoice(invoice.id)}
                            title="عرض الفاتورة"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                            disabled={actionLoading[`pdf-${invoice.id}`]}
                            title="تحميل PDF"
                          >
                            {actionLoading[`pdf-${invoice.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          {invoice.paymentStatus === 'PENDING' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendEmail(invoice.id, invoice.customer.email)}
                              disabled={actionLoading[`email-${invoice.id}`]}
                              title="إرسال بالبريد الإلكتروني"
                            >
                              {actionLoading[`email-${invoice.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" title="المزيد">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                تعديل الفاتورة
                              </DropdownMenuItem>
                              {invoice.paymentStatus !== 'PAID' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  حذف الفاتورة
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
