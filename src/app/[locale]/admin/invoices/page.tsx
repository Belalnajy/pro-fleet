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
  Trash2,
  Plus,
  DollarSign
} from "lucide-react"
import { CreateInvoiceModal } from "@/components/invoices/create-invoice-modal"
import * as XLSX from 'xlsx'

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  tripId: string | null
  tripNumber: string | null
  subtotal: number
  taxAmount: number
  customsFees: number
  totalAmount: number
  paymentStatus: string
  dueDate: string
  paidDate: string | null
  // New payment tracking fields
  amountPaid: number
  remainingAmount: number
  installmentCount?: number
  installmentsPaid: number
  installmentAmount?: number
  nextInstallmentDate?: string
  createdAt: string
  updatedAt: string
  currency: string
  notes: string | null
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  limit: number
}

export default function AccountantInvoicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { locale } = use(params)
  const { t, language } = useTranslation()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})
  const [exportLoading, setExportLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchInvoices()
    }
  }, [session, status, router, currentPage, statusFilter, searchTerm, locale])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/invoices?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await response.json()
      setInvoices(data.invoices || [])
      setPagination({
        currentPage: data.pagination?.currentPage || 1,
        totalPages: data.pagination?.totalPages || 1,
        totalCount: data.pagination?.totalCount || 0,
        hasNextPage: data.pagination?.hasNextPage || false,
        hasPreviousPage: data.pagination?.hasPreviousPage || false,
        limit: data.pagination?.limit || 10
      })
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
    router.push(`/${locale}/admin/invoices/${invoiceId}`)
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
      
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`)
      
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
        description: t("downloadFailed"),
        variant: "destructive"
      })
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Handle sending email
  const handleSendEmail = async (invoiceId: string) => {
    
    const loadingKey = `email-${invoiceId}`
    try {
      setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
      
      toast({
        title: "جاري الإرسال...",
        description: "يتم إرسال الفاتورة بالبريد الإلكتروني"
      })
      
      const response = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to send email')
      }
      
      const result = await response.json()
      
      toast({
        title: "تم بنجاح",
        description: result.message || "تم إرسال الفاتورة بنجاح"
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
    router.push(`/${locale}/admin/invoices/${invoiceId}?edit=true`)
  }

  // Handle deleting invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmDelete = window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')
    
    if (!confirmDelete) return
    
    const loadingKey = `delete-${invoiceId}`
    try {
      setActionLoading(prev => ({ ...prev, [loadingKey]: true }))
      
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
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
      case "partial":
        return "bg-orange-100 text-orange-800"
      case "installment":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-indigo-100 text-indigo-800"
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
    // Use the status translations from acc-invoices.json
    const statusTranslations: Record<string, Record<string, string>> = {
      'ar': {
        'PENDING': 'في الانتظار',
        'SENT': 'تم الإرسال',
        'PAID': 'مدفوعة',
        'PARTIAL': 'دفع جزئي',
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
        'PARTIAL': 'جزوی ادائیگی',
        'INSTALLMENT': 'قسطوں میں',
        'OVERDUE': 'تاخیر شدہ',
        'CANCELLED': 'منسوخ شدہ'
      }
    }
    
    const currentLang = language || 'ar'
    return statusTranslations[currentLang]?.[status.toUpperCase()] || status
  }

  const handleExportInvoices = async () => {
    setExportLoading(true)
    try {
      // Create XLSX content
      const headers = [
        'رقم الفاتورة',
        'اسم العميل',
        'رقم الرحلة',
        'المبلغ الإجمالي',
        'حالة الدفع',
        'تاريخ الإنشاء',
        'تاريخ الاستحقاق',
        'تاريخ الدفع',
        'الضريبة',
        'رسوم الجمارك',
        'العملة',
        'ملاحظات'
      ]
      
      const rows = invoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.customerName || 'غير محدد',
        invoice.tripNumber || 'غير محدد',
        invoice.totalAmount,
        getStatusText(invoice.paymentStatus),
        new Date(invoice.createdAt).toLocaleDateString('ar-SA'),
        invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('ar-SA') : 'غير محدد',
        invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('ar-SA') : 'غير مدفوع',
        invoice.taxAmount,
        invoice.customsFees,
        invoice.currency,
        invoice.notes || ''
      ])
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheetData = [headers, ...rows]
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // رقم الفاتورة
        { wch: 25 }, // اسم العميل
        { wch: 15 }, // رقم الرحلة
        { wch: 15 }, // المبلغ الإجمالي
        { wch: 15 }, // حالة الدفع
        { wch: 15 }, // تاريخ الإنشاء
        { wch: 15 }, // تاريخ الاستحقاق
        { wch: 15 }, // تاريخ الدفع
        { wch: 12 }, // الضريبة
        { wch: 15 }, // رسوم الجمارك
        { wch: 10 }, // العملة
        { wch: 30 }  // ملاحظات
      ]
      worksheet['!cols'] = columnWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "الفواتير")
      
      // Generate and download file
      XLSX.writeFile(workbook, `invoices-${new Date().toISOString().split('T')[0]}.xlsx`)
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير الفواتير إلى ملف Excel",
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
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>
          <div className="flex space-x-3 rtl:space-x-reverse  ">
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:block">{t("createInvoice")}</span>
            </Button>
            <Button
              onClick={handleExportInvoices}
              disabled={exportLoading}
              variant="outline"
              className="flex items-center space-x-2 rtl:space-x-reverse"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden md:block">{t("exportInvoices")}</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalInvoices")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.totalCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("pendingInvoices")}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(invoices || []).filter(inv => inv.paymentStatus === 'PENDING').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("paidInvoices")}</CardTitle>
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
              <CardTitle className="text-sm font-medium">{t("overdueInvoices")}</CardTitle>
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
            <CardTitle>{t("searchInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatus")}</SelectItem>
                  <SelectItem value="PENDING">{getStatusText('PENDING')}</SelectItem>
                  <SelectItem value="SENT">{getStatusText('SENT')}</SelectItem>
                  <SelectItem value="PAID">{getStatusText('PAID')}</SelectItem>
                  <SelectItem value="OVERDUE">{getStatusText('OVERDUE')}</SelectItem>
                  <SelectItem value="CANCELLED">{getStatusText('CANCELLED')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("invoicesTitle")}</CardTitle>
            <CardDescription>
              {pagination && `${t("showing")} ${invoices.length} ${t("of")} ${pagination.totalCount} ${t("invoices")}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoiceNumber")}</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("trip")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("paymentStatus")}</TableHead>
                    <TableHead>{t("dueDate")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.customerName || t("unknownCustomer")}</div>
                          <div className="text-sm text-gray-500">{invoice.customerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{invoice.tripNumber || t("noTripAssociated")}</div>
                          <div className="text-gray-500">ID: {invoice.tripId || t("none")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {invoice.totalAmount?.toLocaleString() || '0'} {invoice.currency || t("sar")}
                          </div>
                          {(invoice.paymentStatus === 'PARTIAL' || invoice.paymentStatus === 'INSTALLMENT') && (
                            <div className="text-xs space-y-1">
                              <div className="text-green-600">
                                مدفوع: {(invoice.amountPaid || 0).toLocaleString()} {invoice.currency || 'ريال'}
                              </div>
                              <div className="text-orange-600">
                                متبقي: {(invoice.remainingAmount || 0).toLocaleString()} {invoice.currency || 'ريال'}
                              </div>
                              {invoice.paymentStatus === 'INSTALLMENT' && invoice.installmentCount && (
                                <div className="text-blue-600">
                                  أقساط: {invoice.installmentsPaid}/{invoice.installmentCount}
                                </div>
                              )}
                            </div>
                          )}
                          {invoice.paymentStatus === 'PAID' && (
                            <div className="text-xs text-green-600">
                              مدفوع بالكامل
                            </div>
                          )}
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
                            {t("paid")}: {new Date(invoice.paidDate).toLocaleDateString('ar-SA')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                          {/* <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewInvoice(invoice.id)}
                            title={t("viewInvoice")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button> */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                            disabled={actionLoading[`pdf-${invoice.id}`]}
                            title={t("downloadPDFTooltip")}
                          >
                            {actionLoading[`pdf-${invoice.id}`] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          {/* {invoice.paymentStatus === 'PENDING' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendEmail(invoice.id)}
                              disabled={actionLoading[`email-${invoice.id}`]}
                              title={t("sendEmailTooltip")}
                            >
                              {actionLoading[`email-${invoice.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          )} */}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" title={t("moreTooltip")}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("viewDetailsAction")}
                              </DropdownMenuItem>
                              {invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'CANCELLED' && (invoice.remainingAmount || 0) > 0 && (
                                <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  إدارة المدفوعات
                                </DropdownMenuItem>
                              )}
                              {/* <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t("editInvoiceAction")}
                              </DropdownMenuItem> */}
                              {invoice.paymentStatus !== 'PAID' && (
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t("deleteInvoiceAction")}
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
                  {t("pageText")} {pagination.currentPage} {t("ofText")} {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("previousButton")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    {t("nextButton")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Invoice Modal */}
        <CreateInvoiceModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={fetchInvoices}
          userRole="ADMIN"
        />
      </div>
    </DashboardLayout>
  )
}
