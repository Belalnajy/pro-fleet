"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LocationPicker } from "./location-picker"
import { MapPin, Navigation, Edit } from "lucide-react"

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

interface LocationSelectorProps {
  label: string
  placeholder: string
  value?: LocationData | null
  onChange: (location: LocationData) => void
  type: "origin" | "destination"
  required?: boolean
  disabled?: boolean
}

export function LocationSelector({
  label,
  placeholder,
  value,
  onChange,
  type,
  required = false,
  disabled = false
}: LocationSelectorProps) {
  const [showPicker, setShowPicker] = useState(false)

  const handleLocationSelect = (location: LocationData) => {
    onChange(location)
    setShowPicker(false)
  }

  const getDisplayText = () => {
    if (!value) return ""
    return value.name || value.address || `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
  }

  const getIcon = () => {
    if (type === "origin") {
      return <Navigation className="w-4 h-4 text-green-600" />
    }
    return <MapPin className="w-4 h-4 text-red-600" />
  }

  const getPickerTitle = () => {
    return type === "origin" ? "اختيار نقطة البداية" : "اختيار نقطة النهاية"
  }

  return (
    <div className="space-y-3">
      {label && (
        <Label className={`text-sm font-medium ${required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}`}>
          {label}
        </Label>
      )}
      
      {value ? (
        <div className="relative">
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-1 flex-shrink-0 ${type === 'origin' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <MapPin className={`w-3 h-3 sm:w-4 sm:h-4 ${type === 'origin' ? 'text-green-600' : 'text-red-600'}`} />
                <span className="font-medium text-gray-900 truncate text-sm sm:text-base">
                  {value.name || value.address || 'موقع محدد'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 font-mono bg-white px-2 py-1 rounded border inline-block">
                  {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
                </p>
                {value.address && value.name !== value.address && (
                  <p className="text-xs text-gray-500 break-words line-clamp-2">{value.address}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPicker(true)}
              className="flex-shrink-0 hover:bg-white/50 p-1 sm:p-2"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="text-xs sm:text-sm">تعديل</span>
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowPicker(true)}
          className="w-full h-12 sm:h-16 border-dashed border-2 hover:border-solid hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-xs sm:text-sm text-gray-600 group-hover:text-blue-700">
              {placeholder || 'اختر موقع من الخريطة'}
            </span>
          </div>
        </Button>
      )}

      <LocationPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onLocationSelect={handleLocationSelect}
        title={getPickerTitle()}
        initialLocation={value}
        type={type}
      />
    </div>
  )
}
