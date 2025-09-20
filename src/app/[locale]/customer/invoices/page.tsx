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
import { PageLoading } from "@/components/ui/loading"
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
} from "lucide-react"

interface Invoice {
  id: string
  invoiceNumber: string
  tripId: string
  tripNumber: string
  subtotal: number
  taxAmount: number
  customsFees: number
  totalAmount: number
  status: 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  paidDate?: string | null
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
  customsBroker?: {
    name: string
  } | null
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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchInvoices()
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
      case 'PENDING':
        return "bg-yellow-100 text-yellow-800"
      case 'SENT':
        return "bg-blue-100 text-blue-800"
      case 'PAID':
        return "bg-green-100 text-green-800"
      case 'OVERDUE':
        return "bg-red-100 text-red-800"
      case 'CANCELLED':
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('pendingStatus')
      case 'SENT':
        return t('sentStatus')
      case 'PAID':
        return t('paidStatus')
      case 'OVERDUE':
        return t('overdueStatus')
      case 'CANCELLED':
        return t('cancelled')
      default:
        return status
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.tripNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === "PAID").length,
    pendingPayment: invoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT").reduce((sum, inv) => sum + inv.totalAmount, 0),
    overdueAmount: invoices.filter(inv => inv.status === "OVERDUE").reduce((sum, inv) => sum + inv.totalAmount, 0),
  }

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
                        {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
                          <Button
                            size="sm"
                            onClick={() => handlePayInvoice(invoice.id)}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            {t('payButton')}
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
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
