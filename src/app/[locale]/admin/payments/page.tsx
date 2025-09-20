"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoading } from "@/components/ui/loading"
import { useLanguage } from "@/components/providers/language-provider"
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Banknote,
  Wallet,
  Receipt,
  Calendar,
  Users,
  BarChart3,
} from "lucide-react"

interface Payment {
  id: string
  paymentNumber: string
  invoiceId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  currency: string
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'CHECK'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  transactionId?: string
  gatewayResponse?: string
  paidAt?: string
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalPayments: number
  totalAmount: number
  pendingAmount: number
  completedAmount: number
  failedAmount: number
  refundedAmount: number
  todayPayments: number
  todayAmount: number
  monthlyGrowth: number
}

export default function PaymentsManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedAmount: 0,
    failedAmount: 0,
    refundedAmount: 0,
    todayPayments: 0,
    todayAmount: 0,
    monthlyGrowth: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchPayments()
      fetchStats()
    }
  }, [session, status, router])

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments")
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/payments/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error)
    }
  }

  const handleRefundPayment = async (paymentId: string) => {
    if (confirm(t("confirmRefund"))) {
      try {
        const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
          method: "POST",
        })
        
        if (response.ok) {
          alert(t("refundProcessed"))
          fetchPayments()
          fetchStats()
        } else {
          alert(t("refundFailed"))
        }
      } catch (error) {
        console.error("Error processing refund:", error)
        alert(t("refundFailed"))
      }
    }
  }

  const handleRetryPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/retry`, {
        method: "POST",
      })
      
      if (response.ok) {
        alert(t("paymentRetried"))
        fetchPayments()
      } else {
        alert(t("retryFailed"))
      }
    } catch (error) {
      console.error("Error retrying payment:", error)
      alert(t("retryFailed"))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'FAILED':
        return <XCircle className="h-4 w-4" />
      case 'REFUNDED':
        return <TrendingDown className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-500", text: t("pending") },
      PROCESSING: { color: "bg-blue-500", text: t("processing") },
      COMPLETED: { color: "bg-green-500", text: t("completed") },
      FAILED: { color: "bg-red-500", text: t("failed") },
      REFUNDED: { color: "bg-orange-500", text: t("refunded") },
      CANCELLED: { color: "bg-gray-500", text: t("cancelled") },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    )
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <Receipt className="h-4 w-4" />
      case 'DIGITAL_WALLET':
        return <Wallet className="h-4 w-4" />
      case 'CHECK':
        return <Receipt className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter
    
    let matchesDate = true
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.createdAt)
      const now = new Date()
      
      switch (dateFilter) {
        case "today":
          matchesDate = paymentDate.toDateString() === now.toDateString()
          break
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= weekAgo
          break
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = paymentDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesMethod && matchesDate
  })

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading text={t("loading")} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("paymentManagement")}</h1>
            <p className="text-muted-foreground">{t("managePaymentsAndTransactions")}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t("exportReport")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              fetchPayments()
              fetchStats()
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t("refresh")}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalPayments")}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayPayments} {t("today")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalAmount")}</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalAmount.toFixed(2)} {t("currency")}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.todayAmount.toFixed(2)} {t("currency")} {t("today")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("pendingAmount")}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingAmount.toFixed(2)} {t("currency")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("monthlyGrowth")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payments">{t("allPayments")}</TabsTrigger>
            <TabsTrigger value="pending">{t("pendingPayments")}</TabsTrigger>
            <TabsTrigger value="failed">{t("failedPayments")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("analytics")}</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("paymentTransactions")}</CardTitle>
                <CardDescription>{t("viewAndManagePayments")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("searchPayments")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allStatuses")}</SelectItem>
                      <SelectItem value="PENDING">{t("pending")}</SelectItem>
                      <SelectItem value="PROCESSING">{t("processing")}</SelectItem>
                      <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
                      <SelectItem value="FAILED">{t("failed")}</SelectItem>
                      <SelectItem value="REFUNDED">{t("refunded")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t("method")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allMethods")}</SelectItem>
                      <SelectItem value="CASH">{t("cash")}</SelectItem>
                      <SelectItem value="CARD">{t("card")}</SelectItem>
                      <SelectItem value="BANK_TRANSFER">{t("bankTransfer")}</SelectItem>
                      <SelectItem value="DIGITAL_WALLET">{t("digitalWallet")}</SelectItem>
                      <SelectItem value="CHECK">{t("check")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t("period")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allTime")}</SelectItem>
                      <SelectItem value="today">{t("today")}</SelectItem>
                      <SelectItem value="week">{t("thisWeek")}</SelectItem>
                      <SelectItem value="month">{t("thisMonth")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("paymentNumber")}</TableHead>
                      <TableHead>{t("customer")}</TableHead>
                      <TableHead>{t("invoice")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("method")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.paymentNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{payment.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.invoiceNumber}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {payment.amount.toFixed(2)} {payment.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getMethodIcon(payment.paymentMethod)}
                            <span className="text-sm">{t(payment.paymentMethod.toLowerCase())}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            {getStatusBadge(payment.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment)
                                setIsDetailsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === 'FAILED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetryPayment(payment.id)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            {payment.status === 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRefundPayment(payment.id)}
                              >
                                <TrendingDown className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">{t("noPaymentsFound")}</h3>
                    <p className="text-muted-foreground">{t("noPaymentsDescription")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
