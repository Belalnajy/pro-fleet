"use client"

import { useEffect, useState, use } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Edit, Trash2, Thermometer } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"

interface TemperatureSetting {
  id: string
  option: 'PLUS_2' | 'PLUS_10' | 'MINUS_18' | 'AMBIENT' | 'CUSTOM'
  value: number
  unit: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function TemperaturesManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage() 

  const [temperatures, setTemperatures] = useState<TemperatureSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemp, setEditingTemp] = useState<TemperatureSetting | null>(null)
  const [formData, setFormData] = useState<{
    option: 'PLUS_2' | 'PLUS_10' | 'MINUS_18' | 'AMBIENT' | 'CUSTOM'
    value: number
    unit: string
    isActive: boolean
  }>({
    option: "AMBIENT",
    value: 0,
    unit: "°C",
    isActive: true,
  })

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
      setError(null)
      const res = await fetch("/api/admin/temperatures")
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to fetch temperatures")
      setTemperatures(json)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
      toast.error("فشل تحميل إعدادات درجات الحرارة", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingTemp(null)
    setFormData({ 
      option: "AMBIENT",
      value: 0,
      unit: "°C",
      isActive: true 
    })
    setError(null)
  }

  const handleOpenDialog = (temp: TemperatureSetting | null) => {
    if (temp) {
      setEditingTemp(temp)
      setFormData({
        option: temp.option,
        value: temp.value,
        unit: temp.unit,
        isActive: temp.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      const payload = {
        option: formData.option,
        value: formData.value,
        unit: formData.unit.trim(),
        isActive: formData.isActive,
      }

      if (!payload.option || payload.value === undefined) {
        setError("النوع والقيمة مطلوبة")
        return
      }

      const method = editingTemp ? "PUT" : "POST"
      const url = editingTemp ? `/api/admin/temperatures/${editingTemp.id}` : "/api/admin/temperatures"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemp ? { id: editingTemp.id, ...payload } : payload),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Operation failed")

      toast.success(editingTemp ? "تم تحديث إعداد درجة الحرارة" : "تم إنشاء إعداد درجة الحرارة")
      setIsDialogOpen(false)
      resetForm()
      await fetchData()
    } catch (err: any) {
      setError(err.message)
      toast.error("فشل في العملية", { description: err.message })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف إعداد درجة الحرارة هذا؟")) return

    try {
      const res = await fetch(`/api/admin/temperatures/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Failed to delete")

      toast.success("تم حذف إعداد درجة الحرارة")
      await fetchData()
    } catch (err: any) {
      toast.error("فشل في الحذف", { description: err.message })
    }
  }

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Thermometer className="h-8 w-8 mr-3" />
              إدارة درجات الحرارة
            </h1>
            <p className="text-muted-foreground">إدارة إعدادات درجات الحرارة للمركبات</p>
          </div>
          <Button onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            إضافة إعداد جديد
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>إعدادات درجات الحرارة</CardTitle>
            <CardDescription>
              جميع إعدادات درجات الحرارة المتاحة في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {temperatures.length > 0 ? (
                  temperatures.map((temp) => (
                    <TableRow key={temp.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{temp.option}</Badge>
                      </TableCell>
                      <TableCell>{temp.value}</TableCell>
                      <TableCell>{temp.unit}</TableCell>
                      <TableCell>
                        <Badge variant={temp.isActive ? "default" : "secondary"}>
                          {temp.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(temp)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(temp.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      لا توجد إعدادات درجات حرارة.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingTemp ? "تعديل إعداد درجة الحرارة" : "إضافة إعداد درجة حرارة"}</DialogTitle>
              <DialogDescription>
                {editingTemp ? "قم بتحديث بيانات إعداد درجة الحرارة" : "أضف إعداد درجة حرارة جديد للنظام"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="option" className="text-right">النوع</Label>
                <Select 
                  value={formData.option} 
                  onValueChange={(value: any) => setFormData((p) => ({ ...p, option: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMBIENT">درجة حرارة الجو</SelectItem>
                    <SelectItem value="PLUS_2">+2°C</SelectItem>
                    <SelectItem value="PLUS_10">+10°C</SelectItem>
                    <SelectItem value="MINUS_18">-18°C</SelectItem>
                    <SelectItem value="CUSTOM">مخصصة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">القيمة</Label>
                <Input 
                  id="value" 
                  type="number"
                  step="0.1"
                  value={formData.value} 
                  onChange={(e) => setFormData((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))} 
                  className="col-span-3" 
                  placeholder="25"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">الوحدة</Label>
                <Input 
                  id="unit" 
                  value={formData.unit} 
                  onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))} 
                  className="col-span-3" 
                  placeholder="°C"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSubmit}>{editingTemp ? "تحديث" : "إنشاء"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
