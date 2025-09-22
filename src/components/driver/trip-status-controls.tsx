"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface StatusTransition {
  status: string
  label: string
  color: string
  icon: string
}

interface TripStatusControlsProps {
  tripId: string
  currentStatus: string
  onStatusUpdate: (newStatus: string) => void
  currentLocation?: {
    latitude: number
    longitude: number
    speed?: number
    heading?: number
  } | null
}

export function TripStatusControls({ 
  tripId, 
  currentStatus, 
  onStatusUpdate, 
  currentLocation 
}: TripStatusControlsProps) {
  const [availableTransitions, setAvailableTransitions] = useState<StatusTransition[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  // Load available transitions
  useEffect(() => {
    fetchAvailableTransitions()
  }, [currentStatus])

  const fetchAvailableTransitions = async () => {
    try {
      setLoading(true)
      console.log('Fetching transitions for trip:', tripId, 'status:', currentStatus)
      const response = await fetch(`/api/driver/trip-status?tripId=${tripId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Available transitions:', data.availableTransitions)
        setAvailableTransitions(data.availableTransitions || [])
      } else {
        console.error('Failed to fetch transitions:', response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching transitions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdating(newStatus)
      
      const response = await fetch("/api/driver/trip-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tripId,
          status: newStatus,
          location: currentLocation ? {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            speed: currentLocation.speed,
            heading: currentLocation.heading
          } : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "تم تحديث الحالة",
          description: data.message,
        })
        onStatusUpdate(newStatus)
        await fetchAvailableTransitions()
      } else {
        const error = await response.json()
        throw new Error(error.error || "فشل في تحديث الحالة")
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الحالة",
        variant: "destructive"
      })
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-gray-500",
      ASSIGNED: "bg-blue-500", 
      IN_PROGRESS: "bg-orange-500",
      EN_ROUTE_PICKUP: "bg-yellow-500",
      AT_PICKUP: "bg-purple-500",
      PICKED_UP: "bg-green-500",
      IN_TRANSIT: "bg-blue-600",
      AT_DESTINATION: "bg-indigo-500",
      DELIVERED: "bg-green-600",
      CANCELLED: "bg-red-500"
    }
    return colors[status] || "bg-gray-500"
  }

  const getStatusText = (status: string) => {
    const statusNames: Record<string, string> = {
      PENDING: "في انتظار البدء",
      ASSIGNED: "تم التعيين",
      IN_PROGRESS: "جاري التنفيذ", 
      EN_ROUTE_PICKUP: "في الطريق للاستلام",
      AT_PICKUP: "وصل لنقطة الاستلام",
      PICKED_UP: "تم الاستلام",
      IN_TRANSIT: "في الطريق للوجهة",
      AT_DESTINATION: "وصل للوجهة", 
      DELIVERED: "تم التسليم",
      CANCELLED: "ملغية"
    }
    return statusNames[status] || status
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="mr-2">جاري التحميل...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>حالة الرحلة</span>
          <Badge className={getStatusColor(currentStatus)}>
            {getStatusText(currentStatus)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {availableTransitions.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              الإجراءات المتاحة:
            </p>
            {availableTransitions.map((transition) => (
              <Button
                key={transition.status}
                onClick={() => handleStatusUpdate(transition.status)}
                disabled={updating === transition.status}
                className="w-full justify-start"
                variant="outline"
              >
                {updating === transition.status ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <span className="ml-2">{transition.icon}</span>
                )}
                {transition.label}
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {currentStatus === "DELIVERED" || currentStatus === "CANCELLED" 
                ? "تم إنهاء الرحلة" 
                : "لا توجد إجراءات متاحة حالياً"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
