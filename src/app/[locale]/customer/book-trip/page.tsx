"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLoading } from "@/components/ui/loading"
import { useLanguage } from "@/components/providers/language-provider"
import { translations } from "@/lib/translations"
import { LocationSelector } from "@/components/ui/location-selector"
import { useToast } from "@/hooks/use-toast"
import { SavedAddressesModal } from "@/components/SavedAddressesModal"
import { SavedAddress } from "@/hooks/useSavedAddresses"
import {
  MapPin,
  Package,
  Calendar,
  Thermometer,
  Truck,
  DollarSign,
  ArrowRight,
  CheckCircle,
} from "lucide-react"

interface BookTripProps {
  params: Promise<{
    locale: string
  }>
}

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

interface City {
  id: string
  name: string
  nameAr?: string | null
  latitude?: number
  longitude?: number
}

interface VehicleType {
  id: string
  name: string
  capacity: string
  pricePerKm: number
}

export default function BookTrip({ params }: BookTripProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = use(params)
  const { t, language } = useLanguage()
  const { toast } = useToast()

  // Customer-specific translation function to avoid key conflicts
  const translate = (key: string): string => {
    const customerTranslations = translations[language as keyof typeof translations];
    if (customerTranslations && typeof customerTranslations === 'object') {
      const translation = (customerTranslations as any)[key];
      if (translation && typeof translation === 'string') {
        return translation;
      }
    }
    return t(key as any) || key;
  };

  // Function to get city name based on current language
  const getCityName = (city: City): string => {
    if (language === 'ar' && city.nameAr) {
      return city.nameAr;
    }
    return city.name; // Default to English name
  };
  
  const [cities, setCities] = useState<City[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [temperatures, setTemperatures] = useState<any[]>([])
  const [customsBrokers, setCustomsBrokers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [estimatedPrice, setEstimatedPrice] = useState(0)

  // Form state
  const [tripForm, setTripForm] = useState({
    fromCityId: "",
    toCityId: "",
    pickupAddress: "",
    deliveryAddress: "",
    cargoType: "",
    cargoWeight: "",
    cargoValue: "",
    temperatureRequirement: "ambient",
    specialInstructions: "",
    scheduledPickupDate: "",
    estimatedDeliveryDate: "",
    vehicleTypeId: "",
    customsBrokerId: "none",
    originLocation: null as LocationData | null,
    destinationLocation: null as LocationData | null
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchCities()
      fetchVehicleTypes()
      fetchVehicles()
      fetchTemperatures()
      fetchCustomsBrokers()
    }
  }, [session, status, router])

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/customer/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data)
        console.log("🏢 Cities loaded from API:", data.map(city => ({ id: city.id, name: city.name })))
      } else {
        console.error("Failed to fetch cities:", response.status)
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch("/api/customer/vehicle-types")
      if (response.ok) {
        const data = await response.json()
        // Transform data to match expected interface
        const transformedData = data.map((vehicleType: any) => ({
          id: vehicleType.id,
          name: vehicleType.name,
          capacity: vehicleType.capacity || "متوسط",
          pricePerKm: 0 // Default value
        }))
        setVehicleTypes(transformedData)
        console.log("Vehicle types loaded:", transformedData)
      } else {
        console.error("Failed to fetch vehicle types:", response.status)
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/customer/vehicles")
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
        console.log("Vehicles loaded:", data)
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  const fetchTemperatures = async () => {
    try {
      const response = await fetch("/api/customer/temperatures")
      if (response.ok) {
        const data = await response.json()
        setTemperatures(data)
        console.log("Temperatures loaded:", data)
      }
    } catch (error) {
      console.error("Error fetching temperatures:", error)
    }
  }

  const fetchCustomsBrokers = async () => {
    try {
      const response = await fetch("/api/customer/customs-brokers")
      if (response.ok) {
        const data = await response.json()
        setCustomsBrokers(data.brokers)
        console.log("Customs brokers loaded:", data.brokers)
      }
    } catch (error) {
      console.error("Error fetching customs brokers:", error)
    }
  }

  // Function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in kilometers
  }

  // Handle saved address selection
  const handleAddressSelection = (address: SavedAddress, type: 'pickup' | 'delivery') => {
    const locationData: LocationData = {
      lat: address.latitude || 0,
      lng: address.longitude || 0,
      address: address.address,
      name: address.label
    }

    if (type === 'pickup') {
      setTripForm({
        ...tripForm,
        originLocation: locationData,
        fromCityId: address.cityId || ''
      })
    } else {
      setTripForm({
        ...tripForm,
        destinationLocation: locationData,
        toCityId: address.cityId || ''
      })
    }

    toast({
      title: translate('addressSelected'),
      description: `${address.label}: ${address.address}`,
    })
  }

  // Function to find closest city to a location
  const findClosestCity = (location: LocationData, cities: City[]) => {
    let closestCity = cities[0]
    let minDistance = calculateDistance(
      location.lat, location.lng, 
      cities[0].latitude || 24.7136, cities[0].longitude || 46.6753
    )

    cities.forEach(city => {
      const distance = calculateDistance(
        location.lat, location.lng,
        city.latitude || 24.7136, city.longitude || 46.6753
      )
      if (distance < minDistance) {
        minDistance = distance
        closestCity = city
      }
    })

    return closestCity
  }

  const calculateEstimatedPrice = () => {
    const basePrice = 500 // Base price in SAR
    const weightMultiplier = tripForm.cargoWeight ? (parseFloat(tripForm.cargoWeight) / 1000) * 50 : 50
    const temperatureMultiplier = tripForm.temperatureRequirement === "ambient" ? 0 : 100
    const estimated = basePrice + weightMultiplier + temperatureMultiplier
    setEstimatedPrice(estimated)
  }

  useEffect(() => {
    if (tripForm.cargoWeight && tripForm.temperatureRequirement) {
      calculateEstimatedPrice()
    }
  }, [tripForm.cargoWeight, tripForm.temperatureRequirement])

  const handleSubmit = async () => {
    console.log('=== FORM STATE BEFORE SUBMISSION ===')
    console.log('Complete tripForm:', tripForm)
    console.log('fromCityId:', tripForm.fromCityId)
    console.log('toCityId:', tripForm.toCityId)
    console.log('originLocation:', tripForm.originLocation)
    console.log('destinationLocation:', tripForm.destinationLocation)
    console.log('=== END FORM STATE ===')
    
    setSubmitting(true)
    try {
      // Get the selected temperature ID
      let temperatureId = null
      if (tripForm.temperatureRequirement && tripForm.temperatureRequirement !== "ambient") {
        const selectedTemp = temperatures.find(t => t.option.toLowerCase() === tripForm.temperatureRequirement.toLowerCase())
        temperatureId = selectedTemp?.id || null
      }

      // Get the selected vehicle type ID (use first available if not specified)
      let vehicleTypeId = tripForm.vehicleTypeId
      if (!vehicleTypeId && vehicleTypes.length > 0) {
        vehicleTypeId = vehicleTypes[0].id // Use first available vehicle type
      }

      // Validate required fields before submission
      const hasOrigin = tripForm.fromCityId || tripForm.originLocation
      const hasDestination = tripForm.toCityId || tripForm.destinationLocation
      
      if (!hasOrigin || !hasDestination || !tripForm.scheduledPickupDate) {
        let missingFields: string[] = []
        if (!hasOrigin) missingFields.push('نقطة الاستلام')
        if (!hasDestination) missingFields.push('نقطة التسليم')
        if (!tripForm.scheduledPickupDate) missingFields.push('تاريخ الاستلام')
        
        toast({
          variant: "destructive",
          title: "يرجى ملء الحقول المطلوبة",
          description: missingFields.join(', ')
        })
        return
      }

      // Handle city IDs - Smart logic for map vs dropdown selection
      let finalFromCityId = tripForm.fromCityId
      let finalToCityId = tripForm.toCityId
      
      // If user selected map locations, find closest cities
      if (!finalFromCityId && tripForm.originLocation && cities.length > 0) {
        const closestFromCity = findClosestCity(tripForm.originLocation, cities)
        finalFromCityId = closestFromCity.id
        console.log('🗺️ Origin map location → closest city:', {
          location: tripForm.originLocation,
          closestCity: closestFromCity.name,
          distance: calculateDistance(
            tripForm.originLocation.lat, tripForm.originLocation.lng,
            closestFromCity.latitude || 24.7136, closestFromCity.longitude || 46.6753
          ).toFixed(2) + ' km'
        })
      }
      
      if (!finalToCityId && tripForm.destinationLocation && cities.length > 0) {
        const closestToCity = findClosestCity(tripForm.destinationLocation, cities)
        finalToCityId = closestToCity.id
        console.log('🗺️ Destination map location → closest city:', {
          location: tripForm.destinationLocation,
          closestCity: closestToCity.name,
          distance: calculateDistance(
            tripForm.destinationLocation.lat, tripForm.destinationLocation.lng,
            closestToCity.latitude || 24.7136, closestToCity.longitude || 46.6753
          ).toFixed(2) + ' km'
        })
      }
      
      // Validate that we have city IDs
      if (!finalFromCityId) {
        throw new Error('يجب اختيار مدينة الانطلاق أو تحديد موقع على الخريطة')
      }
      if (!finalToCityId) {
        throw new Error('يجب اختيار مدينة الوصول أو تحديد موقع على الخريطة')
      }
      
      // Smart validation: Allow same city only if using precise map locations
      const usingMapLocations = tripForm.originLocation && tripForm.destinationLocation
      const sameCitySelected = finalFromCityId === finalToCityId
      
      if (sameCitySelected && !usingMapLocations) {
        const cityName = cities.find(c => c.id === finalFromCityId)?.name
        toast({
          title: 'خطأ في اختيار المدن',
          description: `لا يمكن أن تكون مدينة الانطلاق والوصول نفس المدينة (${cityName}). يرجى اختيار مدينتين مختلفتين أو استخدم الخريطة لتحديد مواقع مختلفة.`,
          variant: 'destructive'
        })
        setSubmitting(false)
        return
      }
      
      // If same city but using map locations, check if locations are actually different
      if (sameCitySelected && usingMapLocations) {
        const distance = calculateDistance(
          tripForm.originLocation!.lat, tripForm.originLocation!.lng,
          tripForm.destinationLocation!.lat, tripForm.destinationLocation!.lng
        )
        
        // If locations are too close (less than 1km), warn user
        if (distance < 1) {
          toast({
            title: 'تحذير: المواقع متقاربة جداً',
            description: `المسافة بين نقطة الاستلام والتسليم أقل من كيلومتر واحد (${distance.toFixed(0)}م). هل أنت متأكد؟`,
            variant: 'default'
          })
          // Continue anyway - user might want very short distance trip
        }
        
        console.log('✅ Same city but different map locations:', {
          fromCity: cities.find(c => c.id === finalFromCityId)?.name,
          distance: distance.toFixed(2) + ' km',
          originLocation: tripForm.originLocation,
          destinationLocation: tripForm.destinationLocation
        })
      }

      const tripData = {
        fromCityId: finalFromCityId,
        toCityId: finalToCityId,
        scheduledDate: tripForm.scheduledPickupDate,
        temperatureId: temperatureId,
        vehicleTypeId: vehicleTypeId, // Send vehicle type ID instead of vehicle ID
        price: estimatedPrice || 500,
        notes: `Cargo: ${tripForm.cargoType}, Weight: ${tripForm.cargoWeight}kg, Value: ${tripForm.cargoValue} SAR. Pickup: ${tripForm.pickupAddress || (tripForm.originLocation?.address || 'Custom Location')}, Delivery: ${tripForm.deliveryAddress || (tripForm.destinationLocation?.address || 'Custom Location')}. Special Instructions: ${tripForm.specialInstructions}${tripForm.originLocation ? ` Origin: ${tripForm.originLocation.lat}, ${tripForm.originLocation.lng}` : ''}${tripForm.destinationLocation ? ` Destination: ${tripForm.destinationLocation.lat}, ${tripForm.destinationLocation.lng}` : ''}. Customs Broker: ${tripForm.customsBrokerId && tripForm.customsBrokerId !== 'none' ? customsBrokers.find(b => b.id === tripForm.customsBrokerId)?.name || 'غير محدد' : 'غير محدد'}`
      }

      console.log('🚛 Creating trip:', {
        fromCity: cities.find(c => c.id === finalFromCityId)?.name,
        toCity: cities.find(c => c.id === finalToCityId)?.name,
        fromCityId: finalFromCityId,
        toCityId: finalToCityId,
        scheduledDate: tripData.scheduledDate,
        price: tripData.price
      })

      const response = await fetch("/api/customer/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Trip created successfully:', result)
        toast({
          title: translate("tripBookedSuccessfully"),
          description: translate("tripBookedMessage")
        })
        setStep(4) // Success step
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        toast({
          variant: "destructive",
          title: translate("errorCreatingTrip"),
          description: errorData.error || 'Unknown error'
        })
      }
    } catch (error: any) {
      console.error("Error creating trip:", error)
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء الرحلة",
        description: error.message || 'Unknown error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const nextStep = () => {
    if (!isStepValid()) {
      // Show specific validation message based on current step
      switch (step) {
        case 1:
          toast({
            variant: "destructive",
            title: translate("selectPickupDeliveryError"),
            description: translate("fromMapOrCities")
          })
          break
        case 3:
          toast({
            variant: "destructive",
            title: translate("selectPickupDateError"),
            description: translate("pickupDateRequired")
          })
          break
      }
      return
    }
    
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        // Step 1: Either location coordinates OR city selection is required
        const hasOrigin = tripForm.fromCityId || tripForm.originLocation
        const hasDestination = tripForm.toCityId || tripForm.destinationLocation
        return hasOrigin && hasDestination
      case 2:
        // Step 2: Cargo details are optional, but if provided should be complete
        return true // Make cargo details optional
      case 3:
        // Step 3: Only pickup date is required
        return !!tripForm.scheduledPickupDate
      default:
        return true
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading text={translate("loading")} />
      </DashboardLayout>
    )
  }

  if (step === 4) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">{translate("tripRequestSubmitted")}</h2>
              <p className="text-muted-foreground mb-6">{translate("tripRequestDescription")}</p>
              <div className="space-y-2">
                <Button onClick={() => router.push(`/${locale}/customer/my-trips`)} className="w-full">
                  {translate("viewMyTrips")}
                </Button>
                <Button variant="outline" onClick={() => {
                  setStep(1)
                  setTripForm({
                    fromCityId: "",
                    toCityId: "",
                    pickupAddress: "",
                    deliveryAddress: "",
                    cargoType: "",
                    cargoWeight: "",
                    cargoValue: "",
                    temperatureRequirement: "ambient",
                    specialInstructions: "",
                    scheduledPickupDate: "",
                    estimatedDeliveryDate: "",
                    vehicleTypeId: "",
                    customsBrokerId: "none",
                    originLocation: null,
                    destinationLocation: null
                  })
                }} className="w-full">
                  {translate("bookAnotherTrip")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">{translate("bookNewTrip")}</h1>
          <p className="text-muted-foreground">{translate("fillDetailsToBookTrip")}</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <ArrowRight className={`h-4 w-4 mx-2 ${
                  step > stepNumber ? 'text-primary' : 'text-muted-foreground'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && translate("routeAndAddresses")}
              {step === 2 && translate("cargoDetails")}
              {step === 3 && translate("scheduleAndConfirm")}
            </CardTitle>
            <CardDescription>
              {step === 1 && (
                <span>
                  {translate("selectPickupAndDelivery")} <span className="text-red-500">*</span>
                </span>
              )}
              {step === 2 && translate("provideCargoInformation")}
              {step === 3 && (
                <span>
                  {translate("setDatesAndConfirm")} <span className="text-red-500">* {translate("pickupDateRequired")}</span>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Route and Addresses */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Map-based Location Selection */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {translate("selectLocationFromMap")}
                    </h3>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 leading-relaxed">
                        <strong>{translate("mapTip")}</strong>
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LocationSelector
                      label={translate("pickupPoint")}
                      placeholder={translate("selectPickupFromMap")}
                      value={tripForm.originLocation}
                      onChange={(location) => setTripForm({
                        ...tripForm, 
                        originLocation: location,
                        // Clear city selection when map location is selected
                        fromCityId: location ? '' : tripForm.fromCityId
                      })}
                      type="origin"
                    />
                    
                    <LocationSelector
                      label={translate("deliveryPoint")}
                      placeholder={translate("selectDeliveryFromMap")}
                      value={tripForm.destinationLocation}
                      onChange={(location) => setTripForm({
                        ...tripForm, 
                        destinationLocation: location,
                        // Clear city selection when map location is selected
                        toCityId: location ? '' : tripForm.toCityId
                      })}
                      type="destination"
                    />
                  </div>
                  
                  {/* Saved Addresses Quick Selection */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <span className="text-sm text-gray-500 px-3">{t('orSelectFromSavedAddresses')}</span>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('pickupPoint')}</Label>
                        <SavedAddressesModal
                          onSelectAddress={(address) => handleAddressSelection(address, 'pickup')}
                          trigger={
                            <Button variant="outline" className="w-full justify-start">
                              <MapPin className="h-4 w-4 mr-2" />
                              {tripForm.originLocation?.name || t('selectFromSavedAddresses')}
                            </Button>
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('deliveryPoint')}</Label>
                        <SavedAddressesModal
                          onSelectAddress={(address) => handleAddressSelection(address, 'delivery')}
                          trigger={
                            <Button variant="outline" className="w-full justify-start">
                              <MapPin className="h-4 w-4 mr-2" />
                              {tripForm.destinationLocation?.name || t('selectFromSavedAddresses')}
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Traditional City Selection (Alternative) */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-sm text-gray-500 px-3">{translate("orSelectFromSavedCities")}</span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                  
                  {(tripForm.originLocation || tripForm.destinationLocation) && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-800">
                            ✅ تم تحديد مواقع من الخريطة
                          </p>
                          <div className="text-xs text-green-700 space-y-1">
                            {tripForm.originLocation && (
                              <div>• نقطة الاستلام: {tripForm.originLocation.name || tripForm.originLocation.address || 'موقع مخصص'}</div>
                            )}
                            {tripForm.destinationLocation && (
                              <div>• نقطة التسليم: {tripForm.destinationLocation.name || tripForm.destinationLocation.address || 'موقع مخصص'}</div>
                            )}
                            <div className="text-green-600 font-medium">
                              📍 اختيار المدن من القائمة معطل مؤقتاً
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromCity">{translate("fromCity")}</Label>
                      <Select
                        value={tripForm.fromCityId}
                        onValueChange={(value) => {
                          console.log('🏁 FROM CITY SELECTED:', {
                            selectedId: value,
                            selectedName: cities.find(c => c.id === value)?.name,
                            allCities: cities.map(c => ({ id: c.id, name: c.name }))
                          })
                          const newForm = {
                            ...tripForm, 
                            fromCityId: value,
                            // Clear map location when city is selected
                            originLocation: value ? null : tripForm.originLocation
                          }
                          console.log('🔄 Updated form state (FROM):', {
                            fromCityId: newForm.fromCityId,
                            toCityId: newForm.toCityId
                          })
                          setTripForm(newForm)
                        }}
                        disabled={!!tripForm.originLocation}
                      >
                        <SelectTrigger className={tripForm.originLocation ? 'opacity-50' : ''}>
                          <SelectValue placeholder={translate("selectFromCity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {getCityName(city)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="toCity">{translate("toCity")}</Label>
                      <Select
                        value={tripForm.toCityId}
                        onValueChange={(value) => {
                          console.log('🏁 TO CITY SELECTED:', {
                            selectedId: value,
                            selectedName: cities.find(c => c.id === value)?.name,
                            allCities: cities.map(c => ({ id: c.id, name: c.name }))
                          })
                          const newForm = {
                            ...tripForm, 
                            toCityId: value,
                            // Clear map location when city is selected
                            destinationLocation: value ? null : tripForm.destinationLocation
                          }
                          console.log('🔄 Updated form state (TO):', {
                            fromCityId: newForm.fromCityId,
                            toCityId: newForm.toCityId
                          })
                          setTripForm(newForm)
                        }}
                        disabled={!!tripForm.destinationLocation}
                      >
                        <SelectTrigger className={tripForm.destinationLocation ? 'opacity-50' : ''}>
                          <SelectValue placeholder={translate("selectToCity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {getCityName(city)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* <div>
                    <Label htmlFor="pickupAddress">{translate("pickupAddress")}</Label>
                    <Input
                      id="pickupAddress"
                      value={tripForm.pickupAddress}
                      onChange={(e) => setTripForm({...tripForm, pickupAddress: e.target.value})}
                      placeholder={translate("enterPickupAddress")}
                    />
                  </div> */}
                  {/* <div>
                    <Label htmlFor="deliveryAddress">{translate("deliveryAddress")}</Label>
                    <Input
                      id="deliveryAddress"
                      value={tripForm.deliveryAddress}
                      onChange={(e) => setTripForm({...tripForm, deliveryAddress: e.target.value})}
                      placeholder={translate("enterDeliveryAddress")}
                    />
                  </div> */}
                </div>
              </div>
            )}

            {/* Step 2: Cargo Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cargoType">{translate("cargoType")}</Label>
                    <Input
                      id="cargoType"
                      value={tripForm.cargoType}
                      onChange={(e) => setTripForm({...tripForm, cargoType: e.target.value})}
                      placeholder={translate("enterCargoType")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargoWeight">{translate("cargoWeight")} (kg)</Label>
                    <Input
                      id="cargoWeight"
                      type="number"
                      value={tripForm.cargoWeight}
                      onChange={(e) => setTripForm({...tripForm, cargoWeight: e.target.value})}
                      placeholder={translate("enterCargoWeight")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cargoValue">{translate("cargoValue")} ({translate("currency")})</Label>
                    <Input
                      id="cargoValue"
                      type="number"
                      value={tripForm.cargoValue}
                      onChange={(e) => setTripForm({...tripForm, cargoValue: e.target.value})}
                      placeholder={translate("enterCargoValue")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperatureRequirement">{translate("temperatureRequirement")}</Label>
                    <Select
                      value={tripForm.temperatureRequirement}
                      onValueChange={(value) => setTripForm({...tripForm, temperatureRequirement: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ambient">{translate("ambient")}</SelectItem>
                        <SelectItem value="cold_2">+2°C</SelectItem>
                        <SelectItem value="cold_10">+10°C</SelectItem>
                        <SelectItem value="frozen">-18°C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="specialInstructions">{translate("specialInstructions")}</Label>
                  <Textarea
                    id="specialInstructions"
                    value={tripForm.specialInstructions}
                    onChange={(e) => setTripForm({...tripForm, specialInstructions: e.target.value})}
                    placeholder={translate("enterSpecialInstructions")}
                  />
                </div>
                {estimatedPrice > 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{translate("estimatedPrice")}:</span>
                      <span className="text-lg font-bold text-primary">
                        {(estimatedPrice || 0).toFixed(2)} {translate("currency")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Schedule and Confirm */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledPickupDate">{translate("scheduledPickupDate")}</Label>
                    <Input
                      id="scheduledPickupDate"
                      type="datetime-local"
                      value={tripForm.scheduledPickupDate}
                      onChange={(e) => setTripForm({...tripForm, scheduledPickupDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedDeliveryDate">{translate("estimatedDeliveryDate")}</Label>
                    <Input
                      id="estimatedDeliveryDate"
                      type="datetime-local"
                      value={tripForm.estimatedDeliveryDate}
                      onChange={(e) => setTripForm({...tripForm, estimatedDeliveryDate: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Customs Broker Selection */}
                <div>
                  <Label htmlFor="customsBroker">{translate("customsBroker")}</Label>
                  <Select
                    value={tripForm.customsBrokerId}
                    onValueChange={(value) => setTripForm({...tripForm, customsBrokerId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={translate("selectCustomsBroker")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{translate("noCustomsBroker")}</SelectItem>
                      {customsBrokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name} - {broker.licenseNumber || 'غير محدد'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {translate("customsBrokerOptional")}
                  </p>
                </div>
                
                {/* Summary */}
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold">{translate("tripSummary")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{translate("route")}:</span>
                      <p className="font-medium">
                        {cities.find(c => c.id === tripForm.fromCityId)?.name} → {cities.find(c => c.id === tripForm.toCityId)?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("cargo")}:</span>
                      <p className="font-medium">{tripForm.cargoType} ({tripForm.cargoWeight} kg)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("pickupDate")}:</span>
                      <p className="font-medium">
                        {tripForm.scheduledPickupDate ? new Date(tripForm.scheduledPickupDate).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("estimatedPrice")}:</span>
                      <p className="font-medium text-primary">
                        {(estimatedPrice || 0).toFixed(2)} {translate("currency")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{translate("customsBroker")}:</span>
                      <p className="font-medium">
                        {tripForm.customsBrokerId && tripForm.customsBrokerId !== 'none' ? 
                          customsBrokers.find(b => b.id === tripForm.customsBrokerId)?.name || 'غير محدد' : 
                          translate("noCustomsBroker")
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 1}
              >
                {translate("previous")}
              </Button>
              <Button
                onClick={nextStep}
                disabled={!isStepValid() || submitting}
              >
                {submitting ? translate("submitting") : (step === 3 ? translate("confirmBooking") : translate("next"))}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
