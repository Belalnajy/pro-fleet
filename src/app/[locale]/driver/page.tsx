"use client"

import React from "react"
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

export default function DriverDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DRIVER") {
      router.push(`/${locale}/auth/signin`)
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
          title: action === "accept" ? `✅ ${t('tripAccepted')}` : `❌ ${t('tripDeclined')}`,
          description: action === "accept" ? t('tripAcceptedSuccess') : t('tripDeclinedSuccess')
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: `❌ ${t('operationError')}`,
          description: error.error || `Failed to ${action} trip`
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing trip:`, error)
      toast({
        variant: "destructive",
        title: `❌ ${t('operationError')}`,
        description: action === "accept" ? t('errorAcceptingTrip') : t('errorDecliningTrip')
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
        return t('pending')
      case "IN_PROGRESS":
      case "inProgress":
        return t('inProgress')
      case "DELIVERED":
      case "delivered":
        return t('delivered')
      case "CANCELLED":
      case "cancelled":
        return t('cancelled')
      default:
        return status
    }
  }

  return (
    <DashboardLayout
      title={t('driverDashboard')}
      subtitle={`${t('welcomeBack')}, ${driverInfo.name}!`}
    >
      {/* Current Trip */}
      {currentTrip && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('currentTrip')}</CardTitle>
            <CardDescription>{t('tripCurrentlyInProgress')}</CardDescription>
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
                <span>{t('from')} {currentTrip.fromCity?.name}</span>
                <span>→</span>
                <span>{t('to')} {currentTrip.toCity?.name}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('customer')}</label>
                  <p className="font-semibold">{currentTrip.customer?.name || t('na')}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('vehicle')}</label>
                  <p className="font-semibold">{currentTrip.vehicle?.vehicleType?.name || currentTrip.vehicle?.vehicleType?.nameAr} ({currentTrip.vehicle?.capacity})</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('temperature')}</label>
                  <p className="font-semibold">{currentTrip.temperature?.option} ({currentTrip.temperature?.value}{currentTrip.temperature?.unit})</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{t('started')}: {new Date(currentTrip.actualStartDate!).toLocaleString()}</span>
              </div>

              <div className="flex items-center space-x-4">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/80">
                  <Navigation className="h-4 w-4 mr-2" />
                  {t('startNavigation')}
                </Button>
                <Button 
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {t('contactCustomer')}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/20" 
                  onClick={() => {
                    setSelectedTrip(currentTrip)
                    setShowDetailsModal(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('viewDetails')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Trips */}
      <Card>
        <CardHeader>
          <CardTitle>{t('availableTrips')}</CardTitle>
          <CardDescription>{t('tripsAssignedOrAvailable')}</CardDescription>
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
                  <p className="text-muted-foreground">{t('noTripsAvailable')}</p>
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
                          {trip.customer?.name} • {trip.vehicle?.vehicleType?.name || trip.vehicle?.vehicleType?.nameAr} ({trip.vehicle?.capacity}) • {trip.temperature?.option}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('scheduled')}: {new Date(trip.scheduledDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('price')}: {t('sar')} {trip.price?.toLocaleString()}
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
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleTripAction(trip.id, "accept")}
                              disabled={actionLoading === trip.id}
                            >
                              {actionLoading === trip.id ? t('loading') : t('accept')}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                              onClick={() => handleTripAction(trip.id, "decline")}
                              disabled={actionLoading === trip.id}
                            >
                              {actionLoading === trip.id ? t('loading') : t('decline')}
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/20"
                          onClick={() => {
                            setSelectedTrip(trip)
                            setShowDetailsModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('viewDetails')}
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
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('tripDetails')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('viewTripDetails')} {selectedTrip?.tripNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-6 p-1">
              {/* Trip Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{t('tripNumber')}</label>
                  <p className="font-medium text-foreground bg-muted/50 p-2 rounded-md">{selectedTrip.tripNumber}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{t('status')}</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedTrip.status)}>
                      {getStatusIcon(selectedTrip.status)}
                      <span className="ml-1">{getStatusText(selectedTrip.status)}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Route Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('route')}</label>
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                      <span className="font-medium text-foreground">{selectedTrip.fromCity?.name}</span>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30"></div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{selectedTrip.toCity?.name}</span>
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Customer Info */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('customerInfo')}</label>
                <div className="p-4 bg-card border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{selectedTrip.customer?.name}</p>
                      {selectedTrip.customer?.phone && (
                        <p className="text-sm text-muted-foreground font-mono">{selectedTrip.customer.phone}</p>
                      )}
                    </div>
                    {selectedTrip.customer?.phone && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          window.open(`tel:${selectedTrip.customer.phone}`, '_self')
                          toast({
                            title: `📞 ${t('callingCustomer')}`,
                            description: `${t('callingWith')} ${selectedTrip.customer.name}`
                          })
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {t('call')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Vehicle & Temperature */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{t('vehicleAndTemperature')}</label>
                  <p className="font-medium text-foreground bg-muted/50 p-2 rounded-md">{selectedTrip.vehicle?.vehicleType?.name || selectedTrip.vehicle?.vehicleType?.nameAr} - {selectedTrip.vehicle?.capacity}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{t('temperature')}</label>
                  <p className="font-medium text-foreground bg-muted/50 p-2 rounded-md">{selectedTrip.temperature?.option} ({selectedTrip.temperature?.value}°{selectedTrip.temperature?.unit})</p>
                </div>
              </div>
              
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{t('scheduledDate')}</label>
                  <p className="font-medium text-foreground bg-muted/50 p-2 rounded-md">{new Date(selectedTrip.scheduledDate).toLocaleDateString('ar-SA')}</p>
                </div>
                {selectedTrip.actualStartDate && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">{t('startDate')}</label>
                    <p className="font-medium text-foreground bg-muted/50 p-2 rounded-md">{new Date(selectedTrip.actualStartDate).toLocaleDateString('ar-SA')}</p>
                  </div>
                )}
              </div>
              
              {selectedTrip.deliveredDate && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">{t('deliveryDate')}</label>
                  <p className="font-medium text-foreground bg-muted/50 p-2 rounded-md">{new Date(selectedTrip.deliveredDate).toLocaleDateString('ar-SA')}</p>
                </div>
              )}
              
              {/* Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('price')}</label>
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{selectedTrip.price} {selectedTrip.currency}</p>
                </div>
              </div>
              
              {/* Notes */}
              {selectedTrip.notes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{t('notes')}</label>
                  <div className="p-3 bg-card border rounded-lg">
                    <p className="text-foreground leading-relaxed">{selectedTrip.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                {selectedTrip.status === "IN_PROGRESS" && (
                  <Button 
                    onClick={() => {
                      setShowDetailsModal(false)
                      router.push(`/${locale}/driver/tracking?tripId=${selectedTrip.id}`)
                    }}
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    {t('openTracking')}
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
                      className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === selectedTrip.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('acceptTrip')}
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
                      className="w-full sm:flex-1 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      {actionLoading === selectedTrip.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {t('declineTrip')}
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
