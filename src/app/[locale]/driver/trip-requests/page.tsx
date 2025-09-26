"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import {
  Clock,
  MapPin,
  Truck,
  SaudiRiyal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Thermometer,
  User,
  Package
} from "lucide-react"

interface TripRequest {
  id: string
  status: string
  requestedAt: string
  expiresAt: string
  trip: {
    id: string
    tripNumber: string
    fromCity: { name: string }
    toCity: { name: string }
    scheduledDate: string
    price: number
    currency: string
    notes?: string
    customer: { name: string }
    temperature: {
      option: string
      value: number
      unit: string
    }
    vehicle: {
      vehicleType: {
        name: string
        capacity: string
      }
    }
  }
}

export default function DriverTripRequests({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()

  const [requests, setRequests] = useState<TripRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DRIVER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchRequests()
    }
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/driver/trip-requests?status=PENDING')
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الطلبات",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setResponding(requestId)
      const response = await fetch('/api/driver/trip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          action: action.toUpperCase() // ACCEPT or REJECT
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: action === 'accept' ? "تم قبول الرحلة" : "تم رفض الرحلة",
          description: data.message
        })
        fetchRequests() // Refresh list
      } else {
        toast({
          title: "خطأ",
          description: data.error,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error responding to request:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الرد على الطلب",
        variant: "destructive"
      })
    } finally {
      setResponding(null)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffInMinutes = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes <= 0) return "انتهت الصلاحية"
    if (diffInMinutes < 60) return `${diffInMinutes} دقيقة متبقية`
    
    const hours = Math.floor(diffInMinutes / 60)
    const minutes = diffInMinutes % 60
    return `${hours}س ${minutes}د متبقية`
  }

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt)
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "DRIVER") {
    return null
  }

  return (
    <DashboardLayout
      title="طلبات الرحلات"
      subtitle="الطلبات المرسلة إليك من العملاء"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات جديدة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد الانتظار</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {requests.filter(r => !isExpired(r.expiresAt)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">منتهية الصلاحية</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => isExpired(r.expiresAt)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                لا توجد طلبات جديدة
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                ستظهر طلبات الرحلات الجديدة هنا عند وصولها
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.filter(r => !isExpired(r.expiresAt)).map((request) => (
            <Card 
              key={request.id} 
              className="border-blue-200"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      رحلة {request.trip.tripNumber}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.trip.customer.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.trip.scheduledDate).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {request.trip.price.toLocaleString()} {request.trip.currency}
                    </div>
                    <Badge variant="secondary">
                      {getTimeRemaining(request.expiresAt)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm">
                        <strong>من:</strong> {request.trip.fromCity.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-sm">
                        <strong>إلى:</strong> {request.trip.toCity.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        <strong>المركبة:</strong> {request.trip.vehicle.vehicleType.name} - {request.trip.vehicle.vehicleType.capacity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">
                        <strong>الحرارة:</strong> {request.trip.temperature.option} ({request.trip.temperature.value}{request.trip.temperature.unit})
                      </span>
                    </div>
                  </div>
                </div>

                {request.trip.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <strong>ملاحظات:</strong> {request.trip.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  {!isExpired(request.expiresAt) ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => respondToRequest(request.id, 'reject')}
                        disabled={responding === request.id}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        رفض
                      </Button>
                      <Button
                        onClick={() => respondToRequest(request.id, 'accept')}
                        disabled={responding === request.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        قبول الرحلة
                      </Button>
                    </>
                  ) : (
                    <Badge variant="destructive">
                      انتهت صلاحية الطلب
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}
