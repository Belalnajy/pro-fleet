"use client"

import { useState, useEffect } from "react"
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
import { translations } from "@/lib/translations"
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
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED'
  scheduledPickupDate: string
  actualPickupDate?: string
  estimatedDeliveryDate: string
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

export default function CustomerTrips({ params }: { params: { locale: string } }) {
  const { locale } = params
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [trips, setTrips] = useState<Trip[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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
    estimatedDeliveryDate: "",
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
      estimatedDeliveryDate: "",
      vehicleTypeId: "",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'ASSIGNED':
        return <User className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Navigation className="h-4 w-4" />
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
      PENDING: { color: "bg-yellow-500", text: t("pending") },
      ASSIGNED: { color: "bg-blue-500", text: t("assigned") },
      IN_PROGRESS: { color: "bg-green-500", text: t("inProgress") },
      DELIVERED: { color: "bg-green-600", text: t("delivered") },
      CANCELLED: { color: "bg-red-500", text: t("cancelled") },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
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
                  <Label htmlFor="estimatedDeliveryDate">{t("estimatedDeliveryDate")}</Label>
                  <Input
                    id="estimatedDeliveryDate"
                    type="datetime-local"
                    value={tripForm.estimatedDeliveryDate}
                    onChange={(e) => setTripForm({...tripForm, estimatedDeliveryDate: e.target.value})}
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

            {/* Trips Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tripNumber")}</TableHead>
                  <TableHead>{t("route")}</TableHead>
                  <TableHead>{t("cargo")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("scheduledDate")}</TableHead>
                  <TableHead>{t("driver")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">
                      {trip.tripNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.fromCityName} → {trip.toCityName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trip.cargoType}</div>
                        <div className="text-sm text-muted-foreground">
                          {trip.cargoWeight} kg
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(trip.status)}
                        {getStatusBadge(trip.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(trip.scheduledPickupDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.driverName ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{trip.driverName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t("notAssigned")}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {trip.totalPrice.toFixed(2)} {t("currency")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
    </DashboardLayout>
  )
}
