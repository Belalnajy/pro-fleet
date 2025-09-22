"use client"

import { useState, useEffect, useRef, use } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/components/providers/language-provider"
import * as XLSX from 'xlsx'
import {
  Truck,
  Edit,
  Upload,
  Download,
  Settings,
  Activity,
  Search,
  PlusCircle,
  Trash2,
  Package,
  Thermometer,
  Plus,
} from "lucide-react"
// Vehicle types are now dynamic via VehicleTypeModel

interface VehicleTypeModelRef {
  id: string
  name: string
  nameAr?: string | null
}

interface VehicleTypeModel {
  id: string
  name: string
  nameAr?: string | null
  capacity?: string | null
  description?: string | null
  isRefrigerated: boolean
  defaultTemperatureId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TemperatureSetting {
  id: string
  option: string
  value: number
  unit: string
  isActive: boolean
}

interface Vehicle {
  id: string
  vehicleTypeId: string
  vehicleNumber?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  vehicleType?: VehicleTypeModelRef
}

export default function VehiclesManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  // Tab management
  const [activeTab, setActiveTab] = useState("vehicles")
  
  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeModelRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  
  // Vehicle Types state
  const [fullVehicleTypes, setFullVehicleTypes] = useState<VehicleTypeModel[]>([])
  const [temperatures, setTemperatures] = useState<TemperatureSetting[]>([])
  const [vehicleTypesLoading, setVehicleTypesLoading] = useState(false)
  const [isVehicleTypeDialogOpen, setIsVehicleTypeDialogOpen] = useState(false)
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleTypeModel | null>(null)
  const [vehicleTypeForm, setVehicleTypeForm] = useState({
    name: "",
    nameAr: "",
    capacity: "",
    description: "",
    isRefrigerated: false,
    defaultTemperatureId: "",
    isActive: true,
  })

  const [formData, setFormData] = useState({
    vehicleTypeId: "",
    vehicleNumber: "",
    isActive: true,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`)
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [vehiclesRes, typesRes] = await Promise.all([
        fetch("/api/admin/vehicles"),
        fetch("/api/admin/vehicle-types"),
      ])
      if (!vehiclesRes.ok) {
        const err = await vehiclesRes.json()
        throw new Error(err?.error || "Failed to fetch vehicles")
      }
      if (!typesRes.ok) {
        const err = await typesRes.json()
        throw new Error(err?.error || "Failed to fetch vehicle types")
      }
      const vehiclesData = await vehiclesRes.json()
      const typesData = await typesRes.json()
      setVehicles(vehiclesData)
      setVehicleTypes(typesData)
    } catch (error) {
      setError("An unexpected network error occurred.")
      toast.error("Network Error", { description: "Failed to connect to the server." })
    } finally {
      setLoading(false)
    }
  }

  // Vehicle Types Functions
  const fetchFullVehicleTypes = async () => {
    try {
      setVehicleTypesLoading(true)
      const response = await fetch("/api/admin/vehicle-types")
      if (response.ok) {
        const data = await response.json()
        setFullVehicleTypes(data)
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error)
      toast.error("Failed to fetch vehicle types")
    } finally {
      setVehicleTypesLoading(false)
    }
  }

  const fetchTemperatures = async () => {
    try {
      const response = await fetch("/api/admin/temperatures")
      if (response.ok) {
        const data = await response.json()
        setTemperatures(data)
      }
    } catch (error) {
      console.error("Error fetching temperatures:", error)
    }
  }

  const handleAddVehicleType = () => {
    setEditingVehicleType(null)
    setVehicleTypeForm({
      name: "",
      nameAr: "",
      capacity: "",
      description: "",
      isRefrigerated: false,
      defaultTemperatureId: "",
      isActive: true,
    })
    setIsVehicleTypeDialogOpen(true)
  }

  const handleEditVehicleType = (vehicleType: VehicleTypeModel) => {
    setEditingVehicleType(vehicleType)
    setVehicleTypeForm({
      name: vehicleType.name,
      nameAr: vehicleType.nameAr || "",
      capacity: vehicleType.capacity || "",
      description: vehicleType.description || "",
      isRefrigerated: vehicleType.isRefrigerated,
      defaultTemperatureId: vehicleType.defaultTemperatureId || "",
      isActive: vehicleType.isActive,
    })
    setIsVehicleTypeDialogOpen(true)
  }

  const handleSaveVehicleType = async () => {
    try {
      const method = editingVehicleType ? "PATCH" : "POST"
      const url = "/api/admin/vehicle-types"
      
      const body = editingVehicleType 
        ? { ...vehicleTypeForm, id: editingVehicleType.id }
        : vehicleTypeForm

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingVehicleType ? t("vehicleTypeUpdated") : t("vehicleTypeCreated"))
        setIsVehicleTypeDialogOpen(false)
        setEditingVehicleType(null)
        setVehicleTypeForm({
          name: "",
          nameAr: "",
          capacity: "",
          description: "",
          isRefrigerated: false,
          defaultTemperatureId: "",
          isActive: true,
        })
        fetchFullVehicleTypes()
        fetchData() // Refresh vehicles list too
      } else {
        toast.error("Failed to save vehicle type")
      }
    } catch (error) {
      console.error("Error saving vehicle type:", error)
      toast.error("Failed to save vehicle type")
    }
  }

  const handleDeleteVehicleType = async (id: string) => {
    if (!confirm(t("confirmDeleteVehicleType"))) return

    try {
      const response = await fetch("/api/admin/vehicle-types", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        toast.success(t("vehicleTypeDeleted"))
        fetchFullVehicleTypes()
        fetchData() // Refresh vehicles list too
      } else {
        toast.error("Failed to delete vehicle type")
      }
    } catch (error) {
      console.error("Error deleting vehicle type:", error)
      toast.error("Failed to delete vehicle type")
    }
  }

  // Load vehicle types data when switching to vehicle types tab
  useEffect(() => {
    if (activeTab === "vehicle-types" && fullVehicleTypes.length === 0) {
      fetchFullVehicleTypes()
      fetchTemperatures()
    }
  }, [activeTab])

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append("file", file)

    try {
      const res = await fetch("/api/imports/vehicles", { method: "POST", body: form })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || `Import failed with status: ${res.status}`)
      }

      await fetchData()
      toast.success("Import Successful", {
        description: `Successfully imported ${json.count} vehicle records.`,
      })
    } catch (err: any) {
      toast.error("Import Failed", {
        description: err.message || "An unknown error occurred.",
      })
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = ""
      }
    }
  }

  const handleExportClick = () => {
    if (filteredVehicles.length === 0) {
      toast.info("لا توجد بيانات", { description: "لا توجد بيانات للتصدير." });
      return;
    }
    
    const headers = ["نوع المركبة", "رقم المركبة", "نشط"];
    const rows = filteredVehicles.map(v => [
      v.vehicleType?.name || v.vehicleTypeId,
      v.vehicleNumber || "",
      v.isActive ? "نعم" : "لا",
    ]);
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // نوع المركبة
      { wch: 15 }, // رقم المركبة
      { wch: 10 }  // نشط
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "المركبات");
    
    // Generate and download file
    XLSX.writeFile(workbook, `vehicles-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("تم التصدير بنجاح", { description: "تم تصدير المركبات إلى ملف Excel" });
  };

  const resetForm = () => {
    setFormData({
      vehicleTypeId: "",
      vehicleNumber: "",
      isActive: true,
    })
    setError(null)
  }

  const handleOpenDialog = (vehicle: Vehicle | null) => {
    setEditingVehicle(vehicle)
    if (vehicle) {
      setFormData({
        vehicleTypeId: vehicle.vehicleTypeId,
        vehicleNumber: vehicle.vehicleNumber || "",
        isActive: vehicle.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingVehicle(null)
    resetForm()
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      const url = "/api/admin/vehicles"
      const method = editingVehicle ? "PUT" : "POST"
      const body = {
        ...formData,
        ...(editingVehicle && { id: editingVehicle.id }),
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        await fetchData()
        handleCloseDialog()
        toast.success(`Vehicle ${editingVehicle ? "updated" : "created"} successfully`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Operation failed")
      }
    } catch (error) {
      setError("An unexpected network error occurred.")
    }
  }

  const handleDeleteClick = (vehicle: Vehicle) => {
    setDeleteVehicle(vehicle);
  };

  const handleDelete = async (vehicle: Vehicle) => {
    try {
      const response = await fetch(`/api/admin/vehicles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vehicle.id }),
      });

      if (response.ok) {
        toast.success("Vehicle deleted successfully");
        await fetchData();
        setDeleteVehicle(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete vehicle");
      }
    } catch (err: any) {
      toast.error("Deletion Failed", {
        description: err.message,
      });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    Object.values(vehicle).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // Filter vehicle types based on search term
  const filteredVehicleTypes = fullVehicleTypes.filter(vehicleType =>
    vehicleType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicleType.nameAr && vehicleType.nameAr.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getVehicleTypeLabel = (v: Vehicle) => {
    if (locale === 'ar') {
      return v.vehicleType?.nameAr || v.vehicleType?.name || t("unknownType")
    } else {
      return v.vehicleType?.name || v.vehicleType?.nameAr || t("unknownType")
    }
  }

  const getVehicleTypeIcon = () => {
    return <Truck className="h-5 w-5 text-muted-foreground" />
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <DashboardLayout
      title={t("vehicleManagement")}
      subtitle={t("vehicleManagementDesc")}
      actions={
        <div className="flex items-center gap-2">
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFileChange} />
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            {t("import")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportClick}>
            <Download className="h-4 w-4 mr-2" />
            {t("export")}
          </Button>
          {activeTab === "vehicles" ? (
            <Button size="sm" onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t("addVehicle")}
            </Button>
          ) : (
            <Button size="sm" onClick={handleAddVehicleType}>
              <Plus className="h-4 w-4 mr-2" />
              {t("addVehicleType")}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalVehicles")}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeFleet")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("vehicleType")}</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{[...new Set(vehicles.map(v => v.vehicleTypeId))].length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicles">{t("manageVehicles")}</TabsTrigger>
          <TabsTrigger value="vehicle-types">{t("vehicleTypes")}</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("fleet")}</CardTitle>
                  <CardDescription>{t("fleetDesc")}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("searchVehicles")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">{t("loading")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("vehicleType")}</TableHead>
                  <TableHead>{t("vehicleNumber")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("created")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getVehicleTypeIcon()}
                          <span className="font-medium">{getVehicleTypeLabel(vehicle)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.vehicleNumber || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                          {vehicle.isActive ? t("active") : t("inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(vehicle.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(vehicle)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vehicle)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      {t("noVehiclesFound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicle-types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("vehicleTypes")}</CardTitle>
                  <CardDescription>{t("manageVehicleTypesAvailable")}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("searchVehicles")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:w-[300px]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {vehicleTypesLoading ? (
                <div className="text-center py-10">{t("loading")}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("nameAr")}</TableHead>
                      <TableHead>{t("capacity")}</TableHead>
                      <TableHead>{t("refrigerated")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicleTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? t("noVehicleTypesFound") : t("noVehicleTypesFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicleTypes.map((vehicleType) => (
                        <TableRow key={vehicleType.id}>
                          <TableCell className="font-medium">{vehicleType.name}</TableCell>
                          <TableCell>{vehicleType.nameAr || "-"}</TableCell>
                          <TableCell>{vehicleType.capacity || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {vehicleType.isRefrigerated ? (
                                <>
                                  <Thermometer className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm text-blue-600">{t("yes")}</span>
                                </>
                              ) : (
                                <span className="text-sm text-gray-500">{t("no")}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={vehicleType.isActive ? "default" : "secondary"}>
                              {vehicleType.isActive ? t("active") : t("inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditVehicleType(vehicleType)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVehicleType(vehicleType.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? t("editVehicle") : t("addNewVehicle")}</DialogTitle>
            <DialogDescription>{editingVehicle ? t("updateVehicleInfo") : t("addNewVehicleDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleTypeId" className="text-right">{t("vehicleType")}</Label>
              <Select value={formData.vehicleTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleTypeId: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("selectVehicleType")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.filter(vt => vt).map(vt => (
                    <SelectItem key={vt.id} value={vt.id}>{vt.nameAr || vt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleId" className="text-right">{t("vehicleNumber")}</Label>
              <Input 
                id="vehicleId" 
                placeholder={t("vehicleNumberPlaceholder")} 
                value={formData.vehicleNumber || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">{t("status")}</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === "active" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>{t("cancel")}</Button>
            <Button onClick={handleSubmit}>{editingVehicle ? t("updateVehicle") : t("createVehicle")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={(open) => {
        if (!open) setDeleteVehicle(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteVehicle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteVehicle")} <strong>{deleteVehicle?.vehicleType?.name || t("unknownType")} - {deleteVehicle?.vehicleNumber || t("notSpecified")}</strong>?
              {t("actionCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteVehicle(null)}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteVehicle && handleDelete(deleteVehicle)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Type Dialog */}
      <Dialog open={isVehicleTypeDialogOpen} onOpenChange={setIsVehicleTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingVehicleType ? t("editVehicleType") : t("addNewVehicleType")}
            </DialogTitle>
            <DialogDescription>
              {editingVehicleType ? t("updateVehicleTypeInfo") : t("addNewVehicleTypeDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  value={vehicleTypeForm.name}
                  onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, name: e.target.value })}
                  placeholder={t("name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t("nameAr")}</Label>
                <Input
                  id="nameAr"
                  value={vehicleTypeForm.nameAr}
                  onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, nameAr: e.target.value })}
                  placeholder={t("nameAr")}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">{t("capacity")}</Label>
              <Input
                id="capacity"
                value={vehicleTypeForm.capacity}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, capacity: e.target.value })}
                placeholder={t("capacity")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={vehicleTypeForm.description}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, description: e.target.value })}
                placeholder={t("description")}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRefrigerated"
                checked={vehicleTypeForm.isRefrigerated}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, isRefrigerated: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isRefrigerated">{t("refrigerated")}</Label>
            </div>
            {vehicleTypeForm.isRefrigerated && (
              <div className="space-y-2">
                <Label htmlFor="defaultTemperatureId">{t("defaultTemperature")}</Label>
                <Select
                  value={vehicleTypeForm.defaultTemperatureId}
                  onValueChange={(value) => setVehicleTypeForm({ ...vehicleTypeForm, defaultTemperatureId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectTemperature")} />
                  </SelectTrigger>
                  <SelectContent>
                    {temperatures.map((temp) => (
                      <SelectItem key={temp.id} value={temp.id}>
                        {temp.option} ({temp.value}°{temp.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={vehicleTypeForm.isActive}
                onChange={(e) => setVehicleTypeForm({ ...vehicleTypeForm, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">{t("active")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVehicleTypeDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSaveVehicleType} disabled={!vehicleTypeForm.name.trim()}>
              {editingVehicleType ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}