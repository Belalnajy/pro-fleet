"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Truck, User, Plus, Trash2 } from "lucide-react"

interface Driver {
  id: string
  name: string
  email?: string
  phone?: string
  carPlateNumber: string
  nationality: string
  isAvailable?: boolean
  vehicleTypes: {
    id: string
    vehicleType: {
      id: string
      name: string
      nameAr: string
    }
  }[]
}

interface VehicleType {
  id: string
  name: string
  nameAr: string
}

export default function DriverVehicleTypesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [driversRes, vehicleTypesRes] = await Promise.all([
        fetch("/api/admin/drivers"),
        fetch("/api/admin/vehicle-types")
      ])

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        // Fetch vehicle types for each driver
        const driversWithVehicleTypes = await Promise.all(
          driversData.map(async (driver: any) => {
            try {
              const vehicleTypesRes = await fetch(`/api/admin/drivers/${driver.id}/vehicle-types`)
              if (vehicleTypesRes.ok) {
                const vehicleTypesData = await vehicleTypesRes.json()
                return { ...driver, vehicleTypes: vehicleTypesData.vehicleTypes || [] }
              }
            } catch (error) {
              console.error(`Error fetching vehicle types for driver ${driver.id}:`, error)
            }
            return { ...driver, vehicleTypes: [] }
          })
        )
        setDrivers(driversWithVehicleTypes)
      }

      if (vehicleTypesRes.ok) {
        const vehicleTypesData = await vehicleTypesRes.json()
        setVehicleTypes(vehicleTypesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "خطأ",
        description: "فشل في جلب البيانات",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const assignVehicleType = async () => {
    if (!selectedDriver || !selectedVehicleType) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار السائق ونوع المركبة",
        variant: "destructive"
      })
      return
    }

    setAssigning(true)
    try {
      const response = await fetch(`/api/admin/drivers/${selectedDriver}/vehicle-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleTypeId: selectedVehicleType })
      })

      if (response.ok) {
        toast({
          title: "نجح",
          description: "تم ربط السائق بنوع المركبة بنجاح"
        })
        setSelectedDriver("")
        setSelectedVehicleType("")
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "خطأ",
          description: error.error || "فشل في ربط السائق بنوع المركبة",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error assigning vehicle type:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء ربط السائق بنوع المركبة",
        variant: "destructive"
      })
    } finally {
      setAssigning(false)
    }
  }

  const removeVehicleType = async (driverId: string, vehicleTypeId: string) => {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/vehicle-types`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleTypeId })
      })

      if (response.ok) {
        toast({
          title: "نجح",
          description: "تم إلغاء ربط السائق بنوع المركبة"
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "خطأ",
          description: error.error || "فشل في إلغاء الربط",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error removing vehicle type:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء الربط",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة أنواع المركبات للسائقين</h1>
          <p className="text-muted-foreground">ربط السائقين بأنواع المركبات التي يمكنهم قيادتها</p>
        </div>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            ربط سائق بنوع مركبة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">السائق</label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر السائق" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name || 'اسم غير متوفر'} - {driver.carPlateNumber || 'رقم لوحة غير متوفر'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">نوع المركبة</label>
              <Select value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المركبة" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vehicleType) => (
                    <SelectItem key={vehicleType.id} value={vehicleType.id}>
                      {vehicleType.nameAr || vehicleType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={assignVehicleType} 
                disabled={assigning || !selectedDriver || !selectedVehicleType}
                className="w-full"
              >
                {assigning ? "جاري الربط..." : "ربط"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {driver.name || 'اسم غير متوفر'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {driver.carPlateNumber} • {driver.nationality}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    أنواع المركبات المخولة
                  </h4>
                  {driver.vehicleTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {driver.vehicleTypes.map((vt) => (
                        <Badge key={vt.id} variant="secondary" className="flex items-center gap-1">
                          {vt.vehicleType.nameAr || vt.vehicleType.name}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeVehicleType(driver.id, vt.vehicleType.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">لا توجد أنواع مركبات مخولة</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
