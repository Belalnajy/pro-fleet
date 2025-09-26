"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import {
  Truck,
  Users,
  SaudiRiyal,
  FileText,
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

export default function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push(`/${locale}/auth/signin`)
      return
    }

    // Redirect to role-specific dashboard
    if (session.user.role) {
      switch (session.user.role) {
        case "ADMIN":
          router.push("/admin")
          break
        case "DRIVER":
          router.push("/driver")
          break
        case "CUSTOMER":
          router.push("/customer")
          break
        case "ACCOUNTANT":
          router.push("/accountant")
          break
        case "CUSTOMS_BROKER":
          router.push("/customs-broker")
          break
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to signin
  }

  // Mock data for dashboard
  const stats = {
    totalTrips: 156,
    revenue: 45230,
    expenses: 28950,
    activeDrivers: 12,
    pendingInvoices: 8,
    completedTrips: 142,
    cancelledTrips: 4,
  }

  const recentTrips = [
    {
      id: "TWB:4593",
      from: "Dammam",
      to: "Riyadh",
      status: "delivered",
      driver: "Abdelbagi Ali",
      vehicle: "Truck 5580",
      date: "2025-08-14",
    },
    {
      id: "TWB:4594",
      from: "Jeddah",
      to: "Jeddah",
      status: "inProgress",
      driver: "Nazim Hussain",
      vehicle: "Truck 1275",
      date: "2025-08-13",
    },
    {
      id: "TWB:4595",
      from: "Riyadh",
      to: "Dammam",
      status: "pending",
      driver: "Unassigned",
      vehicle: "Unassigned",
      date: "2025-08-15",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "inProgress":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout
      title={t("dashboard")}
      subtitle={`Welcome back, ${session.user.name}!`}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalTrips")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("revenue")}
            </CardTitle>
            <SaudiRiyal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("expenses")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.expenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeDrivers")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              2 on leave
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentTrips")}</CardTitle>
          <CardDescription>
            Latest trip activities and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Truck className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{trip.id}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{trip.from}</span>
                      <span>→</span>
                      <span>{trip.to}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.driver} • {trip.vehicle}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{trip.date}</div>
                    <Badge className={getStatusColor(trip.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(trip.status)}
                        <span>{t(trip.status)}</span>
                      </div>
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    {t("view")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}