"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MapPin, Search, Navigation, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import Leaflet CSS statically
import "leaflet/dist/leaflet.css"

// Dynamic import for Leaflet components to prevent SSR issues
const MapComponent = dynamic(
  () => {
    return Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([reactLeaflet, leaflet]) => {
      const { MapContainer, TileLayer, Marker, useMapEvents } = reactLeaflet
      const L = leaflet.default
      
      // Fix for default markers
      if (typeof window !== "undefined") {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })
      }
      
      function LocationMarker({ position, setPosition }: any) {
        useMapEvents({
          click(e: any) {
            setPosition(e.latlng)
          },
        })
        return position ? <Marker position={position} /> : null
      }
      
      return function DynamicMapComponent({ position, setPosition, mapRef, defaultCenter }: any) {
        return (
          <MapContainer
            center={position ? [position.lat, position.lng] : defaultCenter}
            zoom={position ? 15 : 6}
            style={{ height: "100%", width: "100%" }}
            className="z-10"
            ref={mapRef}
            zoomControl={true}
            touchZoom={true}
            doubleClickZoom={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        )
      }
    })
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }
)

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

interface LocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: LocationData) => void
  title: string
  initialLocation?: LocationData | null
  type: "origin" | "destination"
}



export function LocationPicker({
  isOpen,
  onClose,
  onLocationSelect,
  title,
  initialLocation,
  type
}: LocationPickerProps) {
  const [position, setPosition] = useState<any | null>(null)
  const [address, setAddress] = useState(initialLocation?.address || "")
  const [locationName, setLocationName] = useState(initialLocation?.name || "")
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const mapRef = useRef<any>(null)
  const { toast } = useToast()

  // Initialize position when component mounts
  useEffect(() => {
    if (initialLocation && typeof window !== "undefined") {
      import("leaflet").then((L) => {
        const newPos = new L.LatLng(initialLocation.lat, initialLocation.lng)
        setPosition(newPos)
      })
    }
  }, [initialLocation])

  // Default center (Riyadh, Saudi Arabia)
  const defaultCenter: [number, number] = [24.7136, 46.6753]

  // Predefined locations in Saudi Arabia
  const predefinedLocations = [
    { name: "الرياض", nameEn: "Riyadh", lat: 24.7136, lng: 46.6753 },
    { name: "جدة", nameEn: "Jeddah", lat: 21.3891, lng: 39.8579 },
    { name: "مكة المكرمة", nameEn: "Mecca", lat: 21.4225, lng: 39.8262 },
    { name: "المدينة المنورة", nameEn: "Medina", lat: 24.5247, lng: 39.5692 },
    { name: "الدمام", nameEn: "Dammam", lat: 26.4207, lng: 50.0888 },
    { name: "تبوك", nameEn: "Tabuk", lat: 28.3998, lng: 36.5700 },
    { name: "أبها", nameEn: "Abha", lat: 18.2164, lng: 42.5053 },
    { name: "الطائف", nameEn: "Taif", lat: 21.2703, lng: 40.4178 },
    { name: "بريدة", nameEn: "Buraidah", lat: 26.3260, lng: 43.9750 },
    { name: "خميس مشيط", nameEn: "Khamis Mushait", lat: 18.3000, lng: 42.7300 }
  ]

  // Get current location
  const getCurrentLocation = () => {
    setIsLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (typeof window !== "undefined") {
            import("leaflet").then((L) => {
              const newPos = new L.LatLng(position.coords.latitude, position.coords.longitude)
              setPosition(newPos)
              if (mapRef.current) {
                mapRef.current.flyTo(newPos, 15)
              }
              reverseGeocode(newPos)
            })
          }
          setIsLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "خطأ في تحديد الموقع",
            description: "لا يمكن الوصول إلى موقعك الحالي",
            variant: "destructive"
          })
          setIsLoading(false)
        }
      )
    } else {
      toast({
        title: "خطأ",
        description: "المتصفح لا يدعم تحديد الموقع",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (latlng: any) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&accept-language=ar`
      )
      const data = await response.json()
      if (data.display_name) {
        setAddress(data.display_name)
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
    }
  }

  // Search for location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=sa&limit=1&accept-language=ar`
      )
      const data = await response.json()
      
      if (data.length > 0) {
        const result = data[0]
        if (typeof window !== "undefined") {
          import("leaflet").then((L) => {
            const newPos = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon))
            setPosition(newPos)
            setLocationName(searchQuery)
            setAddress(result.display_name)
            if (mapRef.current) {
              mapRef.current.flyTo(newPos, 15)
            }
          })
        }
      } else {
        toast({
          title: "لم يتم العثور على الموقع",
          description: "حاول البحث بكلمات مختلفة",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن الموقع",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  // Select predefined location
  const selectPredefinedLocation = (location: typeof predefinedLocations[0]) => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        const newPos = new L.LatLng(location.lat, location.lng)
        setPosition(newPos)
        setLocationName(location.name)
        setAddress(`${location.name} - ${location.nameEn}`)
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 15)
        }
      })
    }
  }

  // Confirm location selection
  const confirmLocation = () => {
    if (!position) {
      toast({
        title: "لم يتم اختيار موقع",
        description: "يرجى اختيار موقع على الخريطة",
        variant: "destructive"
      })
      return
    }

    const locationData: LocationData = {
      lat: position.lat,
      lng: position.lng,
      address: address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
      name: locationName || address || `موقع مخصص`
    }

    onLocationSelect(locationData)
    onClose()
  }

  // Filter predefined locations based on search
  const filteredLocations = predefinedLocations.filter(location =>
    location.name.includes(searchQuery) || location.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-7xl h-[98vh] max-h-[98vh] overflow-y-auto  p-0">
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-0 h-[calc(98vh-170px)]">
          {/* Map Section */}
          <div className="lg:col-span-2 relative bg-gray-100 h-[50vh] lg:h-full">
            <MapComponent 
              position={position}
              setPosition={setPosition}
              mapRef={mapRef}
              defaultCenter={defaultCenter}
            />
            
            {/* Current Location Button */}
            <Button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-[1000] shadow-lg bg-white text-gray-700 hover:bg-gray-50 border"
              size="sm"
            >
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">موقعي</span>
            </Button>
          </div>

          {/* Controls Section */}
          <div className="bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto flex-1 lg:flex-none max-h-[40vh] lg:max-h-none">
            {/* Search */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-medium text-gray-700">البحث عن موقع</Label>
              <div className="flex gap-1 sm:gap-2">
                <Input
                  placeholder="ابحث عن مدينة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                  className="flex-1 text-sm"
                />
                <Button 
                  onClick={searchLocation} 
                  disabled={isLoading} 
                  size="sm"
                  className="px-2 sm:px-3"
                >
                  <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            {/* Predefined Locations */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-medium text-gray-700">المدن الرئيسية</Label>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1 sm:gap-2 max-h-32 sm:max-h-48 overflow-y-auto">
                {filteredLocations.map((location) => (
                  <Button
                    key={location.nameEn}
                    variant="ghost"
                    size="sm"
                    onClick={() => selectPredefinedLocation(location)}
                    className="w-full justify-start text-right hover:bg-blue-50 p-1 sm:p-2 h-auto text-xs sm:text-sm"
                  >
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{location.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Location Details */}
            {position && (
              <div className="space-y-2 sm:space-y-4 p-2 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${type === 'origin' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">
                    {type === 'origin' ? 'نقطة البداية' : 'نقطة النهاية'}
                  </Label>
                </div>
                
                <div>
                  <Label htmlFor="locationName" className="text-xs sm:text-sm font-medium text-gray-700">اسم الموقع</Label>
                  <Input
                    id="locationName"
                    placeholder="أدخل اسم الموقع..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500">الإحداثيات</Label>
                  <p className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded border">
                    {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                  </p>
                </div>

                {address && (
                  <div>
                    <Label className="text-xs text-gray-500">العنوان</Label>
                    <p className="text-xs text-gray-700 bg-white p-2 rounded border break-words line-clamp-2">{address}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-3 sm:px-6  sm:py-1 border-t bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="w-full sm:flex-1 h-12 text-sm font-medium">
              <X className="w-4 h-4 mr-2" />
              إلغاء
            </Button>
            <Button 
              onClick={confirmLocation} 
              disabled={!position}
              className="w-full sm:flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-sm font-medium"
            >
              <Check className="w-4 h-4 mr-2" />
              تأكيد الموقع
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
