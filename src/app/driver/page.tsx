"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/providers/language-provider"
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Phone,
  Eye,
} from "lucide-react"

export default function DriverDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DRIVER") {
      router.push("/auth/signin")
    } else {
      fetchTrips()
    }
  }, [session, status, router])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/driver/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
        console.log("Driver trips loaded:", data)
      } else {
        console.error("Failed to fetch trips:", response.status)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTripAction = async (tripId: string, action: "accept" | "decline") => {
    try {
      setActionLoading(tripId)
      const response = await fetch("/api/driver/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, action })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Trip ${action}ed:`, result)
        
        // Refresh trips list
        await fetchTrips()
        
        // Show success toast
        toast({
          title: action === "accept" ? "✅ تم قبول الرحلة" : "❌ تم رفض الرحلة",
          description: action === "accept" ? "تم قبول الرحلة بنجاح" : "تم رفض الرحلة"
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "❌ خطأ في العملية",
          description: error.error || `Failed to ${action} trip`
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing trip:`, error)
      toast({
        variant: "destructive",
        title: "❌ خطأ في العملية",
        description: `حدث خطأ أثناء ${action === "accept" ? "قبول" : "رفض"} الرحلة`
      })
    } finally {
      setActionLoading(null)
    }
  }

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

  // Get current trip (in progress)
  const currentTrip = trips.find(trip => trip.status === "IN_PROGRESS" && trip.driverId)
  
  // Get available trips (pending or assigned to this driver)
  const availableTrips = trips.filter(trip => 
    trip.status === "PENDING" || 
    (trip.driverId && trip.status !== "IN_PROGRESS")
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inProgress":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "pending":
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "cancelled":
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "inProgress":
      case "IN_PROGRESS":
        return <Navigation className="h-4 w-4" />
      case "pending":
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "delivered":
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
      case "CANCELLED":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
      case "pending":
        return "في الانتظار"
      case "IN_PROGRESS":
      case "inProgress":
        return "قيد التنفيذ"
      case "DELIVERED":
      case "delivered":
        return "تم التسليم"
      case "CANCELLED":
      case "cancelled":
        return "ملغية"
      default:
        return status
    }
  }

  return (
    <DashboardLayout
      title="Driver Dashboard"
      subtitle={`Welcome back, ${driverInfo.name}!`}
    >
      {/* Current Trip */}
      {currentTrip && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Trip</CardTitle>
            <CardDescription>Trip currently in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{currentTrip.tripNumber}</h3>
                <Badge className={getStatusColor(currentTrip.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(currentTrip.status)}
                    <span>{getStatusText(currentTrip.status)}</span>
                  </div>
                </Badge>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{currentTrip.fromCity?.name}</span>
                <span>→</span>
                <span>{currentTrip.toCity?.name}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Customer</label>
                  <p className="font-semibold">{currentTrip.customer?.name || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                  <p className="font-semibold">{currentTrip.vehicle?.type} ({currentTrip.vehicle?.capacity})</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                  <p className="font-semibold">{currentTrip.temperature?.option} ({currentTrip.temperature?.value}{currentTrip.temperature?.unit})</p>
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
                <Button 
                  variant="outline" 
                  className="bg-secondary hover:bg-secondary/80" 
                  onClick={() => {
                    setSelectedTrip(currentTrip)
                    setShowDetailsModal(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
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
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {availableTrips.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No trips available at the moment</p>
                </div>
              ) : (
                availableTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
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
                          {trip.customer?.name} • {trip.vehicle?.type} ({trip.vehicle?.capacity}) • {trip.temperature?.option}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Scheduled: {new Date(trip.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Price: SAR {trip.price?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(trip.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(trip.status)}
                          <span>{getStatusText(trip.status)}</span>
                        </div>
                      </Badge>
                      <div className="flex space-x-2">
                        {trip.status === "PENDING" && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleTripAction(trip.id, "accept")}
                              disabled={actionLoading === trip.id}
                            >
                              {actionLoading === trip.id ? "Loading..." : "Accept"}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleTripAction(trip.id, "decline")}
                              disabled={actionLoading === trip.id}
                            >
                              {actionLoading === trip.id ? "Loading..." : "Decline"}
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedTrip(trip)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Trip Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الرحلة</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الرحلة رقم {selectedTrip?.tripNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-6">
              {/* Trip Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رقم الرحلة</label>
                  <p className="font-medium">{selectedTrip.tripNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedTrip.status)}>
                      {getStatusIcon(selectedTrip.status)}
                      <span className="ml-1">{getStatusText(selectedTrip.status)}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Route Info */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">المسار</label>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{selectedTrip.fromCity?.name}</span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <span>{selectedTrip.toCity?.name}</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Customer Info */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">بيانات العميل</label>
                <div className="mt-2 p-3 bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedTrip.customer?.name}</p>
                      {selectedTrip.customer?.phone && (
                        <p className="text-sm text-muted-foreground">{selectedTrip.customer.phone}</p>
                      )}
                    </div>
                    {selectedTrip.customer?.phone && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          window.open(`tel:${selectedTrip.customer.phone}`, '_self')
                          toast({
                            title: "📞 اتصال بالعميل",
                            description: `جاري الاتصال بـ ${selectedTrip.customer.name}`
                          })
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        اتصال
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Vehicle & Temperature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">المركبة</label>
                  <p className="font-medium">{selectedTrip.vehicle?.type} - {selectedTrip.vehicle?.capacity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">درجة الحرارة</label>
                  <p className="font-medium">{selectedTrip.temperature?.option} ({selectedTrip.temperature?.value}°{selectedTrip.temperature?.unit})</p>
                </div>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ الجدولة</label>
                  <p className="font-medium">{new Date(selectedTrip.scheduledDate).toLocaleDateString('ar-SA')}</p>
                </div>
                {selectedTrip.actualStartDate && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">تاريخ البدء</label>
                    <p className="font-medium">{new Date(selectedTrip.actualStartDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                )}
              </div>
              
              {selectedTrip.deliveredDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">تاريخ التسليم</label>
                  <p className="font-medium">{new Date(selectedTrip.deliveredDate).toLocaleDateString('ar-SA')}</p>
                </div>
              )}
              
              {/* Price */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">السعر</label>
                <p className="text-lg font-bold text-green-600">{selectedTrip.price} {selectedTrip.currency}</p>
              </div>
              
              {/* Notes */}
              {selectedTrip.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات</label>
                  <p className="mt-1 p-3 bg-secondary rounded-lg">{selectedTrip.notes}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedTrip.status === "IN_PROGRESS" && (
                  <Button 
                    onClick={() => {
                      setShowDetailsModal(false)
                      router.push("/driver/tracking")
                    }}
                    className="flex-1"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    فتح التتبع
                  </Button>
                )}
                
                {selectedTrip.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => {
                        handleTripAction(selectedTrip.id, "accept")
                        setShowDetailsModal(false)
                      }}
                      disabled={actionLoading === selectedTrip.id}
                      className="flex-1"
                    >
                      {actionLoading === selectedTrip.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          قبول الرحلة
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleTripAction(selectedTrip.id, "decline")
                        setShowDetailsModal(false)
                      }}
                      disabled={actionLoading === selectedTrip.id}
                      className="flex-1"
                    >
                      {actionLoading === selectedTrip.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          رفض الرحلة
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
