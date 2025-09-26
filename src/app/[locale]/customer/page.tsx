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
  Shield,
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
      case "PAID":
      case "paid":
        return "bg-green-100 text-green-800"
      case "ASSIGNED":
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "IN_TRANSIT":
      case "inTransit":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
      case "overdue":
        return "bg-red-100 text-red-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "EN_ROUTE_PICKUP":
      case "enRoutePickup":
        return "bg-blue-100 text-blue-800"
      case "AT_PICKUP":
      case "atPickup":
        return "bg-blue-100 text-blue-800"
      case "PICKED_UP":
      case "pickedUp":
        return "bg-blue-100 text-blue-800"
      case "AT_DESTINATION":
      case "atDestination":
        return "bg-blue-100 text-blue-800"
      case "SENT":
      case "sent":
        return "bg-blue-100 text-blue-800"
        
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return t('pendingStatus')
      case 'SENT':
      case 'sent':
        return t('sentStatus')
      case 'PAID':
      case 'paid':
        return t('paidStatus')
      case 'OVERDUE':
      case 'overdue':
        return t('overdueStatus')
      case 'CANCELLED':
      case 'cancelled':
        return t('cancelled')
      case 'PARTIAL':
      case 'partial':
        return t('partialStatus')
      case 'INSTALLMENT':
      case 'installment':
        return t('installmentStatus')
      case 'ASSIGNED':
      case 'assigned':
        return t('assignedStatus')
      default:
        return status
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
      case "EN_ROUTE_PICKUP":
      case "enRoutePickup":
        return <Truck className="h-4 w-4" />
      case "AT_PICKUP":
      case "atPickup":
        return <Truck className="h-4 w-4" />
      case "PICKED_UP":
      case "pickedUp":
        return <Truck className="h-4 w-4" />
      case "AT_DESTINATION":
      case "atDestination":
        return <Truck className="h-4 w-4" />
      case "SENT":
      case "sent":
        return <Truck className="h-4 w-4" />
      case "ASSIGNED":
      case "assigned":
        return <Truck className="h-4 w-4" />
      case "IN_TRANSIT":
      case "inTransit":
        return <Truck className="h-4 w-4" />
      case "OVERDUE":
      case "overdue":
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
    customsClearances: invoices.filter(inv => inv.customsBroker).length,
  }

  return (
    <DashboardLayout
      title={t("customerDashboard")}
      subtitle={`${t("welcomeBack")}, ${customerInfo.name}!`}
      actions={
        <Button onClick={() => router.push(`/${locale}/customer/book-trip`)} className="w-full sm:w-auto">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="text-xs sm:text-sm">{t("bookNewTrip")}</span>
        </Button>
      }
    >
      {/* Customer Info Card */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{t("companyInformation")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("companyName")}</label>
              <p className="font-semibold text-sm sm:text-base truncate">{customerInfo.companyName}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("contactPerson")}</label>
              <p className="font-semibold text-sm sm:text-base truncate">{customerInfo.name}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("address")}</label>
              <p className="font-semibold text-sm sm:text-base truncate">{customerInfo.address}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">{t("language")}</label>
              <p className="font-semibold text-sm sm:text-base">{customerInfo.preferredLang.toUpperCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">{t("totalTrips")}</CardTitle>
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground truncate">
              {stats.completedTrips} {t("completed")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">{t("totalSpent")}</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold truncate">
              {translate("currency")} {stats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {t("lifetimeSpending")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">{t("activeTrips")}</CardTitle>
            <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.inProgressTrips}</div>
            <p className="text-xs text-muted-foreground truncate">
              {t("currentlyInTransit")}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">{t("pendingPayments")}</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg sm:text-2xl font-bold truncate">
              {translate("currency")} {stats.pendingPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {t("dueSoon")}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => router.push(`/${locale}/customer/clearances`)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">{t("customsClearances")}</CardTitle>
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.customsClearances || 0}</div>
            <p className="text-xs text-muted-foreground truncate">
              activeClearances
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Trips */}
        <Card className="h-fit">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl truncate">{t("recentTrips")}</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">{t("latestShipmentActivities")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0" onClick={() => router.push(`/${locale}/customer/my-trips`)}>
                <span className="text-xs sm:text-sm">{t("viewAll")}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center h-24 sm:h-32">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Truck className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{t("noTripsFound")}</p>
                <Button onClick={() => router.push(`/${locale}/customer/book-trip`)} className="w-full sm:w-auto">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">{t("bookYourFirstTrip")}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {trips.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start sm:items-center space-x-3 mb-3 sm:mb-0 min-w-0 flex-1">
                      <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0 mt-1 sm:mt-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{trip.tripNumber}</h3>
                        <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{trip.fromCity?.name}</span>
                          <span className="flex-shrink-0">→</span>
                          <span className="truncate">{trip.toCity?.name}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {trip.vehicle?.vehicleNumber} • {trip.temperature?.option}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {t("scheduled")}: {new Date(trip.scheduledDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col lg:flex-row items-center justify-between sm:justify-end space-x-3 sm:space-x-4 lg:space-x-4 sm:space-y-2 lg:space-y-0">
                      <div className="text-left sm:text-right">
                        <div className="font-semibold text-sm sm:text-base">SAR {trip.price?.toLocaleString()}</div>
                        <Badge className={`${getStatusColor(trip.status)} text-xs`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(trip.status)}
                            <span className="hidden sm:inline">{t(trip.status || 'PENDING')}</span>
                          </div>
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => router.push(`/${locale}/customer/my-trips`)}>
                        <span className="text-xs sm:text-sm">{t("view")}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="h-fit">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl truncate">{t("recentInvoices")}</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">{t("billingPaymentHistory")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0" onClick={() => router.push(`/${locale}/customer/invoices`)}>
                <span className="text-xs sm:text-sm">{t("viewAll")}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {invoices.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">{t("noInvoicesFound") || "لا توجد فواتير"}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start sm:items-center space-x-3 mb-3 sm:mb-0 min-w-0 flex-1">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0 mt-1 sm:mt-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{invoice.invoiceNumber}</h3>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {t("trip")}: {invoice.tripNumber}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {t("due")}: {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col lg:flex-row items-center justify-between sm:justify-end space-x-3 sm:space-x-4 lg:space-x-4 sm:space-y-2 lg:space-y-0">
                      <div className="text-left sm:text-right">
                        <div className="font-semibold text-sm sm:text-base truncate">{translate("currency")} {(invoice.totalAmount || 0).toLocaleString()}</div>
                        <Badge className={`${getStatusColor(invoice.status)} text-xs`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(invoice.status)}
                            <span className="hidden sm:inline">{getStatusText(invoice.status)}</span>
                          </div>
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="flex-shrink-0">
                        <span className="text-xs sm:text-sm">{t("view")}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}