"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { translations } from "@/lib/translations"
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

interface CustomerDashboardProps {
  params: Promise<{
    locale: string
  }>
}

export default function CustomerDashboard({ params }: CustomerDashboardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = use(params)
  const { t, language } = useLanguage()

  // Customer-specific translation function to avoid key conflicts
  const translate = (key: string): string => {
    const customerTranslations = translations[language as keyof typeof translations];
    if (customerTranslations && typeof customerTranslations === 'object') {
      const translation = (customerTranslations as any)[key];
      if (translation && typeof translation === 'string') {
        return translation;
      }
    }
    return t(key as any) || key;
  };
  const [trips, setTrips] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching customer dashboard data...')
      console.log('Session user:', session?.user)
      
      // Fetch trips
      const tripsResponse = await fetch("/api/customer/trips")
      console.log('Trips API response status:', tripsResponse.status)
      
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json()
        setTrips(tripsData)
        console.log("✅ Customer trips loaded:", tripsData)
        console.log(`📊 Found ${tripsData.length} trips`)
      } else {
        const errorData = await tripsResponse.json()
        console.error('❌ Failed to fetch trips:', errorData)
      }
      
      // Fetch real invoices from API
      try {
        const invoicesResponse = await fetch("/api/customer/invoices")
        console.log('Invoices API response status:', invoicesResponse.status)
        
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
          console.log("✅ Customer invoices loaded:", invoicesData)
          console.log(`📄 Found ${invoicesData.length} invoices`)
        } else {
          const errorData = await invoicesResponse.json()
          console.error('❌ Failed to fetch invoices:', errorData)
          setInvoices([])
        }
      } catch (error) {
        console.error("Error fetching invoices:", error)
        setInvoices([])
      }
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "CUSTOMER") {
    return null
  }

  // Mock customer data
  const customerInfo = {
    name: session.user.name,
    companyName: session.user.customerProfile?.companyName || "Customer Company",
    address: session.user.customerProfile?.address || "Riyadh, Saudi Arabia",
    preferredLang: session.user.customerProfile?.preferredLang || "en",
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
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "delivered":
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "IN_PROGRESS":
      case "inProgress":
        return <Truck className="h-4 w-4" />
      case "PENDING":
      case "pending":
        return <Clock className="h-4 w-4" />
      case "CANCELLED":
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const stats = {
    totalTrips: trips.length,
    completedTrips: trips.filter(t => t.status === "DELIVERED").length,
    pendingTrips: trips.filter(t => t.status === "PENDING").length,
    inProgressTrips: trips.filter(t => t.status === "IN_PROGRESS").length,
    totalSpent: trips.reduce((sum, trip) => sum + (trip.price || 0), 0),
    // Updated to work with real invoice data structure
    pendingPayments: invoices.filter(inv => inv.status === "PENDING" || inv.status === "SENT").reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === "PAID").length,
    overdueInvoices: invoices.filter(inv => inv.status === "OVERDUE").length,
  }

  return (
    <DashboardLayout
      title={t("customerDashboard")}
      subtitle={`${t("welcomeBack")}, ${customerInfo.name}!`}
      actions={
        <Button onClick={() => router.push(`/${locale}/customer/book-trip`)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("bookNewTrip")}
        </Button>
      }
    >
      {/* Customer Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("companyInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t("companyName")}</label>
              <p className="font-semibold">{customerInfo.companyName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t("contactPerson")}</label>
              <p className="font-semibold">{customerInfo.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t("address")}</label>
              <p className="font-semibold">{customerInfo.address}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{t("language")}</label>
              <p className="font-semibold">{customerInfo.preferredLang.toUpperCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalTrips")}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTrips} {t("completed")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalSpent")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {translate("currency")} {stats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("lifetimeSpending")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeTrips")}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTrips}</div>
            <p className="text-xs text-muted-foreground">
              {t("currentlyInTransit")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pendingPayments")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {translate("currency")} {stats.pendingPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dueSoon")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Trips */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recentTrips")}</CardTitle>
                <CardDescription>{t("latestShipmentActivities")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/customer/my-trips`)}>
                {t("viewAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("noTripsFound")}</p>
                <Button onClick={() => router.push(`/${locale}/customer/book-trip`)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("bookYourFirstTrip")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Truck className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{trip.tripNumber}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.fromCity?.name}</span>
                          <span>→</span>
                          <span>{trip.toCity?.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trip.vehicle?.type} ({trip.vehicle?.capacity}) • {trip.temperature?.option}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("scheduled")}: {new Date(trip.scheduledDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">SAR {trip.price?.toLocaleString()}</div>
                        <Badge className={getStatusColor(trip.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(trip.status)}
                            <span>{t(trip.status || 'PENDING')}</span>
                          </div>
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/customer/my-trips`)}>
                        {t("view")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recentInvoices")}</CardTitle>
                <CardDescription>{t("billingPaymentHistory")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/customer/invoices`)}>
                {t("viewAll")}
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
                        {t("trip")}: {invoice.tripId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t("due")}: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{translate("currency")} {(invoice.amount || 0).toLocaleString()}</div>
                      <Badge className={getStatusColor(invoice.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(invoice.status)}
                          <span>{t(invoice.status)}</span>
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
      </div>
    </DashboardLayout>
  )
}