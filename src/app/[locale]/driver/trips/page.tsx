"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  User,
  Phone,
  Play,
  Square,
  RotateCcw,
} from "lucide-react"
import { TripStatus } from "@prisma/client"

interface Trip {
  id: string
  tripNumber: string
  customerId: string
  driverId?: string
  fromCity: {
    name: string
  }
  toCity: {
    name: string
  }
  customer: {
    name: string
    email: string
    phone?: string
  }
  vehicle: {
    capacity: string
    vehicleType: {
      name: string
      nameAr: string
    }
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
}

export default function DriverTrips() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DRIVER") {
      router.push("/auth/signin")
      return
    }
    fetchTrips()
  }, [session, status, router])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/driver/trips")
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
        console.log("Driver trips loaded:", data)
      }
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTripStatus = async (tripId: string, newStatus: TripStatus) => {
    try {
      setUpdatingStatus(tripId)
      const response = await fetch(`/api/trips/${tripId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Trip status updated:", result)
        
        // Update local state
        setTrips(prevTrips => 
          prevTrips.map(trip => 
            trip.id === tripId 
              ? { ...trip, status: newStatus, ...(newStatus === "DELIVERED" ? { deliveredDate: new Date().toISOString() } : {}) }
              : trip
          )
        )
        
        toast({
          title: "✅ تم تحديث حالة الرحلة",
          description: `تم تغيير حالة الرحلة إلى ${getStatusText(newStatus)}`
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "❌ خطأ في تحديث الحالة",
          description: error.error || "Failed to update status"
        })
      }
    } catch (error) {
      console.error("Error updating trip status:", error)
      toast({
        variant: "destructive",
        title: "❌ خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء تحديث حالة الرحلة"
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.fromCity?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.toCity?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())

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

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case TripStatus.PENDING:
        return "في الانتظار"
      case TripStatus.IN_PROGRESS:
        return "قيد التنفيذ"
      case TripStatus.DELIVERED:
        return "تم التسليم"
      case TripStatus.CANCELLED:
        return "ملغية"
      default:
        return status
    }
  }

  const getNextStatus = (currentStatus: TripStatus): TripStatus | null => {
    switch (currentStatus) {
      case TripStatus.IN_PROGRESS:
        return TripStatus.DELIVERED
      default:
        return null
    }
  }

  const getStatusAction = (status: TripStatus) => {
    switch (status) {
      case TripStatus.IN_PROGRESS:
        return { label: "Mark as Delivered", icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-600 hover:bg-green-700" }
      default:
        return null
    }
  }

  const stats = {
    total: trips.length,
    pending: trips.filter(t => t.status === TripStatus.PENDING).length,
    inProgress: trips.filter(t => t.status === TripStatus.IN_PROGRESS).length,
    delivered: trips.filter(t => t.status === TripStatus.DELIVERED).length,
    cancelled: trips.filter(t => t.status === TripStatus.CANCELLED).length,
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

  return (
    <DashboardLayout
      title="My Trips"
      subtitle="Manage your assigned trips and deliveries"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={() => {
            const activeTrip = trips.find(trip => trip.status === TripStatus.IN_PROGRESS);
            const url = activeTrip 
              ? `/${language}/driver/tracking?tripId=${activeTrip.id}`
              : `/${language}/driver/tracking`;
            router.push(url);
          }}>
            <Navigation className="h-4 w-4 mr-2" />
            Start Tracking
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
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
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
                  : "You don't have any assigned trips yet"
                }
              </p>
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
                  
                  <div>
                    <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      <span className="text-sm">Customer</span>
                    </div>
                    <p className="text-sm font-medium">{trip.customer?.name || 'N/A'}</p>
                    {trip.customer?.phone && (
                      <p className="text-xs text-muted-foreground">{trip.customer.phone}</p>
                    )}
                  </div>
                  
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
                    <Truck className="h-4 w-4" />
                    <span>Vehicle: {trip.vehicle?.vehicleType?.name || trip.vehicle?.vehicleType?.nameAr} ({trip.vehicle?.capacity})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {trip.customer?.phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          window.open(`tel:${trip.customer.phone}`, '_self')
                          toast({
                            title: "📞 اتصال بالعميل",
                            description: `جاري الاتصال بـ ${trip.customer.name}`
                          })
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Customer
                      </Button>
                    )}
                    
                    {trip.status === TripStatus.IN_PROGRESS && (
                      <Button 
                        onClick={() => router.push(`/${language}/driver/tracking?tripId=${trip.id}`)}
                        variant="outline" 
                        size="sm"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Track
                      </Button>
                    )}

                    {getNextStatus(trip.status) && (
                      <Button
                        onClick={() => updateTripStatus(trip.id, getNextStatus(trip.status)!)}
                        disabled={updatingStatus === trip.id}
                        size="sm"
                        className={getStatusAction(trip.status)?.color}
                      >
                        {updatingStatus === trip.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            {getStatusAction(trip.status)?.icon}
                            <span className="ml-2">{getStatusAction(trip.status)?.label}</span>
                          </>
                        )}
                      </Button>
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
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Trip Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl z-50">
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
                  <p className="font-medium">{selectedTrip.vehicle?.vehicleType?.name || selectedTrip.vehicle?.vehicleType?.nameAr} - {selectedTrip.vehicle?.capacity}</p>
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
                  <label className="text-sm font-medium text-muted-foreground ">ملاحظات</label>
                  <p className="mt-1 p-3 bg-secondary text-white rounded-lg">{selectedTrip.notes}</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedTrip.status === TripStatus.IN_PROGRESS && (
                  <Button 
                    onClick={() => {
                      setShowDetailsModal(false)
                      router.push(`/${language}/driver/tracking?tripId=${selectedTrip.id}`)
                    }}
                    className="flex-1"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    فتح التتبع
                  </Button>
                )}
                
                {getNextStatus(selectedTrip.status) && (
                  <Button
                    onClick={() => {
                      updateTripStatus(selectedTrip.id, getNextStatus(selectedTrip.status)!)
                      setShowDetailsModal(false)
                    }}
                    disabled={updatingStatus === selectedTrip.id}
                    className="flex-1"
                  >
                    {updatingStatus === selectedTrip.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {getStatusAction(selectedTrip.status)?.icon}
                        <span className="ml-2">{getStatusAction(selectedTrip.status)?.label}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
