"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useLanguage } from "@/components/providers/language-provider"
import { PlusCircle, Edit, Trash2, Search, Settings, Thermometer, Truck } from "lucide-react"

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

interface TemperatureSetting { id: string; option: string; value: number; unit: string; isActive: boolean }

export default function VehicleTypesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  const [items, setItems] = useState<VehicleTypeModel[]>([])
  const [temps, setTemps] = useState<TemperatureSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VehicleTypeModel | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    capacity: "",
    description: "",
    isRefrigerated: false,
    defaultTemperatureId: "",
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
      const [typesRes, tempsRes] = await Promise.all([
        fetch("/api/admin/vehicle-types"),
        fetch("/api/admin/temperatures"),
      ])
      const typesJson = await typesRes.json()
      const tempsJson = await tempsRes.json()
      if (!typesRes.ok) throw new Error(typesJson?.error || "Failed to fetch vehicle types")
      if (!tempsRes.ok) throw new Error(tempsJson?.error || "Failed to fetch temperature settings")
      setItems(typesJson)
      setTemps(Array.isArray(tempsJson) ? tempsJson : [])
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      toast.error("فشل التحميل", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((c) =>
      [c.name, c.nameAr || "", c.capacity || "", c.description || ""].some((v) => v?.toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  const resetForm = () => {
    setEditing(null)
    setFormData({ name: "", nameAr: "", capacity: "", description: "", isRefrigerated: false, defaultTemperatureId: "", isActive: true })
    setError(null)
  }

  const handleOpenDialog = (it: VehicleTypeModel | null) => {
    if (it) {
      setEditing(it)
      setFormData({
        name: it.name,
        nameAr: it.nameAr || "",
        capacity: it.capacity || "",
        description: it.description || "",
        isRefrigerated: it.isRefrigerated,
        defaultTemperatureId: it.defaultTemperatureId || "",
        isActive: it.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => setIsDialogOpen(false)

  const handleSubmit = async () => {
    try {
      setError(null)
      const payload = {
        name: formData.name.trim(),
        nameAr: formData.nameAr.trim() || null,
        capacity: formData.capacity.trim() || null,
        description: formData.description.trim() || null,
        isRefrigerated: !!formData.isRefrigerated,
        defaultTemperatureId: formData.defaultTemperatureId || null,
        isActive: formData.isActive,
      }
      if (!payload.name) {
        setError("الاسم مطلوب")
        return
      }

      if (editing) {
        const res = await fetch("/api/admin/vehicle-types", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "فشل التحديث")
        toast.success("تم التحديث بنجاح")
      } else {
        const res = await fetch("/api/admin/vehicle-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "فشل الإنشاء")
        toast.success("تمت الإضافة بنجاح")
      }
      setIsDialogOpen(false)
      await fetchData()
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع")
      toast.error("خطأ", { description: err.message })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/vehicle-types", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "فشل الحذف")
      toast.success("تم الحذف")
      await fetchData()
    } catch (err: any) {
      toast.error("خطأ في الحذف", { description: err.message })
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            إدارة أنواع المركبات (ديناميكي)
          </h1>
          <p className="text-muted-foreground">إنشاء وتعديل وحذف أنواع المركبات لاستخدامها عبر النظام</p>
        </div>
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="h-4 w-4 mr-2" /> إضافة نوع
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الأنواع</CardTitle>
          <CardDescription>البحث وإدارة الأنواع</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم أو الوصف أو السعة"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم (EN)</TableHead>
                  <TableHead>الاسم (AR)</TableHead>
                  <TableHead>السعة</TableHead>
                  <TableHead>تبريد</TableHead>
                  <TableHead>الحرارة الافتراضية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell>{it.nameAr || "-"}</TableCell>
                      <TableCell>{it.capacity || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={it.isRefrigerated ? "default" : "secondary"}>
                          {it.isRefrigerated ? "نعم" : "لا"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {it.defaultTemperatureId ? (
                          temps.find((t) => t.id === it.defaultTemperatureId)?.option || "-"
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={it.isActive ? "default" : "secondary"}>
                          {it.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(it)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(it.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      لا توجد نتائج مطابقة.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل نوع" : "إضافة نوع"}</DialogTitle>
            <DialogDescription>
              {editing ? "قم بتحديث بيانات النوع" : "أضف نوع مركبة جديد"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">الاسم (EN)</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nameAr" className="text-right">الاسم (AR)</Label>
              <Input id="nameAr" value={formData.nameAr} onChange={(e) => setFormData((p) => ({ ...p, nameAr: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">السعة</Label>
              <Input id="capacity" value={formData.capacity} onChange={(e) => setFormData((p) => ({ ...p, capacity: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">الوصف</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isRefrigerated" className="text-right">تبريد</Label>
              <Select value={formData.isRefrigerated ? "yes" : "no"} onValueChange={(v) => setFormData((p) => ({ ...p, isRefrigerated: v === "yes" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">نعم</SelectItem>
                  <SelectItem value="no">لا</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultTemperatureId" className="text-right">الحرارة الافتراضية</Label>
              <Select value={formData.defaultTemperatureId} onValueChange={(v) => setFormData((p) => ({ ...p, defaultTemperatureId: v === "__none__" ? "" : v }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر حرارة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">بدون</SelectItem>
                  {temps.filter((t) => t.isActive).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.option} ({t.value}{t.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">الحالة</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(v) => setFormData((p) => ({ ...p, isActive: v === "active" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
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
            <Button variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
            <Button onClick={handleSubmit}>{editing ? "تحديث" : "إنشاء"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
