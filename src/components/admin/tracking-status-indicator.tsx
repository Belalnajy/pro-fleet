"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, AlertTriangle } from "lucide-react"

export function TrackingStatusIndicator() {
  const [trackingEnabled, setTrackingEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkTrackingStatus()
  }, [])

  const checkTrackingStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/tracking')
      
      if (response.ok) {
        const data = await response.json()
        setTrackingEnabled(data.trackingEnabled)
      }
    } catch (error) {
      console.error('Error checking tracking status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-l-4 ${trackingEnabled ? 'border-l-green-500' : 'border-l-orange-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            حالة نظام التتبع
          </CardTitle>
          <Badge 
            variant={trackingEnabled ? "default" : "secondary"}
            className={trackingEnabled ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
          >
            {trackingEnabled ? "مفعل" : "معطل"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {trackingEnabled 
                ? "العملاء يمكنهم الوصول لصفحة التتبع ومشاهدة مواقع شحناتهم"
                : "العملاء لا يمكنهم الوصول لصفحة التتبع - تظهر لهم رسالة أن الخدمة غير متاحة"
              }
            </span>
          </div>
          
          {!trackingEnabled && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span>
                لتفعيل التتبع، اذهب إلى الإعدادات → Operations → Enable Real-Time Tracking
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
