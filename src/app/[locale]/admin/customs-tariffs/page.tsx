"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PageLoading } from "@/components/ui/loading"
import { useLanguage } from "@/components/providers/language-provider"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
} from "lucide-react"

interface CustomsTariff {
  id: string
  hsCode: string
  description: string
  descriptionAr: string
  category: string
  dutyRate: number
  vatRate: number
  additionalFees: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function CustomsTariffsManagement({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [tariffs, setTariffs] = useState<CustomsTariff[]>([])
  const [filteredTariffs, setFilteredTariffs] = useState<CustomsTariff[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTariff, setEditingTariff] = useState<CustomsTariff | null>(null)
  const [formData, setFormData] = useState({
    hsCode: "",
    description: "",
    descriptionAr: "",
    category: "other",
    dutyRate: 0,
    vatRate: 15,
    additionalFees: 0,
    isActive: true
  })

  const categories = [
    { value: "automotive", label: language === "ar" ? "السيارات" : "Automotive" },
    { value: "electronics", label: language === "ar" ? "الإلكترونيات" : "Electronics" },
    { value: "textiles", label: language === "ar" ? "المنسوجات" : "Textiles" },
    { value: "food", label: language === "ar" ? "الأغذية" : "Food" },
    { value: "chemicals", label: language === "ar" ? "الكيماويات" : "Chemicals" },
    { value: "machinery", label: language === "ar" ? "الآلات" : "Machinery" },
    { value: "other", label: language === "ar" ? "أخرى" : "Other" }
  ]

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`)
      return
    }
    fetchTariffs()
  }, [session, status, router, locale])

  useEffect(() => {
    filterTariffs()
  }, [tariffs, searchTerm, categoryFilter])

  const fetchTariffs = async () => {
    try {
      const response = await fetch("/api/customs-broker/tariffs")
      if (response.ok) {
        const data = await response.json()
        setTariffs(data.tariffs || [])
      }
    } catch (error) {
      console.error("Error fetching tariffs:", error)
      toast.error(language === "ar" ? "خطأ في تحميل التعريفات الجمركية" : "Error loading customs tariffs")
    } finally {
      setLoading(false)
    }
  }

  const filterTariffs = () => {
    let filtered = tariffs

    if (searchTerm) {
      filtered = filtered.filter(tariff =>
        tariff.hsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tariff.descriptionAr.includes(searchTerm)
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(tariff => tariff.category === categoryFilter)
    }

    setFilteredTariffs(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingTariff 
        ? `/api/customs-broker/tariffs/${editingTariff.id}`
        : "/api/customs-broker/tariffs"
      
      const method = editingTariff ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(
          editingTariff 
            ? (language === "ar" ? "تم تحديث التعريفة الجمركية بنجاح" : "Customs tariff updated successfully")
            : (language === "ar" ? "تم إضافة التعريفة الجمركية بنجاح" : "Customs tariff added successfully")
        )
        setIsDialogOpen(false)
        resetForm()
        fetchTariffs()
      } else {
        throw new Error("Failed to save tariff")
      }
    } catch (error) {
      console.error("Error saving tariff:", error)
      toast.error(language === "ar" ? "خطأ في حفظ التعريفة الجمركية" : "Error saving customs tariff")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (tariff: CustomsTariff) => {
    setEditingTariff(tariff)
    setFormData({
      hsCode: tariff.hsCode,
      description: tariff.description,
      descriptionAr: tariff.descriptionAr,
      category: tariff.category,
      dutyRate: tariff.dutyRate,
      vatRate: tariff.vatRate,
      additionalFees: tariff.additionalFees,
      isActive: tariff.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من حذف هذه التعريفة الجمركية؟" : "Are you sure you want to delete this customs tariff?")) {
      return
    }

    try {
      const response = await fetch(`/api/customs-broker/tariffs/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success(language === "ar" ? "تم حذف التعريفة الجمركية بنجاح" : "Customs tariff deleted successfully")
        fetchTariffs()
      } else {
        throw new Error("Failed to delete tariff")
      }
    } catch (error) {
      console.error("Error deleting tariff:", error)
      toast.error(language === "ar" ? "خطأ في حذف التعريفة الجمركية" : "Error deleting customs tariff")
    }
  }

  const resetForm = () => {
    setFormData({
      hsCode: "",
      description: "",
      descriptionAr: "",
      category: "other",
      dutyRate: 0,
      vatRate: 15,
      additionalFees: 0,
      isActive: true
    })
    setEditingTariff(null)
  }

  const exportTariffs = () => {
    const csvContent = [
      ["HS Code", "Description", "Description (AR)", "Category", "Duty Rate (%)", "VAT Rate (%)", "Additional Fees", "Status"],
      ...filteredTariffs.map(tariff => [
        tariff.hsCode,
        tariff.description,
        tariff.descriptionAr,
        tariff.category,
        tariff.dutyRate.toString(),
        tariff.vatRate.toString(),
        tariff.additionalFees.toString(),
        tariff.isActive ? "Active" : "Inactive"
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "customs-tariffs.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && tariffs.length === 0) {
    return <PageLoading />
  }

  return (
    <DashboardLayout 
      title={language === "ar" ? "إدارة التعريفات الجمركية" : "Customs Tariffs Management"}
      subtitle={language === "ar" ? "إضافة وتعديل وإدارة التعريفات الجمركية والرسوم" : "Add, edit and manage customs tariffs and fees"}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={language === "ar" ? "البحث في التعريفات..." : "Search tariffs..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={language === "ar" ? "تصفية حسب الفئة" : "Filter by category"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع الفئات" : "All Categories"}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportTariffs}>
              <Download className="h-4 w-4 mr-2" />
              {language === "ar" ? "تصدير" : "Export"}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === "ar" ? "إضافة تعريفة جديدة" : "Add New Tariff"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTariff 
                      ? (language === "ar" ? "تعديل التعريفة الجمركية" : "Edit Customs Tariff")
                      : (language === "ar" ? "إضافة تعريفة جمركية جديدة" : "Add New Customs Tariff")
                    }
                  </DialogTitle>
                  <DialogDescription>
                    {language === "ar" 
                      ? "أدخل تفاصيل التعريفة الجمركية والرسوم المطلوبة"
                      : "Enter the customs tariff details and required fees"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hsCode">{language === "ar" ? "كود التعريفة الجمركية" : "HS Code"}</Label>
                      <Input
                        id="hsCode"
                        value={formData.hsCode}
                        onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                        placeholder="8703.21.10"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">{language === "ar" ? "الفئة" : "Category"}</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionAr">{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                    <Input
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dutyRate">{language === "ar" ? "رسوم الجمارك (%)" : "Duty Rate (%)"}</Label>
                      <Input
                        id="dutyRate"
                        type="number"
                        step="0.1"
                        value={formData.dutyRate}
                        onChange={(e) => setFormData({ ...formData, dutyRate: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vatRate">{language === "ar" ? "ضريبة القيمة المضافة (%)" : "VAT Rate (%)"}</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        step="0.1"
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="additionalFees">{language === "ar" ? "رسوم إضافية" : "Additional Fees"}</Label>
                      <Input
                        id="additionalFees"
                        type="number"
                        step="0.01"
                        value={formData.additionalFees}
                        onChange={(e) => setFormData({ ...formData, additionalFees: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {editingTariff 
                        ? (language === "ar" ? "تحديث" : "Update")
                        : (language === "ar" ? "إضافة" : "Add")
                      }
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "إجمالي التعريفات" : "Total Tariffs"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tariffs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "التعريفات النشطة" : "Active Tariffs"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {tariffs.filter(t => t.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "الفئات" : "Categories"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(tariffs.map(t => t.category)).size}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "متوسط الرسوم" : "Average Duty"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tariffs.length > 0 
                  ? (tariffs.reduce((sum, t) => sum + t.dutyRate, 0) / tariffs.length).toFixed(1)
                  : "0"
                }%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tariffs Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "التعريفات الجمركية" : "Customs Tariffs"}</CardTitle>
            <CardDescription>
              {language === "ar" 
                ? `عرض ${filteredTariffs.length} من أصل ${tariffs.length} تعريفة جمركية`
                : `Showing ${filteredTariffs.length} of ${tariffs.length} customs tariffs`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "كود التعريفة" : "HS Code"}</TableHead>
                    <TableHead>{language === "ar" ? "الوصف" : "Description"}</TableHead>
                    <TableHead>{language === "ar" ? "الفئة" : "Category"}</TableHead>
                    <TableHead>{language === "ar" ? "رسوم الجمارك" : "Duty Rate"}</TableHead>
                    <TableHead>{language === "ar" ? "ضريبة القيمة المضافة" : "VAT Rate"}</TableHead>
                    <TableHead>{language === "ar" ? "رسوم إضافية" : "Additional Fees"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTariffs.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell className="font-mono">{tariff.hsCode}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {language === "ar" ? tariff.descriptionAr : tariff.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find(c => c.value === tariff.category)?.label || tariff.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{tariff.dutyRate}%</TableCell>
                      <TableCell>{tariff.vatRate}%</TableCell>
                      <TableCell>{tariff.additionalFees}</TableCell>
                      <TableCell>
                        <Badge variant={tariff.isActive ? "default" : "secondary"}>
                          {tariff.isActive 
                            ? (language === "ar" ? "نشط" : "Active")
                            : (language === "ar" ? "غير نشط" : "Inactive")
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tariff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tariff.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTariffs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {language === "ar" ? "لا توجد تعريفات جمركية" : "No customs tariffs found"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
