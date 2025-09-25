"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { PageLoading } from "@/components/ui/loading"
import { useLanguage } from "@/components/providers/language-provider"
import { useCancellationSettings } from "@/hooks/useCancellationSettings"
import { useToast } from "@/hooks/use-toast"
import { translations } from "@/lib/translations"
import { TripStatus } from "@prisma/client"
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  Truck,
  Package,
  DollarSign,
  Eye,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  X,
  Timer,
} from "lucide-react"

interface Trip {
  id: string
  tripNumber: string
  fromCityName: string
  toCityName: string
  pickupAddress: string
  deliveryAddress: string
  cargoType: string
  cargoWeight: number
  cargoValue: number
  temperatureRequirement?: string
  specialInstructions?: string
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'EN_ROUTE_PICKUP' | 'AT_PICKUP' | 'PICKED_UP' | 'IN_TRANSIT' | 'AT_DESTINATION' | 'DELIVERED' | 'CANCELLED'
  scheduledPickupDate: string
  actualPickupDate?: string
  actualDeliveryDate?: string
  totalPrice: number
  driverName?: string
  vehiclePlateNumber?: string
  createdAt: string
}

interface City {
  id: string
  name: string
}

interface VehicleType {
  id: string
  name: string
  capacity: string
  pricePerKm: number
}

export default function CustomerTrips({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { settings: cancellationSettings, canCancelFree, getCancellationFee, getTimeRemaining } = useCancellationSettings()
  const { toast } = useToast()
  
  const [trips, setTrips] = useState<Trip[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedTripForCancel, setSelectedTripForCancel] = useState<Trip | null>(null)
  const [cancellingTrip, setCancellingTrip] = useState(false)
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [selectedTripForDetails, setSelectedTripForDetails] = useState<Trip | null>(null)

  // Form state
  const [tripForm, setTripForm] = useState({
    fromCityId: "",
    toCityId: "",
    pickupAddress: "",
    deliveryAddress: "",
    cargoType: "",
    cargoWeight: "",
    cargoValue: "",
    temperatureRequirement: "",
    specialInstructions: "",
    scheduledPickupDate: "",
    vehicleTypeId: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchTrips()
      fetchCities()
      fetchVehicleTypes()
    }
  }, [session, status, router])

  const fetchTrips = async () => {
    try {
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

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/admin/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch("/api/admin/vehicle-types")
      if (response.ok) {
        const data = await response.json()
        setVehicleTypes(data)
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error)
    }
  }

  const handleCreateTrip = async () => {
    try {
      const response = await fetch("/api/customer/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tripForm,
          cargoWeight: parseFloat(tripForm.cargoWeight),
          cargoValue: parseFloat(tripForm.cargoValue),
        }),
      })
      
      if (response.ok) {
        fetchTrips()
        setIsCreateTripOpen(false)
        resetForm()
        alert(t("tripCreatedSuccessfully"))
      } else {
        alert(t("errorCreatingTrip"))
      }
    } catch (error) {
      console.error("Error creating trip:", error)
      alert(t("errorCreatingTrip"))
    }
  }

  const resetForm = () => {
    setTripForm({
      fromCityId: "",
      toCityId: "",
      pickupAddress: "",
      deliveryAddress: "",
      cargoType: "",
      cargoWeight: "",
      cargoValue: "",
      temperatureRequirement: "",
      specialInstructions: "",
      scheduledPickupDate: "",
      vehicleTypeId: "",
    })
  }

  const handleCancelTrip = (trip: Trip) => {
    if (trip.status !== 'PENDING') {
      toast({
        title: "لا يمكن إلغاء الرحلة",
        description: "يمكن إلغاء الرحلات المعلقة فقط",
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
          title: data.isFreeCancel ? "تم إلغاء الرحلة بنجاح" : "تم إلغاء الرحلة مع رسوم",
          description: data.message,
        })
        // Refresh trips list
        fetchTrips()
        setShowCancelDialog(false)
        setSelectedTripForCancel(null)
      } else {
        toast({
          title: "خطأ في إلغاء الرحلة",
          description: data.error || "حدث خطأ أثناء إلغاء الرحلة",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "خطأ في إلغاء الرحلة",
        description: "حدث خطأ أثناء إلغاء الرحلة",
        variant: "destructive",
      })
    } finally {
      setCancellingTrip(false)
    }
  }

  const canCancelTrip = (trip: Trip) => {
    console.log('Checking canCancelTrip:', { 
      status: trip.status, 
      cancellationSettings: cancellationSettings,
      tripId: trip.id 
    })
    // يمكن إلغاء الرحلات المعلقة والمعينة فقط
    return trip.status === 'PENDING' || trip.status === 'ASSIGNED'
  }

  const getCancellationInfo = (trip: Trip) => {
    if (!canCancelTrip(trip)) return null
    
    const timeRemainingMinutes = getTimeRemaining(trip.createdAt)
    const isFreeCancel = canCancelFree(trip.createdAt)
    const fee = getCancellationFee(trip.totalPrice, trip.createdAt)
    
    // Format time remaining
    const timeRemaining = timeRemainingMinutes > 0 
      ? `${timeRemainingMinutes} دقيقة`
      : "انتهت المدة"
    
    return {
      timeRemaining,
      isFreeCancel,
      fee
    }
  }

  const handleViewTripDetails = (trip: Trip) => {
    setSelectedTripForDetails(trip)
    setShowTripDetails(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'ASSIGNED':
        return <User className="h-4 w-4" />
      case 'IN_PROGRESS':
      case 'EN_ROUTE_PICKUP':
      case 'AT_PICKUP':
        return <Navigation className="h-4 w-4" />
      case 'PICKED_UP':
      case 'IN_TRANSIT':
      case 'AT_DESTINATION':
        return <Truck className="h-4 w-4" />
      case 'DELIVERED':
        return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary", color: "bg-yellow-500 hover:bg-yellow-600 text-white", text: "في الانتظار" },
      ASSIGNED: { variant: "default", color: "bg-blue-500 hover:bg-blue-600 text-white", text: "مجدولة" },
      IN_PROGRESS: { variant: "default", color: "bg-green-500 hover:bg-green-600 text-white", text: "قيد التنفيذ" },
      EN_ROUTE_PICKUP: { variant: "default", color: "bg-blue-600 hover:bg-blue-700 text-white", text: "في الطريق للاستلام" },
      AT_PICKUP: { variant: "default", color: "bg-purple-500 hover:bg-purple-600 text-white", text: "في نقطة الاستلام" },
      PICKED_UP: { variant: "default", color: "bg-orange-500 hover:bg-orange-600 text-white", text: "تم الاستلام" },
      IN_TRANSIT: { variant: "default", color: "bg-indigo-500 hover:bg-indigo-600 text-white", text: "في الطريق" },
      AT_DESTINATION: { variant: "default", color: "bg-teal-500 hover:bg-teal-600 text-white", text: "في نقطة التسليم" },
      DELIVERED: { variant: "default", color: "bg-green-600 hover:bg-green-700 text-white", text: "تم التسليم" },
      CANCELLED: { variant: "destructive", color: "bg-red-500 hover:bg-red-600 text-white", text: "ملغي" },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      variant: "secondary", 
      color: "bg-gray-500 hover:bg-gray-600 text-white", 
      text: status 
    }
    
    return (
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} border-0`}
      >
        {config.text}
      </span>
    )
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.fromCityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.toCityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.cargoType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading text={t("loading")} />
      </DashboardLayout>
    )
  }

  console.log('Rendering trips:', trips.length, trips.map(t => ({ id: t.id, status: t.status, tripNumber: t.tripNumber })))
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("myTrips")}</h1>
            <p className="text-muted-foreground">{t("manageYourTrips")}</p>
          </div>
          <Dialog open={isCreateTripOpen} onOpenChange={setIsCreateTripOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("requestTrip")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("requestNewTrip")}</DialogTitle>
                <DialogDescription>
                  {t("fillTripDetails")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromCity">{t("fromCity")}</Label>
                  <Select
                    value={tripForm.fromCityId}
                    onValueChange={(value) => setTripForm({...tripForm, fromCityId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectFromCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toCity">{t("toCity")}</Label>
                  <Select
                    value={tripForm.toCityId}
                    onValueChange={(value) => setTripForm({...tripForm, toCityId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectToCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="pickupAddress">{t("pickupAddress")}</Label>
                  <Input
                    id="pickupAddress"
                    value={tripForm.pickupAddress}
                    onChange={(e) => setTripForm({...tripForm, pickupAddress: e.target.value})}
                    placeholder={t("enterPickupAddress")}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="deliveryAddress">{t("deliveryAddress")}</Label>
                  <Input
                    id="deliveryAddress"
                    value={tripForm.deliveryAddress}
                    onChange={(e) => setTripForm({...tripForm, deliveryAddress: e.target.value})}
                    placeholder={t("enterDeliveryAddress")}
                  />
                </div>
                <div>
                  <Label htmlFor="cargoType">{t("cargoType")}</Label>
                  <Input
                    id="cargoType"
                    value={tripForm.cargoType}
                    onChange={(e) => setTripForm({...tripForm, cargoType: e.target.value})}
                    placeholder={t("enterCargoType")}
                  />
                </div>
                <div>
                  <Label htmlFor="cargoWeight">{t("cargoWeight")} (kg)</Label>
                  <Input
                    id="cargoWeight"
                    type="number"
                    value={tripForm.cargoWeight}
                    onChange={(e) => setTripForm({...tripForm, cargoWeight: e.target.value})}
                    placeholder={t("enterCargoWeight")}
                  />
                </div>
                <div>
                  <Label htmlFor="cargoValue">{t("cargoValue")} ({t("currency")})</Label>
                  <Input
                    id="cargoValue"
                    type="number"
                    value={tripForm.cargoValue}
                    onChange={(e) => setTripForm({...tripForm, cargoValue: e.target.value})}
                    placeholder={t("enterCargoValue")}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleType">{t("vehicleType")}</Label>
                  <Select
                    value={tripForm.vehicleTypeId}
                    onValueChange={(value) => setTripForm({...tripForm, vehicleTypeId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectVehicleType")} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} - {type.capacity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledPickupDate">{t("scheduledPickupDate")}</Label>
                  <Input
                    id="scheduledPickupDate"
                    type="datetime-local"
                    value={tripForm.scheduledPickupDate}
                    onChange={(e) => setTripForm({...tripForm, scheduledPickupDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="temperatureRequirement">{t("temperatureRequirement")}</Label>
                  <Select
                    value={tripForm.temperatureRequirement}
                    onValueChange={(value) => setTripForm({...tripForm, temperatureRequirement: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectTemperature")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambient">{t("ambient")}</SelectItem>
                      <SelectItem value="cold_2">+2°C</SelectItem>
                      <SelectItem value="cold_10">+10°C</SelectItem>
                      <SelectItem value="frozen">-18°C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="specialInstructions">{t("specialInstructions")}</Label>
                  <Textarea
                    id="specialInstructions"
                    value={tripForm.specialInstructions}
                    onChange={(e) => setTripForm({...tripForm, specialInstructions: e.target.value})}
                    placeholder={t("enterSpecialInstructions")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateTripOpen(false)
                  resetForm()
                }}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleCreateTrip}>
                  {t("requestTrip")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalTrips")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("activeTrips")}</CardTitle>
              <Navigation className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {trips.filter(trip => trip.status === 'IN_PROGRESS' || trip.status === 'ASSIGNED').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("completedTrips")}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {trips.filter(trip => trip.status === 'DELIVERED').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalSpent")}</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {trips.filter(trip => trip.status === 'DELIVERED')
                  .reduce((sum, trip) => sum + trip.totalPrice, 0).toFixed(2)} {t("currency")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>{t("myTrips")}</CardTitle>
            <CardDescription>{t("viewAndManageTrips")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchTrips")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="PENDING">{t("pending")}</SelectItem>
                  <SelectItem value="ASSIGNED">{t("assigned")}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t("inProgress")}</SelectItem>
                  <SelectItem value="DELIVERED">{t("delivered")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trips Cards */}
            <div className="grid gap-4">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Trip Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-bold text-lg">{trip.tripNumber}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            السعر
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            ر.س {trip.totalPrice.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-center space-x-2 mb-3">
                        <MapPin className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{trip.fromCityName} → {trip.toCityName}</span>
                      </div>

                      {/* Status and Date */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground">الحالة</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(trip.status)}
                            {getStatusBadge(trip.status)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">مجدولة</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(trip.scheduledPickupDate).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Temperature and Driver */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-muted-foreground">درجة الحرارة</div>
                          <div className="text-sm font-medium">{trip.temperatureRequirement}</div>
                        </div>
                        {trip.driverName ? (
                          <div>
                            <div className="text-sm text-muted-foreground">السائق</div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{trip.driverName}</span>
                            </div>
                            {trip.vehiclePlateNumber && (
                              <div className="text-xs text-muted-foreground">{trip.vehiclePlateNumber}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-muted-foreground">السائق</div>
                            <span className="text-sm text-muted-foreground">غير معين</span>
                          </div>
                        )}
                      </div>

                      {/* Customs Broker Info */}
                      {trip.specialInstructions && trip.specialInstructions.includes('مخلص جمركي') && (
                        <div className="mb-3">
                          <div className="text-sm text-muted-foreground">مخلص جمركي</div>
                          <div className="text-sm font-medium">
                            {trip.specialInstructions.includes('مخلص جمركي ثاني') ? 'مخلص جمركي ثاني' :
                             trip.specialInstructions.includes('مخلص جمركي ثالث') ? 'مخلص جمركي ثالث' :
                             'مخلص جمركي'}
                          </div>
                        </div>
                      )}

                      {/* Special Instructions */}
                      {trip.specialInstructions && (
                        <div className="mb-3">
                          <div className="text-sm text-muted-foreground">ملاحظات</div>
                          <div className="text-sm">{trip.specialInstructions}</div>
                        </div>
                      )}

                      {/* Vehicle Info */}
                      <div className="mb-3">
                        <div className="text-sm text-muted-foreground">المركبة</div>
                        <div className="text-sm">{trip.vehiclePlateNumber || "غير متاح"}</div>
                      </div>

                      {/* Cancellation Info */}
                      {canCancelTrip(trip) && getCancellationInfo(trip) && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          {(() => {
                            const info = getCancellationInfo(trip)
                            if (!info) return null
                            return info.isFreeCancel 
                              ? `إلغاء مجاني: ${info.timeRemaining}`
                              : `رسوم الإلغاء: ${info.fee.toFixed(2)} ريال`
                          })()}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {canCancelTrip(trip) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCancelTrip(trip)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            إلغاء الرحلة
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewTripDetails(trip)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredTrips.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">{t("noTripsFound")}</h3>
                <p className="text-muted-foreground">{t("noTripsDescription")}</p>
                <Button className="mt-4" onClick={() => setIsCreateTripOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("requestFirstTrip")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Trip Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>تأكيد إلغاء الرحلة</span>
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في إلغاء الرحلة رقم {selectedTripForCancel?.tripNumber}؟
            </DialogDescription>
          </DialogHeader>
          
          {selectedTripForCancel && getCancellationInfo(selectedTripForCancel) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
              <div className="flex items-start space-x-3">
                <Timer className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">معلومات الإلغاء</h4>
                  {(() => {
                    const info = getCancellationInfo(selectedTripForCancel)
                    if (!info) return null
                    
                    if (info.isFreeCancel) {
                      return (
                        <p className="text-sm text-yellow-700 mt-1">
                          يمكنك إلغاء هذه الرحلة مجاناً لمدة {info.timeRemaining} المتبقية
                        </p>
                      )
                    } else {
                      return (
                        <p className="text-sm text-yellow-700 mt-1">
                          سيتم خصم رسوم إلغاء قدرها {info.fee.toFixed(2)} ريال من حسابك
                        </p>
                      )
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={cancellingTrip}
            >
              تراجع
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancelTrip}
              disabled={cancellingTrip}
            >
              {cancellingTrip ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Details Dialog */}
      <Dialog open={showTripDetails} onOpenChange={setShowTripDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span>تفاصيل الرحلة {selectedTripForDetails?.tripNumber}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTripForDetails && (
            <div className="space-y-6">
              {/* Route Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  معلومات المسار
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">من:</span>
                    <p className="font-medium">{selectedTripForDetails.fromCityName}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">إلى:</span>
                    <p className="font-medium">{selectedTripForDetails.toCityName}</p>
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  معلومات البضاعة
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">نوع البضاعة:</span>
                    <p className="font-medium">{selectedTripForDetails.cargoType}</p>
                  </div>
                  <div>
                    <span className="text-green-600">الوزن:</span>
                    <p className="font-medium">{selectedTripForDetails.cargoWeight} كجم</p>
                  </div>
                  <div>
                    <span className="text-green-600">القيمة:</span>
                    <p className="font-medium">{selectedTripForDetails.cargoValue} ريال</p>
                  </div>
                </div>
              </div>

              {/* Trip Status & Dates */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  حالة الرحلة والتواريخ
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">الحالة:</span>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(selectedTripForDetails.status)}
                      {getStatusBadge(selectedTripForDetails.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ الجدولة:</span>
                    <p className="font-medium">
                      {new Date(selectedTripForDetails.scheduledPickupDate).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">تاريخ الإنشاء:</span>
                    <p className="font-medium">
                      {new Date(selectedTripForDetails.createdAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  معلومات السائق والمركبة
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600">السائق:</span>
                    <p className="font-medium">
                      {selectedTripForDetails.driverName || "لم يتم التعيين بعد"}
                    </p>
                  </div>
                  <div>
                    <span className="text-purple-600">رقم المركبة:</span>
                    <p className="font-medium">
                      {selectedTripForDetails.vehiclePlateNumber || "لم يتم التحديد"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  معلومات السعر
                </h4>
                <div className="text-center">
                  <span className="text-yellow-600">إجمالي السعر:</span>
                  <p className="text-2xl font-bold text-yellow-800">
                    {selectedTripForDetails.totalPrice.toFixed(2)} ريال
                  </p>
                </div>
              </div>

              {/* Cancellation Info */}
              {canCancelTrip(selectedTripForDetails) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center">
                    <X className="h-4 w-4 mr-2" />
                    معلومات الإلغاء
                  </h4>
                  {(() => {
                    const info = getCancellationInfo(selectedTripForDetails)
                    if (!info) return null
                    
                    return (
                      <div className="text-sm">
                        {info.isFreeCancel ? (
                          <p className="text-green-700">
                            يمكنك إلغاء هذه الرحلة مجاناً لمدة {info.timeRemaining} المتبقية
                          </p>
                        ) : (
                          <p className="text-red-700">
                            رسوم الإلغاء: {info.fee.toFixed(2)} ريال
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowTripDetails(false)}>
              إغلاق
            </Button>
            {selectedTripForDetails && canCancelTrip(selectedTripForDetails) && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowTripDetails(false)
                  handleCancelTrip(selectedTripForDetails)
                }}
              >
                إلغاء الرحلة
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
