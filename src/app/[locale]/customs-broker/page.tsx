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
  FileText,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  Download,
  Ship,
  Package,
} from "lucide-react"

export default function CustomsBrokerDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMS_BROKER") {
      router.push(`/${locale}/auth/signin`)
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "CUSTOMS_BROKER") {
    return null
  }

  // Mock customs broker data
  const brokerInfo = {
    name: session.user.name,
    licenseNumber: session.user.customsBrokerProfile?.licenseNumber || "CB-789012",
    totalShipments: 45,
    pendingClearances: 8,
    completedClearances: 37,
    totalFees: 15680,
  }

  // Mock shipments data
  const shipments = [
    {
      id: "TWB:4593",
      customer: "Customer Company",
      from: "Dammam",
      to: "Riyadh",
      status: "cleared",
      customsFee: 150,
      vat: 397.5,
      totalAmount: 3047.5,
      clearanceDate: "2025-08-14",
      goods: "LACTAILIS",
    },
    {
      id: "TWB:4596",
      customer: "Another Customer",
      from: "Jeddah",
      to: "Riyadh",
      status: "pending",
      estimatedFee: 200,
      goods: "Electronics",
    },
    {
      id: "TWB:4597",
      customer: "New Customer",
      from: "Dammam",
      to: "Jeddah",
      status: "inProgress",
      customsFee: 180,
      vat: 270,
      totalAmount: 2250,
      estimatedClearance: "2025-08-16",
      goods: "Food Items",
    },
    {
      id: "TWB:4598",
      customer: "Import Company",
      from: "Riyadh",
      to: "Dammam",
      status: "pending",
      estimatedFee: 300,
      goods: "Machinery",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared":
        return "bg-green-100 text-green-800"
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "cleared":
        return <CheckCircle className="h-4 w-4" />
      case "inProgress":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertTriangle className="h-4 w-4" />
      case "rejected":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const stats = {
    totalShipments: brokerInfo.totalShipments,
    pendingClearances: brokerInfo.pendingClearances,
    completedClearances: brokerInfo.completedClearances,
    totalFees: brokerInfo.totalFees,
    averageProcessingTime: "2.5 days",
    successRate: "94%",
  }

  return (
    <DashboardLayout
      title="Customs Broker Dashboard"
      subtitle={`Welcome back, ${brokerInfo.name}!`}
      actions={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Clearance Request
        </Button>
      }
    >
      {/* Broker Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Licensed Customs Broker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Broker Name</label>
              <p className="font-semibold">{brokerInfo.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">License Number</label>
              <p className="font-semibold">{brokerInfo.licenseNumber}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Total Shipments</label>
              <p className="font-semibold">{brokerInfo.totalShipments}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Success Rate</label>
              <p className="font-semibold">{stats.successRate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedClearances} cleared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearances</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClearances}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t("currency")} {stats.totalFees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProcessingTime}</div>
            <p className="text-xs text-muted-foreground">
              Processing time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipments & Clearances</CardTitle>
              <CardDescription>Manage customs clearance requests and track progress</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All Shipments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Ship className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{shipment.id}</h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{shipment.goods}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {shipment.from} → {shipment.to} • {shipment.customer}
                    </div>
                    {shipment.clearanceDate && (
                      <div className="text-sm text-green-600">
                        Cleared on: {new Date(shipment.clearanceDate).toLocaleDateString()}
                      </div>
                    )}
                    {shipment.estimatedClearance && (
                      <div className="text-sm text-blue-600">
                        Est. clearance: {new Date(shipment.estimatedClearance).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">
                      {shipment.totalAmount 
                        ? `${t("currency")} ${shipment.totalAmount.toLocaleString()}`
                        : `Est. ${t("currency")} ${shipment.estimatedFee}`
                      }
                    </div>
                    {shipment.vat && (
                      <div className="text-sm text-muted-foreground">
                        VAT: {t("currency")} {shipment.vat.toLocaleString()}
                      </div>
                    )}
                    <Badge className={getStatusColor(shipment.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(shipment.status)}
                        <span className="capitalize">{shipment.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {shipment.status === "pending" && (
                      <Button size="sm">
                        <Calculator className="h-3 w-3 mr-1" />
                        Calculate
                      </Button>
                    )}
                    {shipment.totalAmount && (
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Docs
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common customs broker tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex-col" variant="outline">
              <Plus className="h-6 w-6 mb-2" />
              <span>New Clearance</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <Calculator className="h-6 w-6 mb-2" />
              <span>Calculate Fees</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <FileText className="h-6 w-6 mb-2" />
              <span>Generate Docs</span>
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