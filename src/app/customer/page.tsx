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

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
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

  // Mock trips data
  const trips = [
    {
      id: "TWB:4593",
      from: "Dammam",
      to: "Riyadh",
      status: "delivered",
      scheduledDate: "2025-08-14",
      deliveredDate: "2025-08-14T16:00:00",
      vehicle: "5 Ton Truck",
      temperature: "+2°C",
      price: 2500,
      notes: "LACTAILIS shipment",
    },
    {
      id: "TWB:4594",
      from: "Jeddah",
      to: "Jeddah",
      status: "inProgress",
      scheduledDate: "2025-08-13",
      vehicle: "10 Ton Truck",
      temperature: "Ambient",
      price: 400,
      notes: "Food items - local delivery",
    },
    {
      id: "TWB:4595",
      from: "Riyadh",
      to: "Dammam",
      status: "pending",
      scheduledDate: "2025-08-15",
      vehicle: "40 ft Truck",
      temperature: "+10°C",
      price: 3500,
      notes: "Pending assignment",
    },
  ]

  // Mock invoices data
  const invoices = [
    {
      id: "INV-2025-001",
      tripId: "TWB:4593",
      amount: 3047.5,
      status: "paid",
      dueDate: "2025-08-21",
      paidDate: "2025-08-14",
    },
    {
      id: "INV-2025-002",
      tripId: "TWB:4594",
      amount: 460,
      status: "pending",
      dueDate: "2025-08-20",
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
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
      case "paid":
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

  const stats = {
    totalTrips: trips.length,
    completedTrips: trips.filter(t => t.status === "delivered").length,
    pendingTrips: trips.filter(t => t.status === "pending").length,
    totalSpent: invoices.reduce((sum, inv) => sum + inv.amount, 0),
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
            <CardTitle className="text-sm font-medium">Pending Trips</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTrips}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
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
            <div className="space-y-4">
              {trips.slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
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
                        {trip.vehicle} • {trip.temperature}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold">{t("currency")} {trip.price}</div>
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
                      <div className="font-semibold">{t("currency")} {invoice.amount.toLocaleString()}</div>
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