"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
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

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [trips, setTrips] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push("/auth/signin")
    } else {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch trips
      const tripsResponse = await fetch("/api/customer/trips")
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json()
        setTrips(tripsData)
        console.log("Customer trips loaded:", tripsData)
      }
      
      // Fetch invoices (if API exists)
      try {
        const invoicesResponse = await fetch("/api/customer/invoices")
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json()
          setInvoices(invoicesData)
        }
      } catch (error) {
        console.log("Invoices API not available yet")
        // Use mock data for invoices for now
        setInvoices([
          {
            id: "INV-2025-001",
            tripId: "TWB:0001",
            amount: 3047.5,
            status: "paid",
            dueDate: "2025-08-21",
            paidDate: "2025-08-14",
          },
          {
            id: "INV-2025-002",
            tripId: "TWB:0002",
            amount: 460,
            status: "pending",
            dueDate: "2025-08-20",
          },
        ])
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
    pendingPayments: invoices.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.amount, 0),
  }

  return (
    <DashboardLayout
      title="Customer Dashboard"
      subtitle={`Welcome back, ${customerInfo.name}!`}
      actions={
        <Button onClick={() => router.push("/customer/book-trip")}>
          <Plus className="h-4 w-4 mr-2" />
          Book New Trip
        </Button>
      }
    >
      {/* Customer Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="font-semibold">{customerInfo.companyName}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
              <p className="font-semibold">{customerInfo.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="font-semibold">{customerInfo.address}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Language</label>
              <p className="font-semibold">{customerInfo.preferredLang.toUpperCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrips}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTrips} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTrips}</div>
            <p className="text-xs text-muted-foreground">
              Currently in transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.pendingPayments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Due soon
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
                <CardTitle>Recent Trips</CardTitle>
                <CardDescription>Your latest shipment activities</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
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
                <p className="text-muted-foreground">No trips found</p>
                <Button onClick={() => router.push("/customer/book-trip")} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Book Your First Trip
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
                          Scheduled: {new Date(trip.scheduledDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">SAR {trip.price?.toLocaleString()}</div>
                        <Badge className={getStatusColor(trip.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(trip.status)}
                            <span>{trip.status?.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push("/customer/my-trips")}>
                        View
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
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Your billing and payment history</CardDescription>
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
                        Trip: {invoice.tripId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{t("currency")} {(invoice.amount || 0).toLocaleString()}</div>
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