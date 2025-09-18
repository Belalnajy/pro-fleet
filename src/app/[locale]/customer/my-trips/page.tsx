"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/components/providers/language-provider"
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
  DollarSign,
  Navigation,
  Thermometer,
} from "lucide-react"
import { TripStatus } from "@prisma/client"

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
  status: TripStatus
  price: number
  currency: string
  notes?: string
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
}

export default function MyTrips() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push("/auth/signin")
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
      title="My Trips"
      subtitle="View and track all your shipments"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/customer/book-trip")}>
            <Package className="h-4 w-4 mr-2" />
            Book New Trip
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
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              SAR {stats.totalSpent.toLocaleString()}
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
                <SelectItem value={TripStatus.IN_PROGRESS}>In Transit</SelectItem>
                <SelectItem value={TripStatus.DELIVERED}>Delivered</SelectItem>
                <SelectItem value={TripStatus.CANCELLED}>Cancelled</SelectItem>
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
              <h3 className="text-lg font-semibold mb-2">No trips found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "You haven't booked any trips yet"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => router.push("/customer/book-trip")}>
                  <Package className="h-4 w-4 mr-2" />
                  Book Your First Trip
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
                        {trip.fromCity?.name || 'Unknown'} → {trip.toCity?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(trip.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(trip.status)}
                      <span className="capitalize">{trip.status.toLowerCase().replace('_', ' ')}</span>
                    </div>
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Scheduled</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(trip.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {trip.driver && (
                    <div>
                      <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                        <Truck className="h-4 w-4" />
                        <span className="text-sm">Driver</span>
                      </div>
                      <p className="text-sm font-medium">{trip.driver?.user?.name || 'Not assigned'}</p>
                      <p className="text-xs text-muted-foreground">{trip.driver?.carPlateNumber || 'N/A'}</p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                      <Thermometer className="h-4 w-4" />
                      <span className="text-sm">Temperature</span>
                    </div>
                    <p className="text-sm font-medium">
                      {trip.temperature?.option?.replace('_', ' ') || 'Standard'} ({trip.temperature?.value || 0}{trip.temperature?.unit || '°C'})
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">Price</span>
                    </div>
                    <p className="text-sm font-medium">
                      SAR {trip.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                {trip.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {trip.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Navigation className="h-4 w-4" />
                    <span>Vehicle: {trip.vehicle?.capacity || 'N/A'}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}
