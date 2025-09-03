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
  AlertTriangle,
  Navigation,
  Phone,
  FileText,
} from "lucide-react"

export default function DriverDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DRIVER") {
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

  if (!session || session.user.role !== "DRIVER") {
    return null
  }

  // Mock driver data
  const driverInfo = {
    name: session.user.name,
    nationality: session.user.driverProfile?.nationality || "Saudi",
    carPlateNumber: session.user.driverProfile?.carPlateNumber || "5580",
    carRegistration: session.user.driverProfile?.carRegistration || "IST-123456",
    licenseExpiry: session.user.driverProfile?.licenseExpiry || "2026-12-31",
    isAvailable: session.user.driverProfile?.isAvailable ?? true,
    trackingEnabled: session.user.driverProfile?.trackingEnabled ?? false,
  }

  // Mock trips data
  const trips = [
    {
      id: "TWB:4594",
      from: "Jeddah",
      to: "Jeddah",
      status: "inProgress",
      scheduledDate: "2025-08-13",
      actualStartDate: "2025-08-13T09:00:00",
      customer: "Customer Company",
      vehicle: "10 Ton Truck",
      temperature: "Ambient",
      notes: "Food items - local delivery",
    },
    {
      id: "TWB:4596",
      from: "Riyadh",
      to: "Dammam",
      status: "pending",
      scheduledDate: "2025-08-16",
      customer: "Customer Company",
      vehicle: "5 Ton Truck",
      temperature: "+2°C",
      notes: "Awaiting assignment",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "inProgress":
        return <Navigation className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout
      title="Driver Dashboard"
      subtitle={`Welcome back, ${driverInfo.name}!`}
    >
      {/* Driver Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Driver Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="font-semibold">{driverInfo.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nationality</label>
              <p className="font-semibold">{driverInfo.nationality}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Car Plate</label>
              <p className="font-semibold">{driverInfo.carPlateNumber}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">License Expiry</label>
              <p className="font-semibold">{new Date(driverInfo.licenseExpiry).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4">
            <Badge variant={driverInfo.isAvailable ? "default" : "secondary"}>
              {driverInfo.isAvailable ? "Available" : "Unavailable"}
            </Badge>
            <Badge variant={driverInfo.trackingEnabled ? "default" : "outline"}>
              Tracking {driverInfo.trackingEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Current Trip */}
      {trips.find(trip => trip.status === "inProgress") && (
        <Card className="mb-6 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Navigation className="h-5 w-5" />
              <span>Current Trip</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const currentTrip = trips.find(trip => trip.status === "inProgress")!
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{currentTrip.id}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{currentTrip.from}</span>
                        <span>→</span>
                        <span>{currentTrip.to}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(currentTrip.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(currentTrip.status)}
                        <span>{t(currentTrip.status)}</span>
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Customer</label>
                      <p className="font-semibold">{currentTrip.customer}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                      <p className="font-semibold">{currentTrip.vehicle}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                      <p className="font-semibold">{currentTrip.temperature}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Started: {new Date(currentTrip.actualStartDate!).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Navigation className="h-4 w-4 mr-2" />
                      Start Navigation
                    </Button>
                    <Button variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Customer
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Available Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Available Trips</CardTitle>
          <CardDescription>Trips assigned to you or available for assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trips.filter(trip => trip.status !== "inProgress").map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                      {trip.customer} • {trip.vehicle} • {trip.temperature}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled: {new Date(trip.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(trip.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(trip.status)}
                      <span>{t(trip.status)}</span>
                    </div>
                  </Badge>
                  <div className="flex space-x-2">
                    {trip.status === "pending" && (
                      <>
                        <Button size="sm">Accept</Button>
                        <Button variant="outline" size="sm">Decline</Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      {t("view")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}