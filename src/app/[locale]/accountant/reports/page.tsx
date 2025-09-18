"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Download,
  Calendar,
  Loader2
} from "lucide-react"

interface ReportSummary {
  totalRevenue: number
  totalInvoices: number
  averageInvoiceValue: number
  taxCollected: number
  customsFeeCollected: number
  reportPeriod: {
    startDate: string
    endDate: string
    type: string
  }
}

interface InvoiceStatus {
  status: string
  count: number
  amount: number
}

interface TopCustomer {
  customerId: string
  customerName: string
  customerEmail: string
  totalRevenue: number
  invoiceCount: number
}

interface MonthlyTrend {
  month: string
  revenue: number
  invoices: number
}

interface PaymentMethod {
  method: string
  amount: number
  percentage: number
}

interface ReportData {
  summary: ReportSummary
  invoicesByStatus: InvoiceStatus[]
  topCustomers: TopCustomer[]
  monthlyTrends: MonthlyTrend[]
  paymentMethods: PaymentMethod[]
}

export default function AccountantReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("monthly")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push("/auth/signin")
    } else {
      fetchReportData()
    }
  }, [session, status, router, reportType, selectedYear, selectedMonth])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: reportType,
        year: selectedYear.toString(),
        ...(reportType === "monthly" && { month: selectedMonth.toString() })
      })

      const response = await fetch(`/api/accountant/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch report data')
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التقرير",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ريال`
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل التقارير...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "ACCOUNTANT") {
    return null
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد بيانات تقرير متاحة</p>
            <Button onClick={fetchReportData} className="mt-4">
              إعادة المحاولة
            </Button>
          </div>
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
            <h1 className="text-3xl font-bold">التقارير المالية</h1>
            <p className="text-gray-600">تحليل شامل للأداء المالي والإيرادات</p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            تصدير التقرير
          </Button>
        </div>

        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="نوع التقرير" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">تقرير شهري</SelectItem>
                  <SelectItem value="yearly">تقرير سنوي</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {reportType === "monthly" && (
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="الشهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleString('ar', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(reportData.summary.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.summary.totalInvoices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط قيمة الفاتورة</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(reportData.summary.averageInvoiceValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الضرائب المحصلة</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(reportData.summary.taxCollected)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاه الإيرادات الشهرية</CardTitle>
              <CardDescription>الإيرادات خلال الـ 12 شهر الماضية</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Invoice Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع حالات الفواتير</CardTitle>
              <CardDescription>نسبة الفواتير حسب الحالة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.invoicesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {reportData.invoicesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>أفضل العملاء</CardTitle>
              <CardDescription>العملاء الأكثر إيراداً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topCustomers.slice(0, 5).map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{customer.customerName}</div>
                        <div className="text-sm text-gray-500">{customer.customerEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(customer.totalRevenue)}</div>
                      <div className="text-sm text-gray-500">{customer.invoiceCount} فاتورة</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>طرق الدفع</CardTitle>
              <CardDescription>توزيع المدفوعات حسب الطريقة</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Report Period Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-600">
              تقرير {reportType === 'monthly' ? 'شهري' : 'سنوي'} للفترة من{' '}
              {new Date(reportData.summary.reportPeriod.startDate).toLocaleDateString('ar-SA')} إلى{' '}
              {new Date(reportData.summary.reportPeriod.endDate).toLocaleDateString('ar-SA')}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
