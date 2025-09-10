"use client"

import { useState, useEffect, useRef } from "react"
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
  DollarSign,
  Navigation,
  XCircle,
  Pause,
  Trash2,
  Plus,
  FileText,
} from "lucide-react"
import { TripStatus } from "@prisma/client"

interface Trip {
  id: string
  tripNumber: string
  customerId: string
  driverId?: string
  vehicleId: string
  fromCityId: string
  toCityId: string
  temperatureId: string
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
    capacity: string
    vehicleTypeId: string
    vehicleType: {
      name: string
      nameAr: string
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
}

export default function TripsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // New Trip dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [temperatures, setTemperatures] = useState<any[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const [tripForm, setTripForm] = useState({
    customerId: "",
    driverId: "",
    vehicleId: "",
    fromCityId: "",
    toCityId: "",
    temperatureId: "",
    scheduledDate: "",
    price: "",
    notes: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchTrips()
  }, [session, status, router])

  useEffect(() => {
    if (!isDialogOpen) return
    console.log("Loading dialog data...")
    // Lazy load dependencies when opening dialog
    ;(async () => {
      try {
        const [cRes, dRes, vRes, ciRes, tRes] = await Promise.all([
          fetch("/api/admin/customers"),
          fetch("/api/admin/drivers"),
          fetch("/api/admin/vehicles"),
          fetch("/api/admin/cities"),
          fetch("/api/admin/temperatures"),
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
      } catch (e) {
        console.error("Error loading form data", e)
      }
    })()
  }, [isDialogOpen])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/trips")
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
      driverId: "",
      vehicleId: "",
      fromCityId: "",
      toCityId: "",
      temperatureId: "",
      scheduledDate: "",
      price: "",
      notes: "",
    })
    setFormError(null)
  }

  const handleCreateTrip = async () => {
    console.log("handleCreateTrip called")
    console.log("Form data:", tripForm)
    setFormError(null)
    
    // Check each field individually
    console.log("Checking fields:")
    console.log("customerId:", tripForm.customerId, "valid:", !!tripForm.customerId)
    console.log("vehicleId:", tripForm.vehicleId, "valid:", !!tripForm.vehicleId)
    console.log("fromCityId:", tripForm.fromCityId, "valid:", !!tripForm.fromCityId)
    console.log("toCityId:", tripForm.toCityId, "valid:", !!tripForm.toCityId)
    console.log("temperatureId:", tripForm.temperatureId, "valid:", !!tripForm.temperatureId)
    console.log("scheduledDate:", tripForm.scheduledDate, "valid:", !!tripForm.scheduledDate)
    console.log("price:", tripForm.price, "valid:", !!tripForm.price)
    
    if (!tripForm.customerId || !tripForm.vehicleId || !tripForm.fromCityId || !tripForm.toCityId || !tripForm.temperatureId || !tripForm.scheduledDate || !tripForm.price) {
      setFormError("Please fill all required fields")
      console.log("Validation failed")
      return
    }
    console.log("Validation passed, sending request...")
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: tripForm.customerId,
          driverId: tripForm.driverId || null,
          vehicleId: tripForm.vehicleId,
          fromCityId: tripForm.fromCityId,
          toCityId: tripForm.toCityId,
          temperatureId: tripForm.temperatureId,
          scheduledDate: tripForm.scheduledDate,
          price: parseFloat(tripForm.price),
          notes: tripForm.notes,
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
      alert("Invoice can only be created for delivered trips")
      return
    }
    try {
      const res = await fetch("/api/invoices/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to create invoice")
      alert("Invoice generated successfully: " + json.invoice.invoiceNumber)
    } catch (e: any) {
      alert(e.message || "Failed to generate invoice")
    }
  }

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return "bg-yellow-100 text-yellow-800"
      case TripStatus.IN_PROGRESS:
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
      case TripStatus.IN_PROGRESS:
        return <Truck className="h-4 w-4" />
      case TripStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />
      case TripStatus.CANCELLED:
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const stats = {
    total: trips.length,
    pending: trips.filter(t => t.status === TripStatus.PENDING).length,
    inProgress: trips.filter(t => t.status === TripStatus.IN_PROGRESS).length,
    delivered: trips.filter(t => t.status === TripStatus.DELIVERED).length,
    cancelled: trips.filter(t => t.status === TripStatus.CANCELLED).length,
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
    title="Trips Management"
    subtitle="Monitor and manage all trips"
    actions={
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Trip
        </Button>
      </div>
    }
  >
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.delivered}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {t("currency")} {stats.totalRevenue.toLocaleString()}
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={TripStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={TripStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TripStatus.DELIVERED}>Delivered</SelectItem>
              <SelectItem value={TripStatus.CANCELLED}>Cancelled</SelectItem>
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
                <TableHead>Trip #</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                        {trip.fromCity.name} → {trip.toCity.name}
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
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{trip.vehicle.vehicleType?.name || 'Unknown Type'}</div>
                        <div className="text-xs text-muted-foreground">{trip.vehicle.capacity}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(trip.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(trip.status)}
                        <span className="capitalize">{trip.status.toLowerCase()}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {t("currency")} {trip.price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(trip.scheduledDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleCreateInvoice(trip.id, trip.status)}>
                        <FileText className="h-4 w-4" />
                      </Button>
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New Trip</DialogTitle>
          <DialogDescription>Create a new trip and assign resources</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Customer</Label>
            <Select value={tripForm.customerId} onValueChange={(v) => setTripForm(prev => ({ ...prev, customerId: v }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Driver</Label>
            <Select value={tripForm.driverId} onValueChange={(v) => setTripForm(prev => ({ ...prev, driverId: v }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Vehicle</Label>
            <Select value={tripForm.vehicleId} onValueChange={(v) => setTripForm(prev => ({ ...prev, vehicleId: v }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.capacity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">From</Label>
            <Select value={tripForm.fromCityId} onValueChange={(v) => setTripForm(prev => ({ ...prev, fromCityId: v }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">To</Label>
            <Select value={tripForm.toCityId} onValueChange={(v) => setTripForm(prev => ({ ...prev, toCityId: v }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Temperature</Label>
            <Select value={tripForm.temperatureId} onValueChange={(v) => setTripForm(prev => ({ ...prev, temperatureId: v }))}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select temperature" />
              </SelectTrigger>
              <SelectContent>
                {temperatures.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.option} ({t.value}{t.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Scheduled</Label>
            <Input ref={dateRef} type="datetime-local" className="col-span-3" value={tripForm.scheduledDate} onChange={(e) => setTripForm(prev => ({ ...prev, scheduledDate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Price ({t("currency")})</Label>
            <Input type="number" min="0" step="0.01" className="col-span-3" value={tripForm.price} onChange={(e) => setTripForm(prev => ({ ...prev, price: e.target.value }))} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Notes</Label>
            <Textarea className="col-span-3" value={tripForm.notes} onChange={(e) => setTripForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional remarks..." />
          </div>
        </div>
        {formError && (
          <div className="text-sm text-destructive px-1">{formError}</div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTrip} disabled={submitting}>{submitting ? "Creating..." : "Create Trip"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DashboardLayout>
)
}