"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Calendar,
  Users,
  Loader2,
  CreditCard,
  Receipt
} from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  monthlyRevenue: number
  totalExpenses: number
  netProfit: number
  totalInvoices: number
  pendingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  cancelledInvoices: number
  totalTransactions: number
}

interface Invoice {
  id: string
  customer: string
  amount: number
  status: string
  dueDate: string
  paidDate: string | null
  tripId: string
  createdAt: Date
}

interface Transaction {
  id: string
  type: string
  description: string
  amount: number
  date: string
  status: string
  invoiceId?: string
  customer?: string
}

export default function AccountantDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats
    recentInvoices: Invoice[]
    recentTransactions: Transaction[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/accountant/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: t("error"),
        description: t("failedToLoadDashboard"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ACCOUNTANT") {
    return null
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{t("failedToLoadData")}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            {t("retry")}
          </Button>
        </div>
      </div>
    )
  }

  // Use real data from API
  const { stats, recentInvoices, recentTransactions } = dashboardData

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "cancelled":
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "expense":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "invoice":
        return <FileText className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout
      title={t("accountantDashboard")}
      subtitle={t("financialOverview")}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t("exportReports")}
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            {t("generateInvoice")}
          </Button>
        </div>
      }
    >
      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("revenueGrowth")} {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalExpenses")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("expenseGrowth")} {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("netProfit")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("profitGrowth")} {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pendingInvoices")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueInvoices} {t("overdue")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recentInvoices")}</CardTitle>
                <CardDescription>{t("latestBillingActivities")}</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                {t("viewAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{invoice.id}</h3>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer} • {t("trip")}: {invoice.tripId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("dueDate")}: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{t("currency")} {invoice.amount.toLocaleString()}</div>
                      <Badge className={getStatusColor(invoice.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(invoice.status)}
                          <span>{getStatusText(invoice.status)}</span>
                        </div>
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recentTransactions")}</CardTitle>
                <CardDescription>{t("latestFinancialActivities")}</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                {t("viewAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionTypeIcon(transaction.type)}
                    <div>
                      <h3 className="font-semibold">{transaction.id}</h3>
                      <div className="text-sm text-muted-foreground">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t("currency")} {Math.abs(transaction.amount).toLocaleString()}
                      </div>
                      <Badge className={getStatusColor(transaction.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(transaction.status)}
                          <span>{getStatusText(transaction.status)}</span>
                        </div>
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common accounting tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex-col" variant="outline">
              <FileText className="h-6 w-6 mb-2" />
              <span>Generate Invoice</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <DollarSign className="h-6 w-6 mb-2" />
              <span>Record Payment</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Add Expense</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <Download className="h-6 w-6 mb-2" />
              <span>Export Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </DashboardLayout>
  )
}