"use client"

import { useState, useEffect, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/components/providers/language-provider"
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
} from "lucide-react"
// Vehicle types are now dynamic via VehicleTypeModel

interface VehicleTypeModelRef {
  id: string
  name: string
  nameAr?: string | null
}

interface Vehicle {
  id: string
  vehicleTypeId: string
  capacity: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  vehicleType?: VehicleTypeModelRef
}

export default function VehiclesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeModelRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    vehicleTypeId: "",
    capacity: "",
    description: "",
    isActive: true,
  })

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
      toast.info("No Data", { description: "There is no data to export." });
      return;
    }
    const headers = ["vehicleType", "capacity", "description", "isActive"];
    const rows = filteredVehicles.map(v => [
      v.vehicleType?.name || v.vehicleTypeId,
      v.capacity,
      v.description || "",
      String(v.isActive),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export Successful");
  };

  const resetForm = () => {
    setFormData({
      vehicleTypeId: "",
      capacity: "",
      description: "",
      isActive: true,
    })
    setError(null)
  }

  const handleOpenDialog = (vehicle: Vehicle | null) => {
    setEditingVehicle(vehicle)
    if (vehicle) {
      setFormData({
        vehicleTypeId: vehicle.vehicleTypeId,
        capacity: vehicle.capacity,
        description: vehicle.description || "",
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

  const getVehicleTypeLabel = (v: Vehicle) => {
    return v.vehicleType?.nameAr || v.vehicleType?.name || "Unknown"
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
      title="Vehicle Management"
      subtitle="Manage your fleet vehicles and their types."
      actions={
        <div className="flex items-center gap-2">
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFileChange} />
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportClick}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fleet</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicle Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{[...new Set(vehicles.map(v => v.vehicleTypeId))].length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fleet</CardTitle>
              <CardDescription>A list of all vehicles in the system.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>{vehicle.capacity}</TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                          {vehicle.isActive ? "Active" : "Inactive"}
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
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
            <DialogDescription>{editingVehicle ? "Update vehicle information." : "Add a new vehicle to the fleet."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicleTypeId" className="text-right">Type</Label>
              <Select value={formData.vehicleTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleTypeId: value }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.filter(vt => vt).map(vt => (
                    <SelectItem key={vt.id} value={vt.id}>{vt.nameAr || vt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">Capacity</Label>
              <Input id="capacity" placeholder="e.g., 10 Ton, 40 ft" value={formData.capacity} onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" placeholder="(Optional) Vehicle description..." value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Status</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === "active" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingVehicle ? "Update Vehicle" : "Create Vehicle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={(open) => {
        if (!open) setDeleteVehicle(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteVehicle?.vehicleType?.name || 'Unknown Type'} - {deleteVehicle?.capacity}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteVehicle(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteVehicle && handleDelete(deleteVehicle)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}