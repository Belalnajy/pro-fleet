"use client"

import { useState } from "react"
import { LocationSelector } from "@/components/ui/location-selector"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

export default function TestLocationPage() {
  const [originLocation, setOriginLocation] = useState<LocationData | null>(null)
  const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!originLocation || !destinationLocation) {
      alert("يرجى اختيار كلا الموقعين")
      return
    }

    setIsSubmitting(true)
    console.log("Origin:", originLocation)
    console.log("Destination:", destinationLocation)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    alert(`✅ تم اختيار المواقع بنجاح!\n\n🟢 نقطة البداية: ${originLocation.name || originLocation.address}\n🔴 نقطة النهاية: ${destinationLocation.name || destinationLocation.address}`)
    setIsSubmitting(false)
  }

  const handleReset = () => {
    setOriginLocation(null)
    setDestinationLocation(null)
  }

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (point1: LocationData, point2: LocationData): string => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    return distance.toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ اختبار اختيار المواقع من الخريطة
          </h1>
          <p className="text-gray-600">
            اختبر ميزة اختيار المواقع التفاعلية باستخدام الخريطة
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6" />
              تحديد مسار الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LocationSelector
                label="🟢 نقطة البداية"
                placeholder="اختر نقطة البداية من الخريطة"
                value={originLocation}
                onChange={setOriginLocation}
                type="origin"
                required
              />
              
              <LocationSelector
                label="🔴 نقطة النهاية"
                placeholder="اختر نقطة النهاية من الخريطة"
                value={destinationLocation}
                onChange={setDestinationLocation}
                type="destination"
                required
              />
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleSubmit} 
                disabled={!originLocation || !destinationLocation || isSubmitting}
                className="px-8 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "جاري المعالجة..." : "✅ تأكيد المسار"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="px-6"
              >
                🔄 إعادة تعيين
              </Button>
            </div>
            
            {/* Display selected locations */}
            {(originLocation || destinationLocation) && (
              <div className="bg-gradient-to-r from-green-50 to-red-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-center text-gray-800">
                  📍 ملخص المسار المحدد
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {originLocation && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <strong className="text-green-700">نقطة البداية</strong>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">
                        {originLocation.name || originLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {originLocation.lat.toFixed(6)}, {originLocation.lng.toFixed(6)}
                      </p>
                      {originLocation.address && originLocation.name !== originLocation.address && (
                        <p className="text-xs text-gray-600 mt-1">{originLocation.address}</p>
                      )}
                    </div>
                  )}
                  
                  {destinationLocation && (
                    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <strong className="text-red-700">نقطة النهاية</strong>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">
                        {destinationLocation.name || destinationLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {destinationLocation.lat.toFixed(6)}, {destinationLocation.lng.toFixed(6)}
                      </p>
                      {destinationLocation.address && destinationLocation.name !== destinationLocation.address && (
                        <p className="text-xs text-gray-600 mt-1">{destinationLocation.address}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {originLocation && destinationLocation && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg text-center">
                    <p className="text-sm text-blue-800">
                      🛣️ المسافة التقريبية: {calculateDistance(originLocation, destinationLocation)} كم
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
