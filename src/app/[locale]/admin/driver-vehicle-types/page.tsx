"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Truck, User, Plus, Trash2, Search, Phone, Mail, MapPin, CheckCircle, XCircle, Filter, AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Driver {
  id: string
  name: string
  email?: string
  phone?: string
  carPlateNumber: string
  nationality: string
  isAvailable?: boolean
  user?: {
    name: string
    email?: string
    phone?: string
  }
  vehicleTypes: {
    id: string
    vehicleType: {
      id: string
      name: string
      nameAr: string
      capacity?: number
      description?: string
      refrigerated?: boolean
      defaultTemperature?: number
    }
  }[]
}

interface VehicleType {
  id: string
  name: string
  nameAr: string
  capacity?: number
  description?: string
  refrigerated?: boolean
  defaultTemperature?: number
}

export default function DriverVehicleTypesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterByVehicleType, setFilterByVehicleType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"cards" | "table">("table")
  const [deleteConfirm, setDeleteConfirm] = useState<{
    driverId: string
    vehicleTypeId: string
    driverName: string
    vehicleTypeName: string
  } | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`)
      return
    }
    fetchData()
  }, [session, status, router, locale])

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
                return { 
                  ...driver, 
                  vehicleTypes: vehicleTypesData.vehicleTypes || [],
                  name: driver.user?.name || driver.name || 'اسم غير متوفر',
                  email: driver.user?.email || driver.email,
                  phone: driver.user?.phone || driver.phone
                }
              }
            } catch (error) {
              console.error(`Error fetching vehicle types for driver ${driver.id}:`, error)
            }
            return { 
              ...driver, 
              vehicleTypes: [],
              name: driver.user?.name || driver.name || 'اسم غير متوفر',
              email: driver.user?.email || driver.email,
              phone: driver.user?.phone || driver.phone
            }
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

  const handleRemoveClick = (driverId: string, vehicleTypeId: string, driverName: string, vehicleTypeName: string) => {
    setDeleteConfirm({
      driverId,
      vehicleTypeId,
      driverName,
      vehicleTypeName
    })
  }

  const removeVehicleType = async () => {
    if (!deleteConfirm) return

    try {
      const response = await fetch(`/api/admin/drivers/${deleteConfirm.driverId}/vehicle-types`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleTypeId: deleteConfirm.vehicleTypeId })
      })

      if (response.ok) {
        toast({
          title: "نجح",
          description: `تم إلغاء ربط ${deleteConfirm.driverName} بنوع المركبة ${deleteConfirm.vehicleTypeName} بنجاح`
        })
        fetchData()
      } else {
        const error = await response.json()
        toast({
          title: "خطأ",
          description: error.error || "فشل في إلغاء ربط السائق بنوع المركبة",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error removing vehicle type:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء ربط السائق بنوع المركبة",
        variant: "destructive"
      })
    } finally {
      setDeleteConfirm(null)
    }
  }

  // Filter drivers based on search term and vehicle type filter
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = searchTerm === "" || 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.carPlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.phone && driver.phone.includes(searchTerm))

    const matchesVehicleType = filterByVehicleType === "" || filterByVehicleType === "all" ||
      driver.vehicleTypes.some(vt => vt.vehicleType.id === filterByVehicleType)

    return matchesSearch && matchesVehicleType
  })

  const getDriverStats = () => {
    const totalDrivers = drivers.length
    const driversWithVehicleTypes = drivers.filter(d => d.vehicleTypes.length > 0).length
    const driversWithoutVehicleTypes = totalDrivers - driversWithVehicleTypes
    const availableDrivers = drivers.filter(d => d.isAvailable).length

    return {
      totalDrivers,
      driversWithVehicleTypes,
      driversWithoutVehicleTypes,
      availableDrivers
    }
  }

  const stats = getDriverStats()

  if (loading) {
    return (
      <DashboardLayout title="إدارة أنواع المركبات للسائقين" subtitle="ربط السائقين بأنواع المركبات التي يمكنهم قيادتها">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">جاري تحميل البيانات...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title="إدارة أنواع المركبات للسائقين" 
      subtitle="ربط السائقين بأنواع المركبات التي يمكنهم قيادتها"
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">إجمالي السائقين</p>
                  <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">لديهم مركبات مخولة</p>
                  <p className="text-2xl font-bold">{stats.driversWithVehicleTypes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">بدون مركبات مخولة</p>
                  <p className="text-2xl font-bold">{stats.driversWithoutVehicleTypes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">السائقين المتاحين</p>
                  <p className="text-2xl font-bold">{stats.availableDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                        {driver.name} - {driver.carPlateNumber}
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
                        {vehicleType.capacity && ` - ${vehicleType.capacity} طن`}
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

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="البحث بالاسم، رقم اللوحة، الجنسية، البريد الإلكتروني، أو الهاتف..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Select value={filterByVehicleType} onValueChange={setFilterByVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="تصفية حسب نوع المركبة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع أنواع المركبات</SelectItem>
                    {vehicleTypes.map((vehicleType) => (
                      <SelectItem key={vehicleType.id} value={vehicleType.id}>
                        {vehicleType.nameAr || vehicleType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  جدول
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  بطاقات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {viewMode === "table" ? (
          <Card>
            <CardHeader>
              <CardTitle>قائمة السائقين ({filteredDrivers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>السائق</TableHead>
                      <TableHead>معلومات الاتصال</TableHead>
                      <TableHead>رقم اللوحة</TableHead>
                      <TableHead>الجنسية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>أنواع المركبات المخولة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{driver.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {driver.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {driver.email}
                              </div>
                            )}
                            {driver.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {driver.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{driver.carPlateNumber}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {driver.nationality}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.isAvailable ? "default" : "secondary"}>
                            {driver.isAvailable ? "متاح" : "غير متاح"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {driver.vehicleTypes.length > 0 ? (
                              driver.vehicleTypes.map((vt) => (
                                <Badge key={vt.id} variant="secondary" className="text-xs">
                                  {vt.vehicleType.nameAr || vt.vehicleType.name}
                                  {vt.vehicleType.capacity && ` (${vt.vehicleType.capacity}ط)`}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">لا توجد</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {driver.vehicleTypes.map((vt) => (
                              <Button
                                key={vt.id}
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveClick(driver.id, vt.vehicleType.id, driver.name, vt.vehicleType.nameAr || vt.vehicleType.name)}
                                title={`إزالة ${vt.vehicleType.nameAr || vt.vehicleType.name}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {driver.name}
                  </CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {driver.carPlateNumber} • {driver.nationality}
                    </p>
                    {driver.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {driver.email}
                      </p>
                    )}
                    {driver.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {driver.phone}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">الحالة:</span>
                      <Badge variant={driver.isAvailable ? "default" : "secondary"}>
                        {driver.isAvailable ? "متاح" : "غير متاح"}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        أنواع المركبات المخولة ({driver.vehicleTypes.length})
                      </h4>
                      {driver.vehicleTypes.length > 0 ? (
                        <div className="space-y-2">
                          {driver.vehicleTypes.map((vt) => (
                            <div key={vt.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <div>
                                <p className="text-sm font-medium">
                                  {vt.vehicleType.nameAr || vt.vehicleType.name}
                                </p>
                                {vt.vehicleType.capacity && (
                                  <p className="text-xs text-muted-foreground">
                                    السعة: {vt.vehicleType.capacity} طن
                                  </p>
                                )}
                                {vt.vehicleType.refrigerated && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    مبرد
                                  </Badge>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveClick(driver.id, vt.vehicleType.id, driver.name, vt.vehicleType.nameAr || vt.vehicleType.name)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg text-center">
                          لا توجد أنواع مركبات مخولة
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredDrivers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">
                لم يتم العثور على سائقين يطابقون معايير البحث والتصفية المحددة
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد إزالة نوع المركبة
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إزالة نوع المركبة <strong>{deleteConfirm?.vehicleTypeName}</strong> من السائق <strong>{deleteConfirm?.driverName}</strong>؟
              <br />
              <span className="text-destructive font-medium">لا يمكن التراجع عن هذا الإجراء.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeVehicleType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              إزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
