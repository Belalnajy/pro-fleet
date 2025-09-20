"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLoading } from "@/components/ui/loading"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { TrackingStatusIndicator } from "@/components/admin/tracking-status-indicator"
import {
  Users,
  Truck,
  DollarSign,
  FileText,
  TrendingUp,
  Settings,
  Plus,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

export default function AdminDashboard({ params }: { params: { locale: string } }) {
  const { locale } = params
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [seedLoading, setSeedLoading] = useState(false)
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    activeDrivers: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalExpenses: 0,
    totalUsers: 0,
    totalVehicles: 0,
    pendingInvoices: 0,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchStats()
    }
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDemoData = async () => {
    setSeedLoading(true)
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      })
      if (response.ok) {
        alert("Demo data seeded successfully!")
        window.location.reload()
      } else {
        alert("Failed to seed demo data")
      }
    } catch (error) {
      alert("Error seeding demo data")
    } finally {
      setSeedLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <PageLoading text={t("loading")} />
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  // Use real stats data
  const kpis = {
    totalUsers: stats.totalUsers,
    totalVehicles: stats.totalVehicles,
    totalTrips: stats.totalTrips,
    totalRevenue: stats.yearlyRevenue,
    activeDrivers: stats.activeDrivers,
    pendingInvoices: stats.pendingInvoices,
    monthlyRevenue: stats.monthlyRevenue,
    todayRevenue: stats.todayRevenue,
    activeTrips: stats.activeTrips,
    totalExpenses: stats.totalExpenses,
  }

  const managementActions = [
    {
      title: t("manageUsers"),
      description: t("manageUsersDesc"),
      icon: Users,
      href: "/admin/users",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t("manageVehicles"),
      description: t("manageVehiclesDesc"),
      icon: Truck,
      href: "/admin/vehicles",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t("managePricing"),
      description: t("managePricingDesc"),
      icon: DollarSign,
      href: "/admin/pricing",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: t("tripManagement"),
      description: t("tripManagementDesc"),
      icon: Activity,
      href: "/admin/trips",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: t("invoiceManagement"),
      description: t("invoiceManagementDesc"),
      icon: FileText,
      href: "/admin/invoices",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: t("reportsAnalytics"),
      description: t("reportsAnalyticsDesc"),
      icon: BarChart3,
      href: "/admin/reports",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: t("subscriptionPlans"),
      description: t("subscriptionPlansDesc"),
      icon: Settings,
      href: "/admin/subscriptions",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: t("systemSettings"),
      description: t("systemSettingsDesc"),
      icon: Settings,
      href: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: "user_created",
      message: t("newDriverCreated"),
      time: `2 ${t("minutesAgo")}`,
      status: "success",
    },
    {
      id: 2,
      type: "trip_completed",
      message: t("tripCompleted"),
      time: `1 ${t("hourAgo")}`,
      status: "success",
    },
    {
      id: 3,
      type: "invoice_generated",
      message: t("invoiceGenerated"),
      time: `3 ${t("hoursAgo")}`,
      status: "info",
    },
    {
      id: 4,
      type: "system_alert",
      message: t("maintenanceDue"),
      time: `5 ${t("hoursAgo")}`,
      status: "warning",
    },
  ]

  return (
    <DashboardLayout
      title={t("dashboard")}
      subtitle={t("reportsAnalyticsDesc")}
      actions={
        <Button onClick={handleSeedDemoData} disabled={seedLoading}>
          {seedLoading ? t("seeding") : t("seedDemoData")}
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalTrips")}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.activeTrips} {t("activeNow")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("drivers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              {t("outOf")} {kpis.totalUsers} {t("totalUsers")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("todayRevenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis.todayRevenue.toLocaleString()} {t("currency")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("today")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("monthlyRevenue")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {kpis.monthlyRevenue.toLocaleString()} {t("currency")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("thisMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("yearlyRevenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {kpis.totalRevenue.toLocaleString()} {t("currency")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("thisYear")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalExpenses")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {kpis.totalExpenses.toLocaleString()} {t("currency")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("operationalCosts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalVehicles")}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {t("fleetSize")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pendingInvoices")}</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpis.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {t("requiresAttention")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Tracking Status */}
      <div className="mb-8">
        <TrackingStatusIndicator />
      </div>

      {/* Management Actions Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">{t("managementActions")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {managementActions.map((action) => (
            <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-4`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/${language}${action.href}`)}
                >
                  {t("manage")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivities")}</CardTitle>
            <CardDescription>{t("recentActivitiesDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === "success" ? "bg-green-500" :
                      activity.status === "warning" ? "bg-yellow-500" :
                      activity.status === "error" ? "bg-red-500" : "bg-blue-500"
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  <Badge variant={
                    activity.status === "success" ? "default" :
                    activity.status === "warning" ? "secondary" :
                    activity.status === "error" ? "destructive" : "outline"
                  }>
                    {activity.status === "success" ? t("success") :
                     activity.status === "warning" ? t("warning") :
                     activity.status === "error" ? t("error") : t("info")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("quickStats")}</CardTitle>
            <CardDescription>{t("quickStatsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{t("completedTrips")}</span>
                </div>
                <span className="font-semibold">142</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{t("inProgress")}</span>
                </div>
                <span className="font-semibold">6</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">{t("pendingTrips")}</span>
                </div>
                <span className="font-semibold">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">{t("pendingInvoices")}</span>
                </div>
                <span className="font-semibold">{kpis.pendingInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{t("activeDrivers")}</span>
                </div>
                <span className="font-semibold">{kpis.activeDrivers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}