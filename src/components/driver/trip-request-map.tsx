"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Maximize2, Minimize2 } from "lucide-react"

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
  isKnownCity?: boolean
}

interface TripRequestMapProps {
  originLocation?: LocationData | null
  destinationLocation?: LocationData | null
  fromCity?: { name: string }
  toCity?: { name: string }
  tripNumber: string
}

export function TripRequestMap({ 
  originLocation, 
  destinationLocation, 
  fromCity, 
  toCity, 
  tripNumber 
}: TripRequestMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return

    const loadMap = async () => {
      try {
        // تحديد النقاط للعرض على الخريطة
        const startPoint = originLocation ? {
          lat: originLocation.lat,
          lng: originLocation.lng,
          title: originLocation.name || "موقع البداية",
          isCustom: !originLocation.isKnownCity
        } : {
          lat: 24.7136, // الرياض كنقطة افتراضية
          lng: 46.6753,
          title: fromCity?.name || "موقع البداية",
          isCustom: false
        }

        const endPoint = destinationLocation ? {
          lat: destinationLocation.lat,
          lng: destinationLocation.lng,
          title: destinationLocation.name || "موقع الوجهة",
          isCustom: !destinationLocation.isKnownCity
        } : {
          lat: 21.3891, // جدة كنقطة افتراضية
          lng: 39.8579,
          title: toCity?.name || "موقع الوجهة",
          isCustom: false
        }

        // إنشاء خريطة Leaflet
        const L = (window as any).L
        const map = L.map(mapRef.current).setView(
          [(startPoint.lat + endPoint.lat) / 2, (startPoint.lng + endPoint.lng) / 2], 
          6
        )

        // إضافة طبقة الخريطة
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // إنشاء أيقونات مخصصة
        const createCustomIcon = (color: string, emoji: string) => {
          return L.divIcon({
            html: `<div style="
              background-color: ${color};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${emoji}</div>`,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }

        // إضافة نقطة البداية
        const startIcon = createCustomIcon(
          startPoint.isCustom ? '#3B82F6' : '#10B981',
          startPoint.isCustom ? '📍' : '🏙️'
        )
        L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
          .addTo(map)
          .bindPopup(startPoint.title)

        // إضافة نقطة الوجهة
        const endIcon = createCustomIcon(
          endPoint.isCustom ? '#EF4444' : '#EF4444',
          endPoint.isCustom ? '📍' : '🏙️'
        )
        L.marker([endPoint.lat, endPoint.lng], { icon: endIcon })
          .addTo(map)
          .bindPopup(endPoint.title)

        // رسم خط بين النقطتين
        L.polyline([
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng]
        ], {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.8
        }).addTo(map)

        // ضبط حدود الخريطة لتشمل النقطتين
        const bounds = L.latLngBounds([
          [startPoint.lat, startPoint.lng],
          [endPoint.lat, endPoint.lng]
        ])
        map.fitBounds(bounds, { padding: [20, 20] })

        setMapLoaded(true)
      } catch (error) {
        console.error("Error loading map:", error)
        setMapLoaded(false)
      }
    }

    // تحميل Leaflet إذا لم تكن محملة
    if (typeof (window as any).L === 'undefined') {
      // تحميل CSS
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(cssLink)

      // تحميل JavaScript
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = loadMap
      script.onerror = () => {
        console.error("Failed to load Leaflet")
        setMapLoaded(false)
      }
      document.head.appendChild(script)
    } else {
      loadMap()
    }
  }, [originLocation, destinationLocation, fromCity, toCity])

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            خريطة المسار - {tripNumber}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* معلومات المسار */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>
                <strong>من:</strong> {originLocation?.name || fromCity?.name || "غير محدد"}
                {originLocation && !originLocation.isKnownCity && (
                  <span className="text-blue-600 font-medium"> (موقع مخصص)</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              <span>
                <strong>إلى:</strong> {destinationLocation?.name || toCity?.name || "غير محدد"}
                {destinationLocation && !destinationLocation.isKnownCity && (
                  <span className="text-red-600 font-medium"> (موقع مخصص)</span>
                )}
              </span>
            </div>
          </div>

          {/* الخريطة */}
          <div 
            ref={mapRef} 
            className={`w-full rounded-lg border ${isExpanded ? 'h-96' : 'h-48'} transition-all duration-300`}
            style={{ minHeight: isExpanded ? '384px' : '192px' }}
          />

          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
