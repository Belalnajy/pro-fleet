"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Area,
  AreaChart,
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
} from "lucide-react"

interface ReportData {
  monthlyRevenue: Array<{ month: string; revenue: number; trips: number; expenses: number; profit: number }>
  cityStats: Array<{ city: string; trips: number; revenue: number; avgPrice: number }>
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
  topRoutes: Array<{ route: string; trips: number; revenue: number; popularity: number }>
  driverPerformance: Array<{ driver: string; trips: number; rating: number; revenue: number }>
}

interface KPIData {
  totalRevenue: number
  totalTrips: number
  activeCustomers: number
  averageOrderValue: number
  growthRate: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [reportData, setReportData] = useState<ReportData>({
    monthlyRevenue: [],
    cityStats: [],
    vehicleTypeStats: [],
    customerStats: [],
    dailyStats: [],
    performanceMetrics: {
      totalRevenue: 0,
      totalTrips: 0,
      avgOrderValue: 0,
      customerRetention: 0,
      profitMargin: 0,
      growthRate: 0,
    },
    topRoutes: [],
    driverPerformance: [],
  })
  const [kpiData, setKpiData] = useState<KPIData>({
    totalRevenue: 0,
    totalTrips: 0,
    activeCustomers: 0,
    averageOrderValue: 0,
    growthRate: 0,
  })
  const [dateRange, setDateRange] = useState("last30days")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNTANT")) {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchReportData()
    }
  }, [session, status, router, dateRange])

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/admin/reports?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.reportData)
        setKpiData(data.kpiData)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/admin/reports/export?range=${dateRange}&format=pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reports-${dateRange}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting PDF:", error)
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`/api/admin/reports/export?range=${dateRange}&format=excel`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reports-${dateRange}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting Excel:", error)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t("loading")}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{t("reports")}</h1>
            <p className="text-muted-foreground">{t("businessAnalyticsAndReports")}</p>
          </div>
          <div className="flex items-center space-x-2 flex-wrap justify-end gap-5 md:gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("selectDateRange")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">{t("last7Days")}</SelectItem>
                <SelectItem value="last30days">{t("last30Days")}</SelectItem>
                <SelectItem value="last3months">{t("last3Months")}</SelectItem>
                <SelectItem value="last6months">{t("last6Months")}</SelectItem>
                <SelectItem value="lastyear">{t("lastYear")}</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full md:w-auto" variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              {t("exportExcel")}
            </Button>
            <Button className="w-full md:w-auto " variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              {t("exportPDF")}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalRevenue")}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpiData.totalRevenue.toFixed(2)} {t("currency")}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {kpiData.growthRate >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                {Math.abs(kpiData.growthRate).toFixed(1)}% {t("fromLastPeriod")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalTrips")}</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalTrips}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("activeCustomers")}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.activeCustomers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("averageOrderValue")}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpiData.averageOrderValue.toFixed(2)} {t("currency")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("growthRate")}</CardTitle>
              {kpiData.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpiData.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpiData.growthRate >= 0 ? '+' : ''}{kpiData.growthRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <div className="w-full overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 h-auto p-1 bg-muted rounded-lg">
              <TabsTrigger 
                value="revenue" 
                className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("revenueAnalysis")}
              </TabsTrigger>
              <TabsTrigger 
                value="trips" 
                className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("tripAnalysis")}
              </TabsTrigger>
              <TabsTrigger 
                value="cities" 
                className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("cityAnalysis")}
              </TabsTrigger>
              <TabsTrigger 
                value="vehicles" 
                className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("vehicleAnalysis")}
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("customerAnalysis")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("monthlyRevenue")}</CardTitle>
                  <CardDescription>{t("revenueOverTime")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportData.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("dailyTrends")}</CardTitle>
                  <CardDescription>{t("dailyRevenueAndTrips")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" name={t("revenue")} />
                      <Line type="monotone" dataKey="trips" stroke="#82ca9d" name={t("trips")} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("tripStatistics")}</CardTitle>
                <CardDescription>{t("tripsOverTime")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="trips" fill="#8884d8" name={t("trips")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cities" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tripsByCity")}</CardTitle>
                  <CardDescription>{t("mostPopularRoutes")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.cityStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="trips" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t("revenueByCity")}</CardTitle>
                  <CardDescription>{t("cityRevenueDistribution")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.cityStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ city, percent }) => `${city} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {reportData.cityStats.map((entry, index) => (
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

          <TabsContent value="vehicles" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("vehicleTypeUsage")}</CardTitle>
                  <CardDescription>{t("mostUsedVehicleTypes")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.vehicleTypeStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="usage"
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
              <Card>
                <CardHeader>
                  <CardTitle>{t("vehicleTypeRevenue")}</CardTitle>
                  <CardDescription>{t("revenueByVehicleType")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.vehicleTypeStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("topCustomers")}</CardTitle>
                <CardDescription>{t("customersByRevenueAndTrips")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.customerStats.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="customer" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name={t("revenue")} />
                    <Bar dataKey="trips" fill="#82ca9d" name={t("trips")} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
