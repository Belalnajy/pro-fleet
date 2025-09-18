"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { useLanguage } from "@/components/providers/language-provider"
import { PlusCircle, Edit, Trash2, Search, Building2 } from "lucide-react"

interface City {
  id: string
  name: string
  nameAr?: string | null
  country: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CitiesManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()

  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    country: "Saudi Arabia",
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
      const res = await fetch("/api/admin/cities")
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to fetch cities")
      setCities(json)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      toast.error("فشل تحميل المدن", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const filteredCities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return cities
    return cities.filter((c) =>
      [c.name, c.nameAr || "", c.country].some((v) => v?.toLowerCase().includes(term))
    )
  }, [cities, searchTerm])

  const resetForm = () => {
    setEditingCity(null)
    setFormData({ name: "", nameAr: "", country: "Saudi Arabia", isActive: true })
    setError(null)
  }

  const handleOpenDialog = (city: City | null) => {
    if (city) {
      setEditingCity(city)
      setFormData({
        name: city.name,
        nameAr: city.nameAr || "",
        country: city.country,
        isActive: city.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      const payload = {
        name: formData.name.trim(),
        nameAr: formData.nameAr.trim() || null,
        country: formData.country.trim(),
        isActive: formData.isActive,
      }
      if (!payload.name || !payload.country) {
        setError("الاسم والدولة مطلوبان")
        return
      }

      if (editingCity) {
        const res = await fetch("/api/admin/cities", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCity.id, ...payload }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "فشل تحديث المدينة")
        toast.success("تم تحديث المدينة بنجاح")
      } else {
        const res = await fetch("/api/admin/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || "فشل إنشاء المدينة")
        toast.success("تم إضافة المدينة بنجاح")
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
      const res = await fetch("/api/admin/cities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || "فشل حذف المدينة")
      toast.success("تم حذف المدينة")
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
            <Building2 className="h-6 w-6" />
            إدارة المدن
          </h1>
          <p className="text-muted-foreground">إضافة وتعديل وحذف المدن المستخدمة في التسعير والرحلات</p>
        </div>
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="h-4 w-4 mr-2" /> إضافة مدينة
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المدن</CardTitle>
          <CardDescription>البحث وإدارة المدن</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم العربي أو الإنجليزي أو الدولة"
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
                  <TableHead>الدولة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>{city.nameAr || "-"}</TableCell>
                      <TableCell>{city.country}</TableCell>
                      <TableCell>
                        <Badge variant={city.isActive ? "default" : "secondary"}>
                          {city.isActive ? "نشطة" : "غير نشطة"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(city)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(city.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingCity ? "تعديل مدينة" : "إضافة مدينة"}</DialogTitle>
            <DialogDescription>
              {editingCity ? "قم بتحديث بيانات المدينة" : "أضف مدينة جديدة للنظام"}
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
              <Label htmlFor="country" className="text-right">الدولة</Label>
              <Input id="country" value={formData.country} onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">الحالة</Label>
              <Select value={formData.isActive ? "active" : "inactive"} onValueChange={(v) => setFormData((p) => ({ ...p, isActive: v === "active" }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="inactive">غير نشطة</SelectItem>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit}>{editingCity ? "تحديث" : "إنشاء"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
