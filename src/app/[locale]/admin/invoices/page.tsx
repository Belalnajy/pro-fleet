"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { Loader2, Clock } from "lucide-react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  FileText,
  DollarSign,
  Mail,
  Eye,
  Calculator,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  tripId?: string
  tripNumber?: string
  subtotal: number
  taxAmount: number
  customsFees: number
  totalAmount: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'SENT' | 'DRAFT'
  dueDate: string
  paidDate?: string
  createdAt: string
  updatedAt: string
  currency: string
  notes?: string
}

interface Customer {
  id: string
  name: string
  email: string
  companyName?: string
}

interface Trip {
  id: string
  tripNumber: string
  fromCity: string
  toCity: string
}

export default function InvoicesManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customerFilter, setCustomerFilter] = useState("all")
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null)
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null)

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: "",
    tripId: "",
    subtotal: "",
    taxAmount: "",
    customsFees: "",
    dueDate: "",
    notes: "",
  })

  // Form data for dialogs
  const [formData, setFormData] = useState({
    customerId: "",
    tripId: null as string | null,
    subtotal: 0,
    taxAmount: 0,
    customsFees: 0,
    totalAmount: 0,
    dueDate: "",
    notes: ""
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchInvoices()
      fetchCustomers()
      fetchTrips()
    }
  }, [session, status, router])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/admin/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
      } else {
        toast({
          title: t('error'),
          description: t('loadInvoicesFailed'),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast({
        title: t('error'),
        description: t('loadInvoicesError'),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    }
  }

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/admin/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    }
  }

  const handleAddInvoice = async () => {
    try {
      setActionLoading('create')
      
      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          subtotal: parseFloat(invoiceForm.subtotal),
          taxAmount: parseFloat(invoiceForm.taxAmount),
          customsFees: parseFloat(invoiceForm.customsFees || '0'),
        }),
      })
      
      if (response.ok) {
        await fetchInvoices()
        setIsAddInvoiceOpen(false)
        resetForm()
        toast({
          title: "✅ تم إنشاء الفاتورة",
          description: "تم إنشاء الفاتورة بنجاح"
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في إنشاء الفاتورة",
          description: error.error || "حدث خطأ غير متوقع",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error adding invoice:", error)
      toast({
        title: "❌ خطأ في إنشاء الفاتورة",
        description: "حدث خطأ أثناء إنشاء الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return
    
    try {
      setActionLoading('update')
      
      const response = await fetch(`/api/admin/invoices/${editingInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          subtotal: parseFloat(invoiceForm.subtotal),
          taxAmount: parseFloat(invoiceForm.taxAmount),
          customsFees: parseFloat(invoiceForm.customsFees || '0'),
        }),
      })
      
      if (response.ok) {
        await fetchInvoices()
        setEditingInvoice(null)
        resetForm()
        setIsAddInvoiceOpen(false)
        toast({
          title: "✅ تم تحديث الفاتورة",
          description: "تم تحديث الفاتورة بنجاح"
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في تحديث الفاتورة",
          description: error.error || "حدث خطأ غير متوقع",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
      toast({
        title: "❌ خطأ في تحديث الفاتورة",
        description: "حدث خطأ أثناء تحديث الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteInvoice = async () => {
    if (!deleteInvoice) return
    
    try {
      setActionLoading('delete')
      
      const response = await fetch(`/api/admin/invoices/${deleteInvoice.id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        await fetchInvoices()
        setDeleteInvoice(null)
        toast({
          title: "✅ تم حذف الفاتورة",
          description: "تم حذف الفاتورة بنجاح"
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في حذف الفاتورة",
          description: error.error || "لا يمكن حذف الفواتير المدفوعة",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast({
        title: "❌ خطأ في حذف الفاتورة",
        description: "حدث خطأ أثناء حذف الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
      setDeleteInvoice(null)
    }
  }

  const resetForm = () => {
    setInvoiceForm({
      customerId: "",
      tripId: "",
      subtotal: "",
      taxAmount: "",
      customsFees: "",
      dueDate: "",
      notes: "",
    })
  }

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setActionLoading(`pdf-${invoiceId}`)
      
      const response = await fetch(`/api/admin/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "✅ تم تحميل الفاتورة",
          description: `تم تحميل فاتورة ${invoiceNumber} بنجاح`
        })
      } else {
        toast({
          title: "❌ خطأ في تحميل الفاتورة",
          description: "فشل في تحميل الفاتورة",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast({
        title: "❌ خطأ في تحميل الفاتورة",
        description: "حدث خطأ أثناء تحميل الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendEmail = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setActionLoading(`email-${invoiceId}`)
      
      const response = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
        method: "POST",
      })
      
      if (response.ok) {
        const result = await response.json()
        await fetchInvoices() // Refresh to show updated status
        toast({
          title: "✅ تم إرسال الفاتورة",
          description: `تم إرسال فاتورة ${invoiceNumber} إلى ${result.email} بنجاح`
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في إرسال الفاتورة",
          description: error.error || "فشل في إرسال البريد الإلكتروني",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "❌ خطأ في إرسال الفاتورة",
        description: "حدث خطأ أثناء إرسال البريد الإلكتروني",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportExcel = () => {
    toast({
      title: t('comingSoon'),
      description: t('excelExportSoon')
    })
  }

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setActionLoading(`status-${invoiceId}`)
      
      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        await fetchInvoices()
        toast({
          title: "✅ تم تحديث حالة الفاتورة",
          description: `تم تحديث حالة الفاتورة إلى ${getStatusText(newStatus)}`
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في تحديث الحالة",
          description: error.error || "حدث خطأ غير متوقع",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "❌ خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء تحديث حالة الفاتورة",
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteClick = (invoice: Invoice) => {
    setDeleteInvoice(invoice)
    setDeletingInvoice(invoice)
    setIsDeleteDialogOpen(true)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setViewInvoice(invoice)
    setViewingInvoice(invoice)
    setIsViewDialogOpen(true)
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setFormData({
      customerId: invoice.customerId,
      tripId: invoice.tripId || null,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      customsFees: invoice.customsFees,
      totalAmount: invoice.totalAmount,
      dueDate: invoice.dueDate.split('T')[0], // Format for date input
      notes: invoice.notes || ""
    })
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      
      const url = editingInvoice 
        ? `/api/admin/invoices/${editingInvoice.id}`
        : '/api/admin/invoices'
      
      const method = editingInvoice ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        await fetchInvoices()
        setIsCreateDialogOpen(false)
        setEditingInvoice(null)
        setFormData({
          customerId: "",
          tripId: null,
          subtotal: 0,
          taxAmount: 0,
          customsFees: 0,
          totalAmount: 0,
          dueDate: "",
          notes: ""
        })
        
        toast({
          title: editingInvoice ? "✅ تم تحديث الفاتورة" : "✅ تم إنشاء الفاتورة",
          description: editingInvoice ? "تم تحديث بيانات الفاتورة بنجاح" : "تم إنشاء فاتورة جديدة بنجاح"
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في العملية",
          description: error.error || "حدث خطأ غير متوقع",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "❌ خطأ في العملية",
        description: "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingInvoice) return
    
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/admin/invoices/${deletingInvoice.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchInvoices()
        setIsDeleteDialogOpen(false)
        setDeletingInvoice(null)
        
        toast({
          title: "✅ تم حذف الفاتورة",
          description: "تم حذف الفاتورة بنجاح"
        })
      } else {
        const error = await response.json()
        toast({
          title: "❌ خطأ في الحذف",
          description: error.error || "لا يمكن حذف الفواتير المدفوعة",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast({
        title: "❌ خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الفاتورة",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-500", text: t('draft'), icon: FileText },
      SENT: { color: "bg-blue-500", text: t('sent'), icon: Mail },
      PENDING: { color: "bg-yellow-500", text: t('pending'), icon: Clock },
      PAID: { color: "bg-green-500", text: t('paid'), icon: CheckCircle },
      OVERDUE: { color: "bg-red-500", text: t('overdue'), icon: AlertCircle },
      CANCELLED: { color: "bg-gray-400", text: t('cancelled'), icon: XCircle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const getStatusText = (status: string) => {
    const statusTexts = {
      DRAFT: t('draft'),
      SENT: t('sent'),
      PENDING: t('pending'),
      PAID: t('paid'),
      OVERDUE: t('overdue'),
      CANCELLED: t('cancelled'),
    }
    return statusTexts[status as keyof typeof statusTexts] || t('unspecified')
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.tripNumber && invoice.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesCustomer = customerFilter === "all" || invoice.customerId === customerFilter
    
    return matchesSearch && matchesStatus && matchesCustomer
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t('loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('invoiceManagement')}</h1>
            <p className="text-muted-foreground">{t('manageMonitorInvoices')}</p>
          </div>
          <div className="flex items-center space-x-2 ">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
             <span className="hidden md:block">{t('exportExcel')}</span>
            </Button>
            <Button 
              onClick={() => {
                setEditingInvoice(null)
                setFormData({
                  customerId: "",
                  tripId: null,
                  subtotal: 0,
                  taxAmount: 0,
                  customsFees: 0,
                  totalAmount: 0,
                  dueDate: "",
                  notes: ""
                })
                setIsCreateDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
             <span className="hidden md:block">{t('createInvoice')}</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalInvoices')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('paidInvoices')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'PAID').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('overdueInvoices')}</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {invoices.filter(inv => inv.status === 'OVERDUE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {invoices.filter(inv => inv.status === 'PAID')
                  .reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2)} {t('sar')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invoices')}</CardTitle>
            <CardDescription>{t('manageMonitorInvoices')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchInvoices')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="DRAFT">{t('draft')}</SelectItem>
                  <SelectItem value="SENT">{t('sent')}</SelectItem>
                  <SelectItem value="PENDING">{t('pending')}</SelectItem>
                  <SelectItem value="PAID">{t('paid')}</SelectItem>
                  <SelectItem value="OVERDUE">{t('overdue')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('filterByCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allCustomers')}</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.companyName || customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoices Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumberHeader')}</TableHead>
                  <TableHead>{t('customerHeader')}</TableHead>
                  <TableHead>{t('tripHeader')}</TableHead>
                  <TableHead>{t('amountHeader')}</TableHead>
                  <TableHead>{t('statusHeader')}</TableHead>
                  <TableHead>{t('dueDateHeader')}</TableHead>
                  <TableHead>{t('createdDateHeader')}</TableHead>
                  <TableHead className="text-right">{t('actionsHeader')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customerName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.tripNumber ? (
                        <Badge variant="outline">{invoice.tripNumber}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {invoice.totalAmount.toFixed(2)} {t('sar')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('taxCustomsDetails').replace('{tax}', invoice.taxAmount.toFixed(2)).replace('{customs}', invoice.customsFees.toFixed(2))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewInvoice(invoice)}
                          title={t('viewDetails')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                          disabled={actionLoading === `pdf-${invoice.id}`}
                          title={t('downloadPDF')}
                        >
                          {actionLoading === `pdf-${invoice.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSendEmail(invoice.id, invoice.invoiceNumber)}
                          disabled={actionLoading === `email-${invoice.id}`}
                          title={t('sendEmail')}
                        >
                          {actionLoading === `email-${invoice.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(invoice)}
                          title={t('edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(invoice)}
                          title={t('delete')}
                          disabled={invoice.status === 'PAID'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {invoice.status !== 'PAID' && (
                          <Select 
                            value={invoice.status} 
                            onValueChange={(newStatus) => handleUpdateStatus(invoice.id, newStatus)}
                            disabled={actionLoading === `status-${invoice.id}`}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">{t('pending')}</SelectItem>
                              <SelectItem value="SENT">{t('sent')}</SelectItem>
                              <SelectItem value="PAID">{t('paid')}</SelectItem>
                              <SelectItem value="OVERDUE">{t('overdue')}</SelectItem>
                              <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t('noInvoices')}</h3>
                <p className="text-muted-foreground">{t('noInvoicesFound')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? t('updateInvoice') : t('createInvoiceTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? t('updateInvoice') : t('createInvoiceTitle')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">{t('customerRequired')}</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.companyName || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trip">{t('trip')}</Label>
                <Select 
                  value={formData.tripId || 'no-trip'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tripId: value === 'no-trip' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('trip')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-trip">{t('trip')}</SelectItem>
                    {/* Add trips here if needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">{t('subtotalRequired')}</Label>
                <Input
                  id="subtotal"
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => {
                    const subtotal = parseFloat(e.target.value) || 0
                    const taxAmount = subtotal * 0.15 // 15% tax
                    const customsFees = subtotal * 0.05 // 5% customs
                    const totalAmount = subtotal + taxAmount + customsFees
                    
                    setFormData(prev => ({
                      ...prev,
                      subtotal,
                      taxAmount,
                      customsFees,
                      totalAmount
                    }))
                  }}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxAmount">{t('tax')}</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  value={formData.taxAmount}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customsFees">{t('customs')}</Label>
                <Input
                  id="customsFees"
                  type="number"
                  step="0.01"
                  value={formData.customsFees}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">{t('totalAmount')}</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  readOnly
                  className="bg-muted font-bold"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t('dueDateRequired')}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <textarea
                id="notes"
                className="w-full p-2 border rounded-md min-h-[80px]"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('additionalNotes')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !formData.customerId || !formData.subtotal || !formData.dueDate}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                editingInvoice ? t('updateInvoice') : t('createInvoice')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {t('viewInvoiceDetails').replace('{invoiceNumber}', viewingInvoice?.invoiceNumber || '')}
            </DialogDescription>
          </DialogHeader>
          
          {viewingInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('invoiceNumber')}</Label>
                    <p className="text-lg font-semibold">{viewingInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('customer')}</Label>
                    <p className="text-lg">{viewingInvoice.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('status')}</Label>
                    <div className="mt-1">{getStatusBadge(viewingInvoice.status)}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('createdDate')}</Label>
                    <p className="text-lg">{new Date(viewingInvoice.createdAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('dueDate')}</Label>
                    <p className="text-lg">{new Date(viewingInvoice.dueDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                  {viewingInvoice.tripNumber && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">{t('tripNumber')}</Label>
                      <Badge variant="outline" className="mt-1">{viewingInvoice.tripNumber}</Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-semibold">{t('amountDetails')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('subtotal')}:</span>
                    <span>{viewingInvoice.subtotal.toFixed(2)} {t('sar')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('tax')}:</span>
                    <span>{viewingInvoice.taxAmount.toFixed(2)} {t('sar')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('customs')}:</span>
                    <span>{viewingInvoice.customsFees.toFixed(2)} {t('sar')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('grandTotal')}:</span>
                    <span>{viewingInvoice.totalAmount.toFixed(2)} {t('sar')}</span>
                  </div>
                </div>
              </div>
              
              {viewingInvoice.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('notesLabel')}</Label>
                    <p className="mt-1 text-sm">{viewingInvoice.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('close')}
            </Button>
            {viewingInvoice && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadPDF(viewingInvoice.id, viewingInvoice.invoiceNumber)}
                  disabled={actionLoading === `pdf-${viewingInvoice.id}`}
                >
                  {actionLoading === `pdf-${viewingInvoice.id}` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {t('downloadPDF')}
                </Button>
                <Button 
                  onClick={() => handleSendEmail(viewingInvoice.id, viewingInvoice.invoiceNumber)}
                  disabled={actionLoading === `email-${viewingInvoice.id}`}
                >
                  {actionLoading === `email-${viewingInvoice.id}` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {t('sendEmail')}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('confirmDeleteMessage').replace('{invoiceNumber}', deletingInvoice?.invoiceNumber || '')}
              <br />
              {t('cannotUndo')}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                t('deleteInvoice')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
