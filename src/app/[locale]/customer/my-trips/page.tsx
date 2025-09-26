"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/providers/language-provider"
import { useTrackingSettings } from "@/hooks/useTrackingSettings"
import { useCancellationSettings } from "@/hooks/useCancellationSettings"
import { useToast } from "@/hooks/use-toast"
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  Package,
  SaudiRiyal,
  Navigation,
  Thermometer,
  X,
  Bell,
  Timer,
  Shield,
} from "lucide-react"
import { TripStatus } from "@prisma/client"

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
  isKnownCity?: boolean
}

interface Trip {
  id: string
  tripNumber: string
  fromCity: {
    name: string
  }
  toCity: {
    name: string
  }
  temperature: {
    option: string
    value: number
    unit: string
  }
  scheduledDate: string
  actualStartDate?: string
  deliveredDate?: string
  createdAt: string
  status: TripStatus
  price: number
  currency: string
  notes?: string
  // إضافة بيانات المواقع المخصصة
  originLocation?: LocationData | null
  destinationLocation?: LocationData | null
  driver?: {
    carPlateNumber: string
    user: {
      name: string
    }
  }
  vehicle: {
    type: string
    capacity: string
  }
  customsBroker?: {
    user: {
      name: string
    }
  }
}

export default function MyTrips({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = use(params)
  const { language, t } = useLanguage()
  const { trackingEnabled } = useTrackingSettings()
  const { settings: cancellationSettings, canCancelFree, getCancellationFee, getTimeRemaining } = useCancellationSettings()
  const { toast } = useToast()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedTripForCancel, setSelectedTripForCancel] = useState<Trip | null>(null)
  const [cancellingTrip, setCancellingTrip] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
      return
    }
    fetchTrips()
  }, [session, status, router])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/customer/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTrip = (trip: Trip) => {
    // Allow cancellation for PENDING, DRIVER_REQUESTED, and ASSIGNED statuses
    const cancellableStatuses = ['PENDING', 'DRIVER_REQUESTED', 'ASSIGNED']
    if (!cancellableStatuses.includes(trip.status)) {
      toast({
        title: "لا يمكن إلغاء الرحلة",
        description: "لا يمكن إلغاء الرحلة بعد بدء التنفيذ",
        variant: "destructive",
      })
      return
    }
    setSelectedTripForCancel(trip)
    setShowCancelDialog(true)
  }

  const confirmCancelTrip = async () => {
    if (!selectedTripForCancel) return

    try {
      setCancellingTrip(true)
      const response = await fetch(`/api/customer/trips/${selectedTripForCancel.id}/cancel`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: data.isFreeCancel ? t('tripCancelledSuccessfully') : t('tripCancelledWithFee'),
          description: data.isFreeCancel 
            ? data.message 
            : `${data.message}\n📄 تم إنشاء فاتورة برسوم الإلغاء. يمكنك مراجعتها في صفحة الفواتير.`,
          duration: data.isFreeCancel ? 3000 : 6000, // Show longer for paid cancellation
        })
        // Refresh trips list
        fetchTrips()
      } else {
        toast({
          title: t('errorCancellingTrip'),
          description: data.error || t('errorCancellingTrip'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('errorCancellingTrip'),
        description: t('errorCancellingTrip'),
        variant: "destructive",
      })
    } finally {
      setCancellingTrip(false)
      setShowCancelDialog(false)
      setSelectedTripForCancel(null)
    }
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.fromCity?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.toCity?.name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || trip.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return "bg-yellow-100 text-yellow-800"
      case 'DRIVER_REQUESTED' as any:
        return "bg-orange-100 text-orange-800"
      case TripStatus.ASSIGNED:
        return "bg-blue-100 text-blue-800"
      case TripStatus.IN_PROGRESS:
      case TripStatus.EN_ROUTE_PICKUP:
      case TripStatus.AT_PICKUP:
      case TripStatus.PICKED_UP:
      case TripStatus.IN_TRANSIT:
      case TripStatus.AT_DESTINATION:
        return "bg-blue-100 text-blue-800"
      case TripStatus.DELIVERED:
        return "bg-green-100 text-green-800"
      case TripStatus.CANCELLED:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case 'DRIVER_REQUESTED' as any:
        return <Bell className="h-4 w-4" />
      case TripStatus.ASSIGNED:
        return <Truck className="h-4 w-4" />
      case TripStatus.IN_PROGRESS:
      case TripStatus.EN_ROUTE_PICKUP:
      case TripStatus.AT_PICKUP:
      case TripStatus.PICKED_UP:
      case TripStatus.IN_TRANSIT:
      case TripStatus.AT_DESTINATION:
        return <Truck className="h-4 w-4" />
      case TripStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />
      case TripStatus.CANCELLED:
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return "في الانتظار"
      case 'DRIVER_REQUESTED' as any:
        return "تم إرسال طلب للسائق"
      case TripStatus.ASSIGNED:
        return "تم تعيين السائق"
      case TripStatus.IN_PROGRESS:
        return t('IN_PROGRESS')
      case TripStatus.EN_ROUTE_PICKUP:
        return t('enRoutePickup')
      case TripStatus.AT_PICKUP:
        return t('atPickup')
      case TripStatus.PICKED_UP:
        return t('pickedUp')
      case TripStatus.IN_TRANSIT:
        return t('inTransit')
      case TripStatus.AT_DESTINATION:
        return t('atDestination')
      case TripStatus.DELIVERED:
        return t('DELIVERED')
      case TripStatus.CANCELLED:
        return t('CANCELLED')
      default:
        return status
    }
  }

  const stats = {
    total: trips.length,
    pending: trips.filter(t => t.status === TripStatus.PENDING).length,
    inProgress: trips.filter(t => [
      TripStatus.ASSIGNED,
      TripStatus.IN_PROGRESS,
      TripStatus.EN_ROUTE_PICKUP,
      TripStatus.AT_PICKUP,
      TripStatus.PICKED_UP,
      TripStatus.IN_TRANSIT,
      TripStatus.AT_DESTINATION
    ].includes(t.status as any)).length,
    delivered: trips.filter(t => t.status === TripStatus.DELIVERED).length,
    cancelled: trips.filter(t => t.status === TripStatus.CANCELLED).length,
    totalSpent: trips.reduce((sum, trip) => sum + (trip.price || 0), 0),
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

  return (
    <DashboardLayout
      title={t('myTrips')}
      subtitle={t('viewTrackAllShipments')}
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push(`/${locale}/customer/book-trip`)}>
            <Package className="h-4 w-4 mr-2" />
            {t('bookNewTrip')}
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalTrips')}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pending')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inTransit')}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('delivered')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalSpent')}</CardTitle>
            <SaudiRiyal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {t('currency')} {stats.totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('searchFilter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchTripNumberCity')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value={TripStatus.PENDING}>{t('pending')}</SelectItem>
                <SelectItem value={TripStatus.IN_PROGRESS}>{t('inTransit')}</SelectItem>
                <SelectItem value={TripStatus.DELIVERED}>{t('delivered')}</SelectItem>
                <SelectItem value={TripStatus.CANCELLED}>{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('noTripsFoundTitle')}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? t('adjustSearchCriteria')
                  : t('haventBookedTripsYet')
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => router.push(`/${locale}/customer/book-trip`)}>
                  <Package className="h-4 w-4 mr-2" />
                  {t('bookFirstTrip')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTrips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{trip.tripNumber}</h3>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {/* عرض المواقع المخصصة إذا كانت متوفرة، وإلا عرض أسماء المدن */}
                        {trip.originLocation ? (
                          <span className={`font-medium ${trip.originLocation.isKnownCity ? 'text-green-600' : 'text-blue-600'}`}>
                            {trip.originLocation.isKnownCity ? '🏙️' : '📍'} {trip.originLocation.name}
                          </span>
                        ) : (
                          trip.fromCity?.name || t('unknown')
                        )}
                        {' → '}
                        {trip.destinationLocation ? (
                          <span className={`font-medium ${trip.destinationLocation.isKnownCity ? 'text-green-600' : 'text-red-600'}`}>
                            {trip.destinationLocation.isKnownCity ? '🏙️' : '📍'} {trip.destinationLocation.name}
                          </span>
                        ) : (
                          trip.toCity?.name || t('unknown')
                        )}
                      </span>
                    </div>
                    
                    {/* عرض تفاصيل إضافية للمواقع المخصصة */}
                    {(trip.originLocation || trip.destinationLocation) && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-800 space-y-1">
                          <div className="font-medium">📍 مواقع مخصصة من الخريطة:</div>
                          {trip.originLocation && (
                            <div>
                              <span className="font-medium text-green-700">• نقطة الاستلام:</span> {trip.originLocation.address}
                            </div>
                          )}
                          {trip.destinationLocation && (
                            <div>
                              <span className="font-medium text-red-700">• نقطة التسليم:</span> {trip.destinationLocation.address}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Free Cancellation Timer - Show for all cancellable statuses */}
                    {['PENDING', 'DRIVER_REQUESTED', 'ASSIGNED'].includes(trip.status) && (
                      <div className="mt-2">
                        {canCancelFree(trip.createdAt) ? (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <Timer className="h-3 w-3" />
                            <span>إلغاء مجاني: {getTimeRemaining(trip.createdAt)} دقيقة متبقية</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <span>رسوم الإلغاء: {getCancellationFee(trip.price || 0, trip.createdAt).toLocaleString()} ريال</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(trip.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(trip.status)}
                      <span>{getStatusText(trip.status)}</span>
                    </div>
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                     <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                       <Calendar className="h-4 w-4" />
                       <span className="text-sm">{t('scheduled')}</span>
                     </div>
                    <p className="text-sm font-medium">
                      {new Date(trip.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {trip.driver && (
                    <div>
                       <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                         <Truck className="h-4 w-4" />
                         <span className="text-sm">{t('driver')}</span>
                       </div>
                       <p className="text-sm font-medium">{trip.driver?.user?.name || t('notAssigned')}</p>
                       <p className="text-xs text-muted-foreground">{trip.driver?.carPlateNumber || t('na')}</p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                      <Thermometer className="h-4 w-4" />
                      <span className="text-sm">{t('temperature')}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {trip.temperature?.option?.replace('_', ' ') || t('standard')} ({trip.temperature?.value || 0}{trip.temperature?.unit || '°C'})
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                      <SaudiRiyal className="h-4 w-4" />
                      <span className="text-sm">{t('price')}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {t('currency')} {trip.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                  
                  {trip.customsBroker && (
                    <div>
                      <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">{t('customsBroker')}</span>
                      </div>
                      <p className="text-sm font-medium">{trip.customsBroker?.user?.name || t('notAssigned')}</p>
                    </div>
                  )}
                </div>

                {trip.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>{t('notes')}:</strong> {trip.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Navigation className="h-4 w-4" />
                    <span>{t('vehicle')}: {trip.vehicle?.type || t('na')} - {trip.vehicle?.capacity || t('na')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trackingEnabled && [
                      TripStatus.ASSIGNED,
                      TripStatus.IN_PROGRESS,
                      TripStatus.EN_ROUTE_PICKUP,
                      TripStatus.AT_PICKUP,
                      TripStatus.PICKED_UP,
                      TripStatus.IN_TRANSIT,
                      TripStatus.AT_DESTINATION
                    ].includes(trip.status as any) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/${locale}/customer/tracking?tripId=${trip.id}`)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {t('trackTrip')}
                      </Button>
                    )}
                    {['PENDING', 'DRIVER_REQUESTED', 'ASSIGNED'].includes(trip.status) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelTrip(trip)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        إلغاء الرحلة
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      {t('viewDetails')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Cancellation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {t('confirmCancellation')}
            </DialogTitle>
            <DialogDescription>
              {t('confirmCancelTrip')}
            </DialogDescription>
          </DialogHeader>

          {selectedTripForCancel && (
            <div className="space-y-4">
              {/* Trip Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedTripForCancel.tripNumber}</h4>
                <p className="text-sm text-gray-600">
                  {selectedTripForCancel.fromCity?.name} → {selectedTripForCancel.toCity?.name}
                </p>
                <p className="text-sm font-medium">
                  {t('currency')} {selectedTripForCancel.price?.toLocaleString()}
                </p>
              </div>

              {/* Cancellation Policy */}
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  {t('cancellationPolicy')}
                </h5>
                
                {canCancelFree(selectedTripForCancel.createdAt || new Date()) ? (
                  <div className="text-green-600">
                    <p className="font-medium">✅ {t('freeCancellation')}</p>
                    <p className="text-sm">
                      {t('timeRemaining')}: {getTimeRemaining(selectedTripForCancel.createdAt || new Date())} {t('minutes')}
                    </p>
                  </div>
                ) : (
                  <div className="text-orange-600">
                    <p className="font-medium">⚠️ {t('freeCancellationExpired')}</p>
                    <p className="text-sm">{t('cancellationFeeWillApply')}</p>
                    <p className="font-semibold">
                      {t('cancellationFee')}: {t('currency')} {getCancellationFee(selectedTripForCancel.price || 0, selectedTripForCancel.createdAt || new Date()).toLocaleString()}
                    </p>
                    <p className="text-sm mt-2 bg-orange-50 p-2 rounded">
                      📄 سيتم إنشاء فاتورة برسوم الإلغاء يجب دفعها خلال 30 يوماً
                    </p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-700">
                  {t('cancellationWarning')}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancellingTrip}
            >
              {t('keepTrip')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelTrip}
              disabled={cancellingTrip}
            >
              {cancellingTrip ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('loading')}
                </div>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  {t('yesCancelTrip')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
