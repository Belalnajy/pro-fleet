"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoading } from "@/components/ui/loading"
import { useLanguage } from "@/components/providers/language-provider"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Users,
  MapPin,
  Calendar,
  FileText,
  BarChart3,
  Target,
  Award,
  Activity,
} from "lucide-react"

interface EnhancedReportData {
  monthlyRevenue: Array<{ month: string; revenue: number; trips: number; expenses: number; profit: number; avgOrderValue: number }>
  topRoutes: Array<{ route: string; trips: number; revenue: number; popularity: number }>
  vehicleTypeStats: Array<{ type: string; usage: number; revenue: number; efficiency: number }>
  customerStats: Array<{ customer: string; trips: number; revenue: number; avgOrderValue: number }>
  dailyStats: Array<{ date: string; trips: number; revenue: number; newCustomers: number }>
  performanceMetrics: {
    totalRevenue: number
    totalTrips: number
    avgOrderValue: number
    customerRetention: number
    profitMargin: number
    growthRate: number
  }
  driverPerformance: Array<{ driver: string; trips: number; rating: number; revenue: number }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function EnhancedReports() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [reportData, setReportData] = useState<EnhancedReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("month")

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      router.push("/auth/signin")
    } else {
      fetchReportData()
    }
  }, [session, status, router, dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports/enhanced?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Error fetching enhanced report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (format: string) => {
    try {
      const response = await fetch(`/api/admin/reports/export?range=${dateRange}&format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `enhanced-report-${dateRange}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting report:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading text={t("loadingReports")} />
      </DashboardLayout>
    )
  }

  if (!reportData) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p>{t("noReportData")}</p>
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
            <h1 className="text-3xl font-bold">{t("enhancedReports")}</h1>
            <p className="text-muted-foreground">{t("comprehensiveBusinessAnalytics")}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t("lastWeek")}</SelectItem>
                <SelectItem value="month">{t("lastMonth")}</SelectItem>
                <SelectItem value="quarter">{t("lastQuarter")}</SelectItem>
                <SelectItem value="year">{t("lastYear")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              {t("exportPDF")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              {t("exportExcel")}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reportData.performanceMetrics.totalRevenue.toFixed(2)} {t("currency")}
              </div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{reportData.performanceMetrics.growthRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalTrips")}</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.performanceMetrics.totalTrips}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("avgOrderValue")}</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {reportData.performanceMetrics.avgOrderValue.toFixed(2)} {t("currency")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("customerRetention")}</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {reportData.performanceMetrics.customerRetention.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("profitMargin")}</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reportData.performanceMetrics.profitMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("growthRate")}</CardTitle>
              <Activity className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                +{reportData.performanceMetrics.growthRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="revenue">{t("revenueAnalysis")}</TabsTrigger>
            <TabsTrigger value="routes">{t("routePerformance")}</TabsTrigger>
            <TabsTrigger value="customers">{t("customerAnalysis")}</TabsTrigger>
            <TabsTrigger value="drivers">{t("driverPerformance")}</TabsTrigger>
            <TabsTrigger value="trends">{t("trendAnalysis")}</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("monthlyRevenueAndProfit")}</CardTitle>
                  <CardDescription>{t("revenueVsProfitAnalysis")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name={t("revenue")} />
                      <Bar dataKey="profit" fill="#82ca9d" name={t("profit")} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("vehicleTypeEfficiency")}</CardTitle>
                  <CardDescription>{t("revenuePerVehicleType")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={reportData.vehicleTypeStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {reportData.vehicleTypeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("topPerformingRoutes")}</CardTitle>
                <CardDescription>{t("mostProfitableRoutes")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={reportData.topRoutes} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="route" type="category" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name={t("revenue")} />
                    <Bar dataKey="trips" fill="#82ca9d" name={t("trips")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("topCustomers")}</CardTitle>
                <CardDescription>{t("customersByRevenueAndLoyalty")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={reportData.customerStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name={t("revenue")} />
                    <Bar dataKey="avgOrderValue" fill="#82ca9d" name={t("avgOrderValue")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("driverPerformanceMetrics")}</CardTitle>
                <CardDescription>{t("topPerformingDrivers")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={reportData.driverPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="driver" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name={t("revenue")} />
                    <Bar dataKey="trips" fill="#82ca9d" name={t("trips")} />
                    <Bar dataKey="rating" fill="#ffc658" name={t("rating")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("dailyTrends")}</CardTitle>
                <CardDescription>{t("last30DaysPerformance")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reportData.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" name={t("revenue")} />
                    <Area type="monotone" dataKey="trips" stackId="2" stroke="#82ca9d" fill="#82ca9d" name={t("trips")} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
