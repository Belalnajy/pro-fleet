"use client"

import { useState, useEffect } from "react"
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
import { LocationSelector } from "@/components/ui/location-selector"
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

interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}

interface City {
  id: string
  name: string
}

interface VehicleType {
  id: string
  name: string
  capacity: string
  pricePerKm: number
}

export default function BookTrip() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [cities, setCities] = useState<City[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [temperatures, setTemperatures] = useState<any[]>([])
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
    originLocation: null as LocationData | null,
    destinationLocation: null as LocationData | null
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push("/auth/signin")
    } else {
      fetchCities()
      fetchVehicleTypes()
      fetchVehicles()
      fetchTemperatures()
    }
  }, [session, status, router])

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/customer/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data)
        console.log("Cities loaded:", data)
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
      const response = await fetch("/api/customer/vehicles")
      if (response.ok) {
        const data = await response.json()
        // Transform data to match expected interface
        const transformedData = data.map((vehicle: any) => ({
          id: vehicle.id,
          name: vehicle.vehicleType?.name || vehicle.vehicleTypeId,
          capacity: vehicle.capacity,
          pricePerKm: 0 // Default value
        }))
        setVehicleTypes(transformedData)
        console.log("Vehicles loaded:", transformedData)
      } else {
        console.error("Failed to fetch vehicles:", response.status)
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
    setSubmitting(true)
    try {
      // Get the selected temperature ID
      let temperatureId = null
      if (tripForm.temperatureRequirement && tripForm.temperatureRequirement !== "ambient") {
        const selectedTemp = temperatures.find(t => t.option.toLowerCase() === tripForm.temperatureRequirement.toLowerCase())
        temperatureId = selectedTemp?.id || null
      }

      // Get the selected vehicle ID (use first available if not specified)
      let vehicleId = null
      if (vehicles.length > 0) {
        vehicleId = vehicles[0].id // Use first available vehicle
      }

      const tripData = {
        fromCityId: tripForm.fromCityId,
        toCityId: tripForm.toCityId,
        scheduledDate: tripForm.scheduledPickupDate,
        temperatureId: temperatureId,
        vehicleId: vehicleId,
        price: estimatedPrice || 500,
        notes: `Cargo: ${tripForm.cargoType}, Weight: ${tripForm.cargoWeight}kg, Value: ${tripForm.cargoValue} SAR. Pickup: ${tripForm.pickupAddress}, Delivery: ${tripForm.deliveryAddress}`
      }

      console.log('Sending trip data:', tripData)

      const response = await fetch("/api/customer/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Trip created successfully:', result)
        setStep(4) // Success step
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(t("errorCreatingTrip") + ': ' + (errorData.error || 'Unknown error'))
      }
    } catch (error: any) {
      console.error("Error creating trip:", error)
      alert(t("errorCreatingTrip") + ': ' + (error.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const nextStep = () => {
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
        return (tripForm.originLocation && tripForm.destinationLocation) || 
               (tripForm.fromCityId && tripForm.toCityId && tripForm.pickupAddress && tripForm.deliveryAddress)
      case 2:
        return tripForm.cargoType && tripForm.cargoWeight && tripForm.cargoValue
      case 3:
        return tripForm.scheduledPickupDate && tripForm.estimatedDeliveryDate
      default:
        return true
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading text={t("loading")} />
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
              <h2 className="text-2xl font-bold mb-2">{t("tripRequestSubmitted")}</h2>
              <p className="text-muted-foreground mb-6">{t("tripRequestDescription")}</p>
              <div className="space-y-2">
                <Button onClick={() => router.push("/customer/my-trips")} className="w-full">
                  {t("viewMyTrips")}
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
                    originLocation: null,
                    destinationLocation: null
                  })
                }} className="w-full">
                  {t("bookAnotherTrip")}
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
          <h1 className="text-3xl font-bold">{t("bookNewTrip")}</h1>
          <p className="text-muted-foreground">{t("fillDetailsToBookTrip")}</p>
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
              {step === 1 && t("routeAndAddresses")}
              {step === 2 && t("cargoDetails")}
              {step === 3 && t("scheduleAndConfirm")}
            </CardTitle>
            <CardDescription>
              {step === 1 && t("selectPickupAndDelivery")}
              {step === 2 && t("provideCargoInformation")}
              {step === 3 && t("setDatesAndConfirm")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Route and Addresses */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Map-based Location Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    اختيار المواقع من الخريطة
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LocationSelector
                      label="🟢 نقطة الاستلام"
                      placeholder="اختر نقطة الاستلام من الخريطة"
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
                      label="🔴 نقطة التسليم"
                      placeholder="اختر نقطة التسليم من الخريطة"
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
                </div>

                {/* Traditional City Selection (Alternative) */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px bg-gray-300 flex-1"></div>
                    <span className="text-sm text-gray-500 px-3">أو اختر من المدن المحفوظة</span>
                    <div className="h-px bg-gray-300 flex-1"></div>
                  </div>
                  
                  {(tripForm.originLocation || tripForm.destinationLocation) && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-700 text-center">
                        ⚠️ تم اختيار المواقع من الخريطة. لاستخدام المدن المحفوظة، قم بإلغاء اختيار المواقع من الخريطة أولاً.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromCity">{t("fromCity")}</Label>
                      <Select
                        value={tripForm.fromCityId}
                        onValueChange={(value) => setTripForm({
                          ...tripForm, 
                          fromCityId: value,
                          // Clear map location when city is selected
                          originLocation: value ? null : tripForm.originLocation
                        })}
                        disabled={!!tripForm.originLocation}
                      >
                        <SelectTrigger className={tripForm.originLocation ? 'opacity-50' : ''}>
                          <SelectValue placeholder={t("selectFromCity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="toCity">{t("toCity")}</Label>
                      <Select
                        value={tripForm.toCityId}
                        onValueChange={(value) => setTripForm({
                          ...tripForm, 
                          toCityId: value,
                          // Clear map location when city is selected
                          destinationLocation: value ? null : tripForm.destinationLocation
                        })}
                        disabled={!!tripForm.destinationLocation}
                      >
                        <SelectTrigger className={tripForm.destinationLocation ? 'opacity-50' : ''}>
                          <SelectValue placeholder={t("selectToCity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pickupAddress">{t("pickupAddress")}</Label>
                    <Input
                      id="pickupAddress"
                      value={tripForm.pickupAddress}
                      onChange={(e) => setTripForm({...tripForm, pickupAddress: e.target.value})}
                      placeholder={t("enterPickupAddress")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryAddress">{t("deliveryAddress")}</Label>
                    <Input
                      id="deliveryAddress"
                      value={tripForm.deliveryAddress}
                      onChange={(e) => setTripForm({...tripForm, deliveryAddress: e.target.value})}
                      placeholder={t("enterDeliveryAddress")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Cargo Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cargoType">{t("cargoType")}</Label>
                    <Input
                      id="cargoType"
                      value={tripForm.cargoType}
                      onChange={(e) => setTripForm({...tripForm, cargoType: e.target.value})}
                      placeholder={t("enterCargoType")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargoWeight">{t("cargoWeight")} (kg)</Label>
                    <Input
                      id="cargoWeight"
                      type="number"
                      value={tripForm.cargoWeight}
                      onChange={(e) => setTripForm({...tripForm, cargoWeight: e.target.value})}
                      placeholder={t("enterCargoWeight")}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cargoValue">{t("cargoValue")} ({t("currency")})</Label>
                    <Input
                      id="cargoValue"
                      type="number"
                      value={tripForm.cargoValue}
                      onChange={(e) => setTripForm({...tripForm, cargoValue: e.target.value})}
                      placeholder={t("enterCargoValue")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperatureRequirement">{t("temperatureRequirement")}</Label>
                    <Select
                      value={tripForm.temperatureRequirement}
                      onValueChange={(value) => setTripForm({...tripForm, temperatureRequirement: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ambient">{t("ambient")}</SelectItem>
                        <SelectItem value="cold_2">+2°C</SelectItem>
                        <SelectItem value="cold_10">+10°C</SelectItem>
                        <SelectItem value="frozen">-18°C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="specialInstructions">{t("specialInstructions")}</Label>
                  <Textarea
                    id="specialInstructions"
                    value={tripForm.specialInstructions}
                    onChange={(e) => setTripForm({...tripForm, specialInstructions: e.target.value})}
                    placeholder={t("enterSpecialInstructions")}
                  />
                </div>
                {estimatedPrice > 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t("estimatedPrice")}:</span>
                      <span className="text-lg font-bold text-primary">
                        {(estimatedPrice || 0).toFixed(2)} {t("currency")}
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
                    <Label htmlFor="scheduledPickupDate">{t("scheduledPickupDate")}</Label>
                    <Input
                      id="scheduledPickupDate"
                      type="datetime-local"
                      value={tripForm.scheduledPickupDate}
                      onChange={(e) => setTripForm({...tripForm, scheduledPickupDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedDeliveryDate">{t("estimatedDeliveryDate")}</Label>
                    <Input
                      id="estimatedDeliveryDate"
                      type="datetime-local"
                      value={tripForm.estimatedDeliveryDate}
                      onChange={(e) => setTripForm({...tripForm, estimatedDeliveryDate: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Summary */}
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold">{t("tripSummary")}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("route")}:</span>
                      <p className="font-medium">
                        {cities.find(c => c.id === tripForm.fromCityId)?.name} → {cities.find(c => c.id === tripForm.toCityId)?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("cargo")}:</span>
                      <p className="font-medium">{tripForm.cargoType} ({tripForm.cargoWeight} kg)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("pickupDate")}:</span>
                      <p className="font-medium">
                        {tripForm.scheduledPickupDate ? new Date(tripForm.scheduledPickupDate).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("estimatedPrice")}:</span>
                      <p className="font-medium text-primary">
                        {(estimatedPrice || 0).toFixed(2)} {t("currency")}
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
                {t("previous")}
              </Button>
              <Button
                onClick={nextStep}
                disabled={!isStepValid() || submitting}
              >
                {submitting ? t("submitting") : (step === 3 ? t("confirmBooking") : t("next"))}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
