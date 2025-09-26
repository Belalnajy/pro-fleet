"use client"

import { useState, useEffect, useRef, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/providers/language-provider"
// import { useTranslation } from "@/hooks/useTranslation"
import { LocationSelector } from "@/components/ui/location-selector"
import { useToast } from "@/hooks/use-toast"
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Eye,
  Edit,
  Search,
  Download,
  User,
  Package,
  SaudiRiyal,
  Navigation,
  XCircle,
  Pause,
  Trash2,
  Plus,
  FileText,
  Loader2,
  Dot,
} from "lucide-react"
import { TripStatus } from "@prisma/client"
import { log } from "console"

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

interface Trip {
  id: string
  tripNumber: string
  customerId: string
  driverId?: string
  vehicleId: string
  fromCityId: string
  toCityId: string
  temperatureId: string
  customsBrokerId?: string
  scheduledDate: string
  actualStartDate?: string
  deliveredDate?: string
  status: TripStatus
  price: number
  currency: string
  notes?: string
  customer: {
    name: string
    email: string
  }
  driver?: {
    carPlateNumber: string
    user: {
      name: string
    }
  }
  vehicle: {
    vehicleNumber: string
    vehicleTypeId: string
    vehicleType: {
      name: string
      nameAr: string
      capacity: string
    }
  }
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
  customsBroker?: {
    id: string
    user: {
      id: string
      name: string
    }
  }
}

export default function TripsManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()

  // Function to get city name based on current language
  const getCityName = (city: { name: string; nameAr?: string | null }): string => {
    if (language === 'ar' && city.nameAr) {
      return city.nameAr;
    }
    return city.name; // Default to English name
  };
  const { toast } = useToast()
  // const { t: t } = useTranslation()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // New Trip dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [temperatures, setTemperatures] = useState<any[]>([])
  const [customsBrokers, setCustomsBrokers] = useState<any[]>([])
  const [formError, setFormError] = useState('')
  const [viewTripId, setViewTripId] = useState<string | null>(null)
  const [editTripId, setEditTripId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const [tripForm, setTripForm] = useState({
    customerId: "",
    driverId: "" as string | null,
    vehicleId: "",
    fromCityId: "",
    toCityId: "",
    temperatureId: "",
    scheduledDate: "",
    price: "",
    notes: "",
    customsBrokerId: "",
    originLocation: null as LocationData | null,
    destinationLocation: null as LocationData | null
  })

  // Helper function to get driver name
  const getDriverName = (driverId: string | null): string => {
    if (!driverId || driverId === 'no-driver') return ''
    
    // Try to find in availableDrivers first (API returns name directly)
    const availableDriver = availableDrivers.find(d => d.id === driverId)
    if (availableDriver?.name) {
      console.log('Found in availableDrivers:', availableDriver.name)
      return availableDriver.name
    }
    
    // Try to find in availableDrivers with user.name structure
    if (availableDriver?.user?.name) {
      console.log('Found in availableDrivers (user.name):', availableDriver.user.name)
      return availableDriver.user.name
    }
    
    // Try to find in all drivers
    const driver = drivers.find(d => d.id === driverId)
    if (driver?.user?.name) {
      console.log('Found in drivers:', driver.user.name)
      return driver.user.name
    }
    
    // Try to find in current trip being edited
    if (editTripId) {
      const trip = trips.find(t => t.id === editTripId)
      if (trip?.driver?.user?.name) {
        console.log('Found in trip:', trip.driver.user.name)
        return trip.driver.user.name
      }
    }
    
    console.log('Driver not found for ID:', driverId, 'Available drivers:', availableDrivers.map(d => ({ id: d.id, name: d.name || d.user?.name })))
    return 'سائق محدد'
  }

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`)
      return
    }
    fetchTrips()
  }, [session, status, router, locale])

  // Load data for both create and edit dialogs
  const loadFormData = async () => {
    try {
      console.log("Loading form data...")
      const [cRes, dRes, vRes, ciRes, tRes, cbRes] = await Promise.all([
        fetch("/api/admin/customers"),
        fetch("/api/admin/drivers"),
        fetch("/api/admin/vehicles"),
        fetch("/api/admin/cities"),
        fetch("/api/admin/temperatures"),
        fetch("/api/admin/customs-brokers"),
      ])
      
      if (cRes.ok) {
        const customersData = await cRes.json()
        console.log("Customers loaded:", customersData)
        setCustomers(customersData)
      } else {
        console.error("Failed to load customers:", cRes.status)
      }
      
      if (dRes.ok) {
        const driversData = await dRes.json()
        console.log("Drivers loaded:", driversData)
        setDrivers(driversData)
      } else {
        console.error("Failed to load drivers:", dRes.status)
      }
      
      if (vRes.ok) {
        const vehiclesData = await vRes.json()
        console.log("Vehicles loaded:", vehiclesData)
        setVehicles(vehiclesData)
      } else {
        console.error("Failed to load vehicles:", vRes.status)
      }
      
      if (ciRes.ok) {
        const citiesData = await ciRes.json()
        console.log("Cities loaded:", citiesData)
        setCities(citiesData)
      } else {
        console.error("Failed to load cities:", ciRes.status)
      }
      
      if (tRes.ok) {
        const temperaturesData = await tRes.json()
        console.log("Temperatures loaded:", temperaturesData)
        setTemperatures(temperaturesData)
      } else {
        console.error("Failed to load temperatures:", tRes.status)
      }
      
      if (cbRes.ok) {
        const customsBrokersData = await cbRes.json()
        console.log("Customs brokers loaded:", customsBrokersData)
        setCustomsBrokers(customsBrokersData)
      } else {
        console.error("Failed to load customs brokers:", cbRes.status)
      }
    } catch (e) {
      console.error("Error loading form data", e)
    }
  }

  // Fetch available drivers based on selected vehicle type and temperature
  const fetchAvailableDrivers = async () => {
    console.log('🔍 fetchAvailableDrivers called with tripForm:', {
      vehicleId: tripForm.vehicleId,
      temperatureId: tripForm.temperatureId,
      vehiclesCount: vehicles.length
    })
    
    // For admin, we need vehicleId to find vehicleTypeId
    let vehicleTypeId = null
    
    if (tripForm.vehicleId) {
      // Find vehicle type from selected vehicle
      const selectedVehicle = vehicles.find(v => v.id === tripForm.vehicleId)
      vehicleTypeId = selectedVehicle?.vehicleTypeId
      console.log('🚗 Selected vehicle:', selectedVehicle)
      console.log('🏷️ Vehicle type ID:', vehicleTypeId)
    }
    
    if (!vehicleTypeId) {
      console.log('❌ No vehicle type ID found, clearing drivers list')
      setAvailableDrivers([])
      return
    }

    setLoadingDrivers(true)
    try {
      const params = new URLSearchParams()
      params.append('vehicleTypeId', vehicleTypeId)
      
      if (tripForm.temperatureId) {
        params.append('temperatureId', tripForm.temperatureId)
      }

      console.log('Fetching available drivers with params:', params.toString())
      const response = await fetch(`/api/admin/drivers/available?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableDrivers(data.drivers || [])
        console.log("Available drivers loaded:", data)
      } else {
        console.error("Failed to fetch available drivers:", response.status)
        setAvailableDrivers([])
      }
    } catch (error) {
      console.error("Error fetching available drivers:", error)
      setAvailableDrivers([])
    } finally {
      setLoadingDrivers(false)
    }
  }

  // Load data when create dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      loadFormData()
    }
  }, [isDialogOpen])

  // Load data when edit dialog opens
  useEffect(() => {
    if (isEditDialogOpen) {
      loadFormData()
    }
  }, [isEditDialogOpen])

  // Fetch available drivers when vehicle or temperature changes
  useEffect(() => {
    if ((isDialogOpen || isEditDialogOpen) && tripForm.vehicleId && vehicles.length > 0) {
      fetchAvailableDrivers()
    }
  }, [tripForm.vehicleId, tripForm.temperatureId, vehicles, isDialogOpen, isEditDialogOpen])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      console.log('Fetching trips from /api/admin/trips...')
      const response = await fetch("/api/admin/trips")
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Trips data received:', data)
        // Handle both array and object responses
        const tripsArray = Array.isArray(data) ? data : (data.trips || [])
        console.log('Processed trips array:', tripsArray.length, 'trips')
        setTrips(tripsArray)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch trips:', response.status, errorData)
        toast({
          title: "❌ خطأ في جلب البيانات",
          description: `فشل في جلب الرحلات: ${errorData.error || 'خطأ غير معروف'}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
      toast({
        title: "❌ خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم. تحقق من الاتصال بالإنترنت.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.fromCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.toCity.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || trip.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setTripForm({
      customerId: "",
      driverId: null,
      vehicleId: "",
      fromCityId: "",
      toCityId: "",
      temperatureId: "",
      scheduledDate: "",
      price: "",
      notes: "",
      customsBrokerId: "none",
      originLocation: null,
      destinationLocation: null
    })
    setFormError('')
  }

  const handleCreateTrip = async () => {
    console.log("handleCreateTrip called")
    console.log("Form data:", tripForm)
    setFormError('')
    
    // Validate required fields - either location data or city IDs
    const hasLocationData = tripForm.originLocation && tripForm.destinationLocation
    const hasCityData = tripForm.fromCityId && tripForm.toCityId
    
    if (!tripForm.customerId || !tripForm.vehicleId || !tripForm.temperatureId || !tripForm.scheduledDate || !tripForm.price) {
      setFormError("Please fill all required fields")
      return
    }
    
    if (!hasLocationData && !hasCityData) {
      setFormError("Please select locations from map or choose cities")
      return
    }
    
    console.log("Validation passed, sending request...")
    setSubmitting(true)
    try {
      const res = await fetch("/api/trips/create-with-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: tripForm.customerId,
          driverId: tripForm.driverId || null,
          vehicleId: tripForm.vehicleId,
          fromCityId: tripForm.fromCityId || null,
          toCityId: tripForm.toCityId || null,
          temperatureId: tripForm.temperatureId,
          customsBrokerId: tripForm.customsBrokerId && tripForm.customsBrokerId !== 'none' ? tripForm.customsBrokerId : null,
          scheduledDate: tripForm.scheduledDate,
          price: parseFloat(tripForm.price),
          notes: tripForm.notes || 'Admin created trip',
          originLocation: tripForm.originLocation,
          destinationLocation: tripForm.destinationLocation,
        }),
      })
      console.log("Response status:", res.status)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        console.log("Error response:", j)
        throw new Error(j.error || "Failed to create trip")
      }
      console.log("Trip created successfully")
      await fetchTrips()
      setIsDialogOpen(false)
      resetForm()
    } catch (e: any) {
      console.log("Error creating trip:", e)
      setFormError(e.message || "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateInvoice = async (tripId: string, status: TripStatus) => {
    if (status !== "DELIVERED") {
      toast({
        title: "❌ خطأ",
        description: "يمكن إنشاء الفاتورة فقط للرحلات المكتملة",
        variant: "destructive"
      })
      return
    }
    
    setInvoiceLoading(tripId)
    try {
      const res = await fetch("/api/invoices/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to create invoice")
      
      toast({
        title: "✅ تم إنشاء الفاتورة",
        description: `رقم الفاتورة: ${json.invoice.invoiceNumber}`,
      })
    } catch (e: any) {
      toast({
        title: "❌ خطأ في إنشاء الفاتورة",
        description: e.message || "فشل في إنشاء الفاتورة",
        variant: "destructive"
      })
    } finally {
      setInvoiceLoading(null)
    }
  }

  const handleViewTrip = (tripId: string) => {
    setViewTripId(tripId)
    setIsViewDialogOpen(true)
  }

  const handleEditTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      // Only allow editing of PENDING trips
      if (trip.status !== TripStatus.PENDING) {
        toast({
          title: "❌ لا يمكن التعديل",
          description: "لا يمكن تعديل الرحلة بعد بدئها أو تسليمها",
          variant: "destructive"
        })
        return
      }
      
      setEditTripId(tripId)
      setTripForm({
        customerId: trip.customerId,
        driverId: trip.driverId || null,
        vehicleId: trip.vehicleId,
        fromCityId: trip.fromCityId,
        toCityId: trip.toCityId,
        temperatureId: trip.temperatureId,
        scheduledDate: trip.scheduledDate.slice(0, 16), // Format for datetime-local
        price: trip.price.toString(),
        notes: trip.notes || '',
        customsBrokerId: trip.customsBrokerId || 'none',
        originLocation: null,
        destinationLocation: null
      })
      setIsEditDialogOpen(true)
    }
  }

  const handleUpdateTrip = async () => {
    if (!editTripId) return
    
    setSubmitting(true)
    setFormError('')
    
    try {
      const res = await fetch(`/api/admin/trips/${editTripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: tripForm.customerId,
          driverId: tripForm.driverId,
          vehicleId: tripForm.vehicleId,
          fromCityId: tripForm.fromCityId,
          toCityId: tripForm.toCityId,
          temperatureId: tripForm.temperatureId,
          customsBrokerId: tripForm.customsBrokerId && tripForm.customsBrokerId !== 'none' ? tripForm.customsBrokerId : null,
          scheduledDate: tripForm.scheduledDate,
          price: parseFloat(tripForm.price),
          notes: tripForm.notes || 'Updated by admin'
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update trip')
      }
      
      toast({
        title: "✅ تم تحديث الرحلة",
        description: "تم تحديث بيانات الرحلة بنجاح"
      })
      
      setIsEditDialogOpen(false)
      setEditTripId(null)
      resetForm()
      fetchTrips()
    } catch (error: any) {
      setFormError(error.message)
      toast({
        title: "❌ خطأ في التحديث",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-generate invoice when trip status changes to DELIVERED
  const handleStatusChange = async (tripId: string, newStatus: TripStatus) => {
    try {
      const res = await fetch(`/api/admin/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update status')
      }
      
      const result = await res.json()
      
      toast({
        title: "✅ تم تحديث الحالة",
        description: "تم تحديث حالة الرحلة بنجاح"
      })
      
      // Show invoice generation result if status changed to DELIVERED
      if (newStatus === 'DELIVERED' && result.invoice) {
        if (result.invoice.invoiceGenerated) {
          toast({
            title: "🧾 تم إنشاء الفاتورة تلقائياً",
            description: `رقم الفاتورة: ${result.invoice.invoiceNumber}`,
          })
        } else if (result.invoice.message) {
          toast({
            title: "ℹ️ معلومات الفاتورة",
            description: result.invoice.message,
          })
        } else if (result.invoice.error) {
          toast({
            title: "⚠️ تحذير",
            description: `تم تحديث الحالة لكن فشل إنشاء الفاتورة: ${result.invoice.error}`,
            variant: "destructive"
          })
        }
      }
      
      fetchTrips()
    } catch (error: any) {
      toast({
        title: "❌ خطأ في تحديث الحالة",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return "bg-yellow-100 text-yellow-800"
      case TripStatus.ASSIGNED:
        return "bg-blue-100 text-blue-800"
      case TripStatus.IN_PROGRESS:
        return "bg-orange-100 text-orange-800"
      case TripStatus.EN_ROUTE_PICKUP:
        return "bg-yellow-100 text-yellow-800"
      case TripStatus.AT_PICKUP:
        return "bg-purple-100 text-purple-800"
      case TripStatus.PICKED_UP:
        return "bg-green-100 text-green-800"
      case TripStatus.IN_TRANSIT:
        return "bg-blue-100 text-blue-800"
      case TripStatus.AT_DESTINATION:
        return "bg-indigo-100 text-indigo-800"
      case TripStatus.DELIVERED:
        return "bg-green-100 text-green-800"
      case TripStatus.CANCELLED:
        return "bg-red-100 text-red-800"
      case TripStatus.DRIVER_REQUESTED:
        return "bg-amber-100 text-amber-800"
      case TripStatus.DRIVER_ACCEPTED:
        return "bg-emerald-100 text-emerald-800"
      case TripStatus.DRIVER_REJECTED:
        return "bg-rose-100 text-rose-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case TripStatus.ASSIGNED:
        return <User className="h-4 w-4" />
      case TripStatus.IN_PROGRESS:
        return <Truck className="h-4 w-4" />
      case TripStatus.EN_ROUTE_PICKUP:
        return <Navigation className="h-4 w-4" />
      case TripStatus.AT_PICKUP:
        return <MapPin className="h-4 w-4" />
      case TripStatus.PICKED_UP:
        return <Package className="h-4 w-4" />
      case TripStatus.IN_TRANSIT:
        return <Truck className="h-4 w-4" />
      case TripStatus.AT_DESTINATION:
        return <MapPin className="h-4 w-4" />
      case TripStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />
      case TripStatus.CANCELLED:
        return <AlertTriangle className="h-4 w-4" />
      case TripStatus.DRIVER_REQUESTED:
        return <User className="h-4 w-4" />
      case TripStatus.DRIVER_ACCEPTED:
        return <CheckCircle className="h-4 w-4" />
      case TripStatus.DRIVER_REJECTED:
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return "في الانتظار"
      case TripStatus.ASSIGNED:
        return "تم التعيين"
      case TripStatus.IN_PROGRESS:
        return "قيد التنفيذ"
      case TripStatus.EN_ROUTE_PICKUP:
        return "في الطريق للاستلام"
      case TripStatus.AT_PICKUP:
        return "في نقطة الاستلام"
      case TripStatus.PICKED_UP:
        return "تم الاستلام"
      case TripStatus.IN_TRANSIT:
        return "في الطريق"
      case TripStatus.AT_DESTINATION:
        return "وصل للوجهة"
      case TripStatus.DELIVERED:
        return "تم التسليم"
      case TripStatus.CANCELLED:
        return "ملغية"
      case TripStatus.DRIVER_REQUESTED:
        return "طلب سائق"
      case TripStatus.DRIVER_ACCEPTED:
        return "قبل السائق"
      case TripStatus.DRIVER_REJECTED:
        return "رفض السائق"
      default:
        return status
    }
  }

  const stats = {
    total: trips.length,
    pending: trips.filter(t => {
      const pendingStatuses = ["PENDING", "DRIVER_REQUESTED"];
      return pendingStatuses.includes(t.status as string);
    }).length,
    inProgress: trips.filter(t => {
      const activeStatuses = ["ASSIGNED", "IN_PROGRESS", "EN_ROUTE_PICKUP", "AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "AT_DESTINATION", "DRIVER_ACCEPTED"];
      return activeStatuses.includes(t.status as string);
    }).length,
    delivered: trips.filter(t => t.status === TripStatus.DELIVERED).length,
    cancelled: trips.filter(t => {
      const cancelledStatuses = ["CANCELLED", "DRIVER_REJECTED"];
      return cancelledStatuses.includes(t.status as string);
    }).length,
    totalRevenue: trips.reduce((sum, trip) => sum + trip.price, 0),
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

return (
  <DashboardLayout
    title={t('tripManagement')}
    subtitle={t('monitorManageTrips')}
    actions={
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('newTrip')}
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
          <CardTitle className="text-sm font-medium">{t('inProgress')}</CardTitle>
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
          <CardTitle className="text-sm font-medium">{t('revenue')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {t('currency')} {stats.totalRevenue.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Search and Filter */}
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Search & Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -t-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchTrips')}
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
              <SelectItem value={TripStatus.PENDING}>{getStatusText(TripStatus.PENDING)}</SelectItem>
              <SelectItem value={TripStatus.DRIVER_REQUESTED}>{getStatusText(TripStatus.DRIVER_REQUESTED)}</SelectItem>
              <SelectItem value={TripStatus.DRIVER_ACCEPTED}>{getStatusText(TripStatus.DRIVER_ACCEPTED)}</SelectItem>
              <SelectItem value={TripStatus.DRIVER_REJECTED}>{getStatusText(TripStatus.DRIVER_REJECTED)}</SelectItem>
              <SelectItem value={TripStatus.ASSIGNED}>{getStatusText(TripStatus.ASSIGNED)}</SelectItem>
              <SelectItem value={TripStatus.IN_PROGRESS}>{getStatusText(TripStatus.IN_PROGRESS)}</SelectItem>
              <SelectItem value={TripStatus.EN_ROUTE_PICKUP}>{getStatusText(TripStatus.EN_ROUTE_PICKUP)}</SelectItem>
              <SelectItem value={TripStatus.AT_PICKUP}>{getStatusText(TripStatus.AT_PICKUP)}</SelectItem>
              <SelectItem value={TripStatus.PICKED_UP}>{getStatusText(TripStatus.PICKED_UP)}</SelectItem>
              <SelectItem value={TripStatus.IN_TRANSIT}>{getStatusText(TripStatus.IN_TRANSIT)}</SelectItem>
              <SelectItem value={TripStatus.AT_DESTINATION}>{getStatusText(TripStatus.AT_DESTINATION)}</SelectItem>
              <SelectItem value={TripStatus.DELIVERED}>{getStatusText(TripStatus.DELIVERED)}</SelectItem>
              <SelectItem value={TripStatus.CANCELLED}>{getStatusText(TripStatus.CANCELLED)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    {/* Trips Table */}
    <Card>
      <CardHeader>
        <CardTitle>All Trips</CardTitle>
        <CardDescription>
          Monitor and manage all shipment trips
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tripHash')}</TableHead>
                <TableHead>{t('route')}</TableHead>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('driver')}</TableHead>
                <TableHead>{t('vehicle')}</TableHead>
                <TableHead>{t('customsBroker')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>{t('scheduled')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div className="font-medium">{trip.tripNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getCityName(trip.fromCity)} → {getCityName(trip.toCity)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.customer.name}</div>
                      <div className="text-sm text-muted-foreground">{trip.customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {trip.driver ? (
                      <div>
                        <div className="font-medium">{trip.driver.user.name}</div>
                        <div className="text-sm text-muted-foreground">{trip.driver.carPlateNumber}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">غير معين</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{trip.vehicle.vehicleType?.name || 'Unknown Type'}</div>
                        <div className="text-xs text-muted-foreground">{trip.vehicle.vehicleType?.capacity || 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {trip.customsBroker?.user?.name || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(trip.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(trip.status)}
                        <span>{getStatusText(trip.status)}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {t('currency')} {trip.price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(trip.scheduledDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTrip(trip.id)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditTrip(trip.id)}
                        disabled={trip.status !== TripStatus.PENDING}
                        title={trip.status === TripStatus.PENDING ? "تعديل الرحلة" : "لا يمكن تعديل الرحلة بعد بدئها"}
                        className={trip.status !== TripStatus.PENDING ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCreateInvoice(trip.id, trip.status)}
                        disabled={trip.status !== 'DELIVERED' || invoiceLoading === trip.id}
                        title={trip.status === 'DELIVERED' ? 'إنشاء فاتورة' : 'متاح فقط للرحلات المكتملة'}
                      >
                        {invoiceLoading === trip.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </Button> */}
                      {trip.status !== 'DELIVERED' && trip.status !== 'CANCELLED' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(trip.id, 'DELIVERED')}
                          title="تسليم الرحلة"
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* New Trip Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {t('newTrip')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600">
            {t('createTripDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
          {/* Basic Information Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              معلومات أساسية
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('customer')} *</Label>
                <Select value={tripForm.customerId} onValueChange={(v) => setTripForm(prev => ({ ...prev, customerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('driver')}</Label>
                {loadingDrivers ? (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">جاري تحميل السائقين المتاحين...</span>
                  </div>
                ) : availableDrivers.length === 0 && tripForm.vehicleId ? (
                  <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      لا يوجد سائقين متاحين لنوع المركبة المحدد
                    </p>
                  </div>
                ) : (
                  <Select value={tripForm.driverId || 'no-driver'} onValueChange={(v) => setTripForm(prev => ({ ...prev, driverId: v === 'no-driver' ? null : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={tripForm.vehicleId ? "اختر السائق" : "يرجى اختيار المركبة أولاً"}>
                        {tripForm.driverId && tripForm.driverId !== 'no-driver' ? (
                          <span className="font-medium">
                            {getDriverName(tripForm.driverId)}
                          </span>
                        ) : tripForm.driverId === 'no-driver' ? (
                          <span className="text-muted-foreground">بدون سائق (اختياري)</span>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-driver">بدون سائق (اختياري)</SelectItem>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{driver.name || driver.user?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {driver.carPlateNumber} • {driver.nationality}
                              {(driver.hasActiveTrip || driver.trips?.length > 0) && (
                                <span className="text-orange-600"> • لديه رحلة نشطة</span>
                              )}
                            </span>
                            {driver.vehicleTypes?.length > 0 && (
                              <span className="text-xs text-blue-600">
                                يقود: {driver.vehicleTypes.map(vt => vt.nameAr || vt.name || vt.vehicleType?.nameAr || vt.vehicleType?.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  يتم عرض السائقين الذين يمكنهم قيادة نوع المركبة المحدد فقط
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('vehicle')} *</Label>
                <Select value={tripForm.vehicleId} onValueChange={(v) => setTripForm(prev => ({ ...prev, vehicleId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectVehicle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      
                      <SelectItem key={v.id} value={v.id}>{v.vehicleType?.capacity + " • " + v.vehicleNumber }</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Route Selection Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              تحديد المسار
            </h3>
            
            {/* Map-based Location Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">اختيار من الخريطة (مفضل)</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <LocationSelector
                  label={t('from')}
                  placeholder="اختر نقطة البداية من الخريطة"
                  value={tripForm.originLocation}
                  onChange={(location) => setTripForm(prev => ({ 
                    ...prev, 
                    originLocation: location,
                    // Clear city selection when map location is selected
                    fromCityId: location ? '' : prev.fromCityId
                  }))}
                  type="origin"
                />
                
                <LocationSelector
                  label={t('to')}
                  placeholder="اختر نقطة النهاية من الخريطة"
                  value={tripForm.destinationLocation}
                  onChange={(location) => setTripForm(prev => ({ 
                    ...prev, 
                    destinationLocation: location,
                    // Clear city selection when map location is selected
                    toCityId: location ? '' : prev.toCityId
                  }))}
                  type="destination"
                />
              </div>
            </div>
            
            {/* Alternative: City Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px bg-gray-300 flex-1"></div>
                <span className="text-sm text-gray-500 px-3">أو اختر من المدن المحفوظة</span>
                <div className="h-px bg-gray-300 flex-1"></div>
              </div>
              
              {(tripForm.originLocation || tripForm.destinationLocation) && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 text-center">
                    تم اختيار المواقع من الخريطة. لاستخدام المدن المحفوظة، قم بإلغاء اختيار المواقع من الخريطة أولاً.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-right">{t('from')}</Label>
                <Select 
                  value={tripForm.fromCityId} 
                  onValueChange={(v) => setTripForm(prev => ({ 
                    ...prev, 
                    fromCityId: v,
                    // Clear map location when city is selected
                    originLocation: v ? null : prev.originLocation
                  }))}
                  disabled={!!tripForm.originLocation}
                >
                  <SelectTrigger className={tripForm.originLocation ? 'opacity-50' : ''}>
                    <SelectValue placeholder={t('selectOrigin')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{getCityName(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-right">{t('to')}</Label>
                <Select 
                  value={tripForm.toCityId} 
                  onValueChange={(v) => setTripForm(prev => ({ 
                    ...prev, 
                    toCityId: v,
                    // Clear map location when city is selected
                    destinationLocation: v ? null : prev.destinationLocation
                  }))}
                  disabled={!!tripForm.destinationLocation}
                >
                  <SelectTrigger className={tripForm.destinationLocation ? 'opacity-50' : ''}>
                    <SelectValue placeholder={t('selectDestination')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{getCityName(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </div>

          {/* Trip Details Section */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              تفاصيل الرحلة
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('temperature')} *</Label>
                <Select value={tripForm.temperatureId} onValueChange={(v) => setTripForm(prev => ({ ...prev, temperatureId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectTemperature')} />
                  </SelectTrigger>
                  <SelectContent>
                    {temperatures.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.option} ({t.value}{t.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('scheduled')} *</Label>
                <Input 
                  ref={dateRef} 
                  type="datetime-local" 
                  value={tripForm.scheduledDate} 
                  onChange={(e) => setTripForm(prev => ({ ...prev, scheduledDate: e.target.value }))} 
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price ({t('currency')}) *</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={tripForm.price} 
                  onChange={(e) => setTripForm(prev => ({ ...prev, price: e.target.value }))} 
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">المخلص الجمركي</Label>
                <Select value={tripForm.customsBrokerId} onValueChange={(v) => setTripForm(prev => ({ ...prev, customsBrokerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخلص الجمركي (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مخلص جمركي</SelectItem>
                    {customsBrokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name} - {broker.licenseNumber || 'غير محدد'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            
            <div className="lg:col-span-2 space-y-2">
              <Label className="text-sm font-medium">{t('notes')}</Label>
              <Textarea 
                value={tripForm.notes} 
                onChange={(e) => setTripForm(prev => ({ ...prev, notes: e.target.value }))} 
                placeholder={t('optionalRemarks')}
                rows={3}
                className="resize-none"
              />
            </div>
            </div>
          </div>
        </div>
        {formError && (
          <div className="mx-4 sm:mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              {formError}
            </p>
          </div>
        )}
        
        <DialogFooter className="border-t pt-3 sm:pt-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:flex-1"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleCreateTrip} 
              disabled={submitting}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('creating')}
                </>
              ) : (
                t('createTrip')
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* View Trip Dialog */}
    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            تفاصيل الرحلة
          </DialogTitle>
        </DialogHeader>
        {viewTripId && (() => {
          const trip = trips.find(t => t.id === viewTripId)
          if (!trip) return <div>الرحلة غير موجودة</div>
          
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">رقم الرحلة</Label>
                  <p className="text-lg font-semibold">{trip.tripNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">الحالة</Label>
                  <Badge className={getStatusColor(trip.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(trip.status)}
                      <span className="capitalize">{trip.status.toLowerCase()}</span>
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">العميل</Label>
                  <p>{trip.customer.name}</p>
                  <p className="text-sm text-gray-500">{trip.customer.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">السائق</Label>
                  {trip.driver ? (
                    <div>
                      <p>{trip.driver.user.name}</p>
                      <p className="text-sm text-gray-500">{trip.driver.carPlateNumber}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">غير محدد</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">المسار</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>{getCityName(trip.fromCity)}</span>
                    <span>→</span>
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span>{getCityName(trip.toCity)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">المركبة</Label>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{trip.vehicle.vehicleType?.name || 'نوع غير محدد'}</p>
                      <p className="text-xs text-gray-500">{trip.vehicle.vehicleType?.capacity || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">درجة الحرارة</Label>
                  <p>{trip.temperature.option} ({trip.temperature.value}{trip.temperature.unit})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">السعر</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {t('currency')} {trip.price}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ الجدولة</Label>
                  <p>{new Date(trip.scheduledDate).toLocaleString('ar-SA')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ البدء الفعلي</Label>
                  <p>{trip.actualStartDate ? new Date(trip.actualStartDate).toLocaleString('ar-SA') : 'لم يبدأ بعد'}</p>
                </div>
              </div>
              
              {trip.deliveredDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">تاريخ التسليم</Label>
                  <p>{new Date(trip.deliveredDate).toLocaleString('ar-SA')}</p>
                </div>
              )}
              
              {trip.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">ملاحظات</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{trip.notes}</p>
                </div>
              )}
            </div>
          )
        })()}
      </DialogContent>
    </Dialog>

    {/* Edit Trip Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditTripId(null); resetForm() } }}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            تعديل الرحلة
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            تحديث بيانات الرحلة المحددة
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Customer and Driver Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              اختيار العميل والسائق
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('customer')} *</Label>
                <Select value={tripForm.customerId} onValueChange={(v) => setTripForm(prev => ({ ...prev, customerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('driver')}</Label>
                {loadingDrivers ? (
                  <div className="flex items-center justify-center p-4 border rounded-md">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">جاري تحميل السائقين المتاحين...</span>
                  </div>
                ) : availableDrivers.length === 0 && tripForm.vehicleId ? (
                  <div className="p-4 border rounded-md bg-yellow-50 border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      لا يوجد سائقين متاحين لنوع المركبة المحدد
                    </p>
                  </div>
                ) : (
                  <Select value={tripForm.driverId || 'no-driver'} onValueChange={(v) => setTripForm(prev => ({ ...prev, driverId: v === 'no-driver' ? null : v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={tripForm.vehicleId ? "اختر السائق" : "يرجى اختيار المركبة أولاً"}>
                        {tripForm.driverId && tripForm.driverId !== 'no-driver' ? (
                          <span className="font-medium">
                            {getDriverName(tripForm.driverId)}
                          </span>
                        ) : tripForm.driverId === 'no-driver' ? (
                          <span className="text-muted-foreground">بدون سائق (اختياري)</span>
                        ) : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-driver">بدون سائق (اختياري)</SelectItem>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{driver.name || driver.user?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {driver.carPlateNumber} • {driver.nationality}
                              {(driver.hasActiveTrip || driver.trips?.length > 0) && (
                                <span className="text-orange-600"> • لديه رحلة نشطة</span>
                              )}
                            </span>
                            {driver.vehicleTypes?.length > 0 && (
                              <span className="text-xs text-blue-600">
                                يقود: {driver.vehicleTypes.map(vt => vt.nameAr || vt.name || vt.vehicleType?.nameAr || vt.vehicleType?.name).join(', ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  يتم عرض السائقين الذين يمكنهم قيادة نوع المركبة المحدد فقط
                </p>
              </div>
            </div>
          </div>
          
          {/* Vehicle Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              اختيار المركبة
            </h3>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('vehicle')} *</Label>
              <Select value={tripForm.vehicleId} onValueChange={(v) => setTripForm(prev => ({ ...prev, vehicleId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectVehicle')} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vehicleType?.capacity || v.vehicleNumber || v.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Route Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              تحديد المسار
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-right">{t('from')}</Label>
                <Select value={tripForm.fromCityId} onValueChange={(v) => setTripForm(prev => ({ ...prev, fromCityId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectOrigin')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{getCityName(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-right">{t('to')}</Label>
                <Select value={tripForm.toCityId} onValueChange={(v) => setTripForm(prev => ({ ...prev, toCityId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectDestination')} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{getCityName(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b pb-2">
              تفاصيل الرحلة
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('temperature')} *</Label>
                <Select value={tripForm.temperatureId} onValueChange={(v) => setTripForm(prev => ({ ...prev, temperatureId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectTemperature')} />
                  </SelectTrigger>
                  <SelectContent>
                    {temperatures.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.option} ({t.value}{t.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('scheduled')} *</Label>
                <Input 
                  type="datetime-local" 
                  value={tripForm.scheduledDate} 
                  onChange={(e) => setTripForm(prev => ({ ...prev, scheduledDate: e.target.value }))} 
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">السعر ({t('currency')}) *</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={tripForm.price} 
                  onChange={(e) => setTripForm(prev => ({ ...prev, price: e.target.value }))} 
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">المخلص الجمركي</Label>
                <Select value={tripForm.customsBrokerId} onValueChange={(v) => setTripForm(prev => ({ ...prev, customsBrokerId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المخلص الجمركي (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون مخلص جمركي</SelectItem>
                    {customsBrokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name} - {broker.licenseNumber || 'غير محدد'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            
              <div className="lg:col-span-2 space-y-2">
                <Label className="text-sm font-medium">{t('notes')}</Label>
                <Textarea 
                  value={tripForm.notes} 
                  onChange={(e) => setTripForm(prev => ({ ...prev, notes: e.target.value }))} 
                  placeholder={t('optionalRemarks')}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        </div>
        
        {formError && (
          <div className="mx-4 sm:mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              {formError}
            </p>
          </div>
        )}
        
        <DialogFooter className="border-t pt-3 sm:pt-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:flex-1"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleUpdateTrip} 
              disabled={submitting}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  جاري التحديث...
                </>
              ) : (
                'تحديث الرحلة'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DashboardLayout>
)
}