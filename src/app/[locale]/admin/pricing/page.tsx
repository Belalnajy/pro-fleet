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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/components/providers/language-provider"
import { useTranslation } from "@/hooks/useTranslation"
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  MapPin,
  Truck,
  Activity,
  TrendingUp,
  Search,
} from "lucide-react"

interface City {
  id: string
  name: string
  nameAr?: string
  country: string
  isActive: boolean
}

interface Vehicle {
  id: string
  type: string
  capacity: string
  description?: string
  isActive: boolean
}

interface Pricing {
  id: string
  fromCityId: string
  toCityId: string
  vehicleId: string
  quantity: number
  price: number
  currency: string
  createdAt: string
  fromCity: City
  toCity: City
  vehicle: Vehicle
}

export default function PricingManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const { t: translate } = useTranslation()
  const [pricing, setPricing] = useState<Pricing[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null)
  const [deletePricing, setDeletePricing] = useState<Pricing | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fromCityId: "",
    toCityId: "",
    vehicleId: "",
    quantity: 1,
    price: "",
    currency: "SAR",
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
      const [pricingRes, citiesRes, vehiclesRes] = await Promise.all([
        fetch("/api/admin/pricing"),
        fetch("/api/admin/cities"),
        fetch("/api/admin/vehicles"),
      ])

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json()
        setPricing(pricingData)
      }

      if (citiesRes.ok) {
        const citiesData = await citiesRes.json()
        setCities(citiesData)
      }

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json()
        setVehicles(vehiclesData)
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/imports/pricing", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || `Import failed with status: ${res.status}`);
      }

      await fetchData();
      toast.success("Import Successful", {
        description: `Successfully imported ${json.count} pricing records.`,
      });

    } catch (err: any) {
      setError(err?.message);
      toast.error("Import Failed", {
        description: err.message || "An unknown error occurred.",
      });
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const handleExportClick = () => {
    const headers = ["from_city","to_city","vehicle_type","quantity","price","currency"]
    const rows = pricing.map(p => [
      p.fromCity.name,
      p.toCity.name,
      p.vehicle.vehicleType?.name || p.vehicle.vehicleTypeId,
      String(p.quantity),
      String(p.price),
      p.currency,
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pricing-export.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDeleteClick = (pricing: Pricing) => {
    setDeletePricing(pricing);
  };

  const handleDelete = async (pricing: Pricing) => {
    try {
      const response = await fetch(`/api/admin/pricing`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pricing.id }),
      });

      if (response.ok) {
        toast.success("Pricing deleted successfully");
        await fetchData();
        setDeletePricing(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete pricing");
      }
    } catch (err: any) {
      toast.error("Deletion Failed", {
        description: err.message,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingPricing ? "/api/admin/pricing" : "/api/admin/pricing"
      const method = editingPricing ? "PUT" : "POST"
      
      const body = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: formData.quantity,
        ...(editingPricing && { id: editingPricing.id }),
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        await fetchData()
        setIsAddDialogOpen(false)
        setEditingPricing(null)
        resetForm()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Operation failed")
      }
    } catch (error) {
      setError("Network error")
    }
  }

  const resetForm = () => {
    setFormData({
      fromCityId: "",
      toCityId: "",
      vehicleId: "",
      quantity: 1,
      price: "",
      currency: "SAR",
    })
  }

  const handleEdit = (pricingItem: Pricing) => {
    setEditingPricing(pricingItem)
    setFormData({
      fromCityId: pricingItem.fromCityId,
      toCityId: pricingItem.toCityId,
      vehicleId: pricingItem.vehicleId,
      quantity: pricingItem.quantity,
      price: pricingItem.price.toString(),
      currency: pricingItem.currency,
    })
    setIsAddDialogOpen(true)
  }

  const filteredPricing = pricing.filter(item =>
    item.fromCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.toCity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.vehicle.vehicleType?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicle.capacity.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      title={translate('pricingManagement')}
      subtitle={translate('manageCostsPricing')}
      actions={
        <div className="flex space-x-1 ">
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFileChange} />
          <Button className="w-auto" variant="outline" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            {translate('importExcelButton')}
          </Button>
          <Button variant="outline" onClick={handleExportClick}>
            <Download className="h-4 w-4 mr-2" />
            {translate('exportExcelButton')}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setEditingPricing(null)
              resetForm()
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {translate('addPricingButton')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPricing ? translate('editPricingDialog') : translate('addNewPricingDialog')}
                </DialogTitle>
                <DialogDescription>
                  {editingPricing ? translate('updatePricingInfo') : translate('addNewRoutePricing')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fromCity" className="text-right">
                    {translate('from')}
                  </Label>
                  <Select
                    value={formData.fromCityId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, fromCityId: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={translate('selectOriginCity')} />
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="toCity" className="text-right">
                    {translate('to')}
                  </Label>
                  <Select
                    value={formData.toCityId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, toCityId: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={translate('selectDestinationCity')} />
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehicle" className="text-right">
                    {translate('vehicle')}
                  </Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={translate('selectVehicleType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.capacity} - {(vehicle.vehicleType?.name || vehicle.vehicleTypeId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">
                    {translate('quantity')}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    {translate('price')}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    {translate('currency')}
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {error && (
                <Alert>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {translate('cancel')}
                </Button>
                <Button onClick={handleSubmit}>
                  {editingPricing ? translate('update') : translate('create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate('totalRoutes')}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pricing.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate('cities')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate('vehicles')}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{translate('avgPrice')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pricing.length > 0 
                ? `${t("currency")} ${Math.round(pricing.reduce((sum, item) => sum + item.price, 0) / pricing.length)}`
                : `${t("currency")} 0`
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{translate('searchAndFilter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={translate('searchRoutesPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>{translate('routePricing')}</CardTitle>
          <CardDescription>
            {translate('managePricingForRoutes')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('route')}</TableHead>
                  <TableHead>{translate('vehicle')}</TableHead>
                  <TableHead>{translate('quantity')}</TableHead>
                  <TableHead>{translate('price')}</TableHead>
                  <TableHead>{translate('currency')}</TableHead>
                  <TableHead>{translate('created')}</TableHead>
                  <TableHead className="text-right">{translate('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPricing.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {item.fromCity.name} → {item.toCity.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {item.vehicle.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.quantity} {item.quantity === 1 ? translate('trip') : translate('trips')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {t("currency")} {item.price.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.currency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePricing} onOpenChange={(open) => {
        if (!open) setDeletePricing(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete pricing from <strong>{deletePricing?.fromCity?.name}</strong> to <strong>{deletePricing?.toCity?.name}</strong> for vehicle <strong>{deletePricing?.vehicle?.capacity}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePricing(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletePricing && handleDelete(deletePricing)}
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