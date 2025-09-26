"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/useTranslation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoading } from "@/components/ui/loading"
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  SaudiRiyal,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Shield,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Invoice {
  id: string
  invoiceNumber: string
  tripId: string
  tripNumber: string
  subtotal: number
  taxAmount: number
  customsFees: number
  totalAmount: number
  status: 'PENDING' | 'SENT' | 'PAID' | 'PARTIAL' | 'INSTALLMENT' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidDate?: string | null
  // New payment tracking fields
  amountPaid: number
  remainingAmount: number
  installmentCount?: number
  installmentsPaid: number
  installmentAmount?: number
  nextInstallmentDate?: string
  payments?: any[]
  createdAt: string
  updatedAt: string
  currency: string
  taxRate: number
  notes?: string | null
  // Invoice type identifier
  invoiceType?: 'REGULAR' | 'CLEARANCE'
  trip: {
    fromCity: string
    toCity: string
    deliveredDate?: string | null
    scheduledDate: string
  }
  customsBroker?: {
    name: string
  } | null
}

interface ClearanceInvoice {
  id: string
  invoiceNumber: string
  clearanceId: string
  clearanceNumber: string
  tripId: string
  tripNumber: string
  customsFee: number
  additionalFees: number
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: 'PENDING' | 'SENT' | 'PAID' | 'PARTIAL' | 'INSTALLMENT' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidDate?: string | null
  // New payment tracking fields
  amountPaid: number
  remainingAmount: number
  installmentCount?: number
  installmentsPaid: number
  installmentAmount?: number
  nextInstallmentDate?: string
  payments?: any[]
  createdAt: string
  updatedAt: string
  currency: string
  taxRate: number
  notes?: string | null
  trip: {
    fromCity: string
    toCity: string
    deliveredDate?: string | null
    scheduledDate: string
  }
  customsBroker: {
    name: string
    licenseNumber?: string | null
  }
  clearance: {
    clearanceNumber: string
    status: string
    clearanceDate?: string | null
    estimatedClearanceDate?: string | null
  }
}

interface CustomerInvoicesProps {
  params: Promise<{
    locale: string
  }>
}

export default function CustomerInvoices({ params }: CustomerInvoicesProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = use(params)
  const { t } = useTranslation()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clearanceInvoices, setClearanceInvoices] = useState<ClearanceInvoice[]>([])
  const [activeTab, setActiveTab] = useState<'trip' | 'clearance'>('trip')
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selectedClearanceInvoice, setSelectedClearanceInvoice] = useState<ClearanceInvoice | null>(null)
  const [showClearanceDetails, setShowClearanceDetails] = useState(false)


  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchInvoices()
      fetchClearanceInvoices()
    }
  }, [session, status, router, locale])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/customer/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data)
        console.log("✅ Customer invoices loaded:", data)
      } else {
        console.error("❌ Failed to fetch invoices")
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClearanceInvoices = async () => {
    try {
      const response = await fetch("/api/customer/clearance-invoices")
      if (response.ok) {
        const data = await response.json()
        setClearanceInvoices(data)
        console.log("✅ Customer clearance invoices loaded:", data)
      } else {
        console.error("❌ Failed to fetch clearance invoices")
      }
    } catch (error) {
      console.error("Error fetching clearance invoices:", error)
    }
  }

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer/invoices/${invoiceId}/pay`, {
        method: "POST",
      })
      
      if (response.ok) {
        alert(t('paymentProcessed'))
        fetchInvoices()
      } else {
        alert(t('paymentFailed'))
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      alert(t('paymentFailed'))
    }
  }

  const handleDownloadClearancePDF = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer/clearance-invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `clearance-invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading clearance PDF:", error)
    }
  }

  const handlePayClearanceInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/customer/clearance-invoices/${invoiceId}/pay`, {
        method: 'POST',
      })
      if (response.ok) {
        // Refresh clearance invoices after payment
        fetchClearanceInvoices()
        console.log("✅ Clearance invoice payment processed")
      } else {
        console.error("❌ Failed to process clearance invoice payment")
      }
    } catch (error) {
      console.error("Error processing clearance invoice payment:", error)
    }
  }

  const handleViewClearanceDetails = (invoice: ClearanceInvoice) => {
    setSelectedClearanceInvoice(invoice)
    setShowClearanceDetails(true)
  }

  const closeClearanceDetails = () => {
    setShowClearanceDetails(false)
    setSelectedClearanceInvoice(null)
  }



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'SENT':
        return <FileText className="h-4 w-4" />
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "delivered":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "PAID":
      case "paid":
        return "bg-green-100 text-green-800"
      case "ASSIGNED":
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "PARTIAL":
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "INSTALLMENT":
      case "installment":
        return "bg-purple-100 text-purple-800"
      case "IN_TRANSIT":
      case "inTransit":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
      case "overdue":
        return "bg-red-100 text-red-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "EN_ROUTE_PICKUP":
      case "enRoutePickup":
        return "bg-blue-100 text-blue-800"
      case "AT_PICKUP":
      case "atPickup":
        return "bg-blue-100 text-blue-800"
      case "PICKED_UP":
      case "pickedUp":
        return "bg-blue-100 text-blue-800"
      case "AT_DESTINATION":
      case "atDestination":
        return "bg-blue-100 text-blue-800"
      case "SENT":
      case "sent":
        return "bg-blue-100 text-blue-800"
        
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return t('pendingStatus')
      case 'SENT':
      case 'sent':
        return t('sentStatus')
      case 'PAID':
      case 'paid':
        return t('paidStatus')
      case 'OVERDUE':
      case 'overdue':
        return t('overdueStatus')
      case 'CANCELLED':
      case 'cancelled':
        return t('cancelled')
      case 'PARTIAL':
      case 'partial':
        return t('partialStatus')
      case 'INSTALLMENT':
      case 'installment':
        return t('installmentStatus')
      case 'ASSIGNED':
      case 'assigned':
        return t('assignedStatus')
      default:
        return status
    }
  }

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.trip.fromCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.trip.toCity.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Filter clearance invoices based on search and status
  const filteredClearanceInvoices = clearanceInvoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clearanceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.trip.fromCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.trip.toCity.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const tripStats = {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === "PAID").length,
    pendingPayment: invoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT").reduce((sum, inv) => sum + inv.totalAmount, 0),
    overdueAmount: invoices.filter(inv => inv.status === "OVERDUE").reduce((sum, inv) => sum + inv.totalAmount, 0),
  }

  const clearanceStats = {
    totalInvoices: clearanceInvoices.length,
    paidInvoices: clearanceInvoices.filter(inv => inv.status === "PAID").length,
    pendingPayment: clearanceInvoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT").reduce((sum, inv) => sum + inv.totalAmount, 0),
    overdueAmount: clearanceInvoices.filter(inv => inv.status === "OVERDUE").reduce((sum, inv) => sum + inv.totalAmount, 0),
  }

  const stats = activeTab === 'trip' ? tripStats : clearanceStats

  if (loading) {
    return <PageLoading />
  }

  if (!session || session.user.role !== "CUSTOMER") {
    return null
  }

  return (
    <DashboardLayout
      title={t('myInvoices')}
      subtitle={t('viewPayInvoices')}
      actions={
        <Button onClick={() => router.push(`/${locale}/customer/book-trip`)}>
          <FileText className="h-4 w-4 mr-2" />
          {t('bookNewTrip')}
        </Button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalInvoicesCard')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('paidInvoicesCard')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paidInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingPayments')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayment.toFixed(2)} {t('currency')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overdueAmounts')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueAmount.toFixed(2)} {t('currency')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoiceManagementCard')}</CardTitle>
          <CardDescription>{t('viewPayInvoicesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invoice Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'trip' | 'clearance')} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trip" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                فواتير الرحلات ({tripStats.totalInvoices})
              </TabsTrigger>
              <TabsTrigger value="clearance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                فواتير التخليص الجمركي ({clearanceStats.totalInvoices})
              </TabsTrigger>
            </TabsList>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('searchInvoicesPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('filterByStatusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatusesOption')}</SelectItem>
                  <SelectItem value="PENDING">{t('pendingStatus')}</SelectItem>
                  <SelectItem value="SENT">{t('sentStatus')}</SelectItem>
                  <SelectItem value="PAID">{t('paidStatus')}</SelectItem>
                  <SelectItem value="OVERDUE">{t('overdueStatus')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trip Invoices Tab */}
            <TabsContent value="trip">

          {/* Invoices Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumberCol')}</TableHead>
                  <TableHead>{t('tripNumberCol')}</TableHead>
                  <TableHead>{t('routeCol')}</TableHead>
                  <TableHead>{t('amountCol')}</TableHead>
                  <TableHead>{t('statusCol')}</TableHead>
                  <TableHead>{t('dueDateCol')}</TableHead>
                  <TableHead>{t('actionsCol')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.tripNumber}</TableCell>
                    <TableCell>
                      {invoice.trip.fromCity} → {invoice.trip.toCity}
                      {invoice.customsBroker && (
                        <div className="text-sm text-muted-foreground">
                          {t('customsBroker')}: {invoice.customsBroker.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {invoice.totalAmount.toFixed(2)} {invoice.currency}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('baseAmount')}: {invoice.subtotal.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(invoice.status)}
                          {getStatusText(invoice.status)}
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
                          onClick={() => handleDownloadPDF(invoice.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {/* {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                          <Button
                            size="sm"
                            onClick={() => handlePayInvoice(invoice.id)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            {t('payButton')}
                          </Button>
                        )} */}
                        {(invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (invoice.remainingAmount || 0) > 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/${locale}/customer/payments/record?invoiceId=${invoice.id}&type=regular`)}
                          >
                            <SaudiRiyal className="h-4 w-4 mr-1" />
                            إدارة المدفوعات
                          </Button>
                        )}
                        {invoice.customsBroker && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/${locale}/customer/clearances`)}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            {t('viewClearances')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

              {filteredInvoices.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('noInvoicesTitle')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('noInvoicesMessage')}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Clearance Invoices Tab */}
            <TabsContent value="clearance">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('invoiceNumberCol')}</TableHead>
                      <TableHead>رقم التخليص</TableHead>
                      <TableHead>{t('tripNumberCol')}</TableHead>
                      <TableHead>{t('routeCol')}</TableHead>
                      <TableHead>{t('amountCol')}</TableHead>
                      <TableHead>{t('statusCol')}</TableHead>
                      <TableHead>{t('dueDateCol')}</TableHead>
                      <TableHead>{t('actionsCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClearanceInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {invoice.clearanceNumber}
                        </TableCell>
                        <TableCell>{invoice.tripNumber}</TableCell>
                        <TableCell>
                          {invoice.trip.fromCity} → {invoice.trip.toCity}
                          <div className="text-sm text-muted-foreground">
                            {t('customsBroker')}: {invoice.customsBroker.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {invoice.totalAmount.toFixed(2)} {invoice.currency}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            رسوم التخليص: {invoice.customsFee.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(invoice.status)}
                              {getStatusText(invoice.status)}
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
                              onClick={() => handleViewClearanceDetails(invoice)}
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadClearancePDF(invoice.id)}
                              title="تحميل الفاتورة"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                              <Button
                                size="sm"
                                onClick={() => handlePayClearanceInvoice(invoice.id)}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                {t('payButton')}
                              </Button>
                            )}
                            {(invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (invoice.remainingAmount || 0) > 0) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/${locale}/customer/payments/record?invoiceId=${invoice.id}&type=clearance`)}
                              >
                                <SaudiRiyal className="h-4 w-4 mr-1" />
                                إدارة المدفوعات
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredClearanceInvoices.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد فواتير تخليص جمركي</h3>
                  <p className="text-muted-foreground mb-4">
                    لم يتم العثور على فواتير تخليص جمركي بالمعايير المحددة
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal تفاصيل فاتورة التخليص الجمركي */}
      <Dialog open={showClearanceDetails} onOpenChange={setShowClearanceDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              تفاصيل فاتورة التخليص الجمركي
            </DialogTitle>
            <DialogDescription>
              عرض تفاصيل شاملة لفاتورة التخليص الجمركي
            </DialogDescription>
          </DialogHeader>
          
          {selectedClearanceInvoice && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      معلومات الفاتورة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم الفاتورة:</span>
                      <span className="font-medium">{selectedClearanceInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم التخليص:</span>
                      <span className="font-medium">{selectedClearanceInvoice.clearanceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">رقم الرحلة:</span>
                      <span className="font-medium">{selectedClearanceInvoice.tripNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحالة:</span>
                      <Badge className={getStatusColor(selectedClearanceInvoice.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedClearanceInvoice.status)}
                          {getStatusText(selectedClearanceInvoice.status)}
                        </div>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      معلومات التخليص
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المخلص الجمركي:</span>
                      <span className="font-medium">{selectedClearanceInvoice.customsBroker.name}</span>
                    </div>
                    {selectedClearanceInvoice.customsBroker.licenseNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الترخيص:</span>
                        <span className="font-medium">{selectedClearanceInvoice.customsBroker.licenseNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">حالة التخليص:</span>
                      <span className="font-medium">{selectedClearanceInvoice.clearance.status}</span>
                    </div>
                    {selectedClearanceInvoice.clearance.clearanceDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ التخليص:</span>
                        <span className="font-medium">
                          {new Date(selectedClearanceInvoice.clearance.clearanceDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                    {selectedClearanceInvoice.clearance.estimatedClearanceDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">التاريخ المتوقع:</span>
                        <span className="font-medium">
                          {new Date(selectedClearanceInvoice.clearance.estimatedClearanceDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* معلومات الرحلة */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    معلومات الرحلة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المسار:</span>
                      <span className="font-medium">
                        {selectedClearanceInvoice.trip.fromCity} → {selectedClearanceInvoice.trip.toCity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الجدولة:</span>
                      <span className="font-medium">
                        {new Date(selectedClearanceInvoice.trip.scheduledDate).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    {selectedClearanceInvoice.trip.deliveredDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ التسليم:</span>
                        <span className="font-medium">
                          {new Date(selectedClearanceInvoice.trip.deliveredDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* التفاصيل المالية */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SaudiRiyal className="h-5 w-5" />
                    التفاصيل المالية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">رسوم التخليص الجمركي:</span>
                          <span className="font-medium">
                            {selectedClearanceInvoice.customsFee.toFixed(2)} {selectedClearanceInvoice.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">رسوم إضافية:</span>
                          <span className="font-medium">
                            {selectedClearanceInvoice.additionalFees.toFixed(2)} {selectedClearanceInvoice.currency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">المجموع الفرعي:</span>
                          <span className="font-medium">
                            {selectedClearanceInvoice.subtotal.toFixed(2)} {selectedClearanceInvoice.currency}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            الضريبة ({(selectedClearanceInvoice.taxRate * 100).toFixed(0)}%):
                          </span>
                          <span className="font-medium">
                            {selectedClearanceInvoice.taxAmount.toFixed(2)} {selectedClearanceInvoice.currency}
                          </span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span>المجموع الكلي:</span>
                            <span className="text-primary">
                              {selectedClearanceInvoice.totalAmount.toFixed(2)} {selectedClearanceInvoice.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* معلومات الدفع والتواريخ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      معلومات الدفع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                      <span className="font-medium">
                        {new Date(selectedClearanceInvoice.dueDate).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    {selectedClearanceInvoice.paidDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ الدفع:</span>
                        <span className="font-medium text-green-600">
                          {new Date(selectedClearanceInvoice.paidDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                      <span className="font-medium">
                        {new Date(selectedClearanceInvoice.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedClearanceInvoice.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        ملاحظات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedClearanceInvoice.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* أزرار العمليات */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadClearancePDF(selectedClearanceInvoice.id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    تحميل الفاتورة
                  </Button>
                  {(selectedClearanceInvoice.status === 'SENT' || selectedClearanceInvoice.status === 'OVERDUE') && (
                    <Button
                      onClick={() => {
                        handlePayClearanceInvoice(selectedClearanceInvoice.id)
                        closeClearanceDetails()
                      }}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      دفع الفاتورة
                    </Button>
                  )}
                </div>
                <Button variant="outline" onClick={closeClearanceDetails}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </DashboardLayout>
  )
}
