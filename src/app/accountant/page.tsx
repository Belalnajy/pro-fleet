"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
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
} from "lucide-react"

export default function AccountantDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "ACCOUNTANT") {
    return null
  }

  // Mock financial data
  const financialStats = {
    totalRevenue: 45230,
    totalExpenses: 28950,
    netProfit: 16280,
    pendingInvoices: 8,
    overdueInvoices: 3,
    paidInvoices: 142,
    totalTransactions: 153,
  }

  // Mock invoices data
  const invoices = [
    {
      id: "INV-2025-001",
      customer: "Customer Company",
      amount: 3047.5,
      status: "paid",
      dueDate: "2025-08-21",
      paidDate: "2025-08-14",
      tripId: "TWB:4593",
    },
    {
      id: "INV-2025-002",
      customer: "Customer Company",
      amount: 460,
      status: "pending",
      dueDate: "2025-08-20",
      tripId: "TWB:4594",
    },
    {
      id: "INV-2025-003",
      customer: "Another Customer",
      amount: 1800,
      status: "overdue",
      dueDate: "2025-08-10",
      tripId: "TWB:4590",
    },
    {
      id: "INV-2025-004",
      customer: "New Customer",
      amount: 3500,
      status: "pending",
      dueDate: "2025-08-25",
      tripId: "TWB:4595",
    },
  ]

  // Mock recent transactions
  const recentTransactions = [
    {
      id: "TXN-001",
      type: "payment",
      description: "Payment for INV-2025-001",
      amount: 3047.5,
      date: "2025-08-14",
      status: "completed",
    },
    {
      id: "TXN-002",
      type: "expense",
      description: "Fuel cost for Trip TWB:4594",
      amount: -150,
      date: "2025-08-13",
      status: "completed",
    },
    {
      id: "TXN-003",
      type: "payment",
      description: "Partial payment for INV-2025-002",
      amount: 230,
      date: "2025-08-13",
      status: "completed",
    },
    {
      id: "TXN-004",
      type: "invoice",
      description: "New invoice generated",
      amount: 3500,
      date: "2025-08-12",
      status: "pending",
    },
  ]

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
      title="Accountant Dashboard"
      subtitle="Financial management and reporting"
      actions={
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>
      }
    >
      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {financialStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {financialStats.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {financialStats.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialStats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {financialStats.overdueInvoices} overdue
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
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest invoices and payment status</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">{invoice.id}</h3>
                      <div className="text-sm text-muted-foreground">
                        {invoice.customer} • Trip: {invoice.tripId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{t("currency")} {invoice.amount.toLocaleString()}</div>
                      <Badge className={getStatusColor(invoice.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(invoice.status)}
                          <span>{t(invoice.status)}</span>
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
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activities</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
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
                          <span>{t(transaction.status)}</span>
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
      <Card className="mt-6">
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
      </Card>
    </DashboardLayout>
  )
}