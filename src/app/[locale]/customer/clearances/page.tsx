"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/providers/language-provider"
import { PageLoading } from "@/components/ui/loading"
import { toast } from "sonner"
import {
  FileText,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  Download,
  Truck,
  User,
  Calendar,
  DollarSign
} from "lucide-react"

interface ClearanceProps {
  params: Promise<{
    locale: string
  }>
}

interface Clearance {
  id: string
  clearanceNumber: string
  status: string
  customsFee: number
  additionalFees: number
  totalFees: number
  notes: string | null
  estimatedCompletionDate: string | null
  actualCompletionDate: string | null
  createdAt: string
  updatedAt: string
  invoice: {
    id: string
    invoiceNumber: string
    total: number
    currency: string
    paymentStatus: string
    trip: {
      id: string
      tripNumber: string
      fromCity: string
      toCity: string
    }
  }
  customsBroker: {
    name: string
  }
}

export default function CustomerClearancesPage({ params }: ClearanceProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = use(params)
  const { t } = useLanguage()

  const [clearances, setClearances] = useState<Clearance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "CUSTOMER") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchClearances()
    }
  }, [session, status, router, locale])

  const fetchClearances = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/customer/clearances")
      
      if (response.ok) {
        const data = await response.json()
        setClearances(data)
        console.log("✅ Customer clearances loaded:", data)
      } else {
        console.error("❌ Failed to fetch clearances")
      }
    } catch (error) {
      console.error("Error fetching clearances:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter clearances based on search and status
  const filteredClearances = clearances.filter((clearance) => {
    const matchesSearch = 
      clearance.clearanceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clearance.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clearance.invoice.trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clearance.customsBroker.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || clearance.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    totalClearances: clearances.length,
    pendingClearances: clearances.filter(c => c.status === "PENDING").length,
    inProgressClearances: clearances.filter(c => c.status === "IN_PROGRESS").length,
    completedClearances: clearances.filter(c => c.status === "COMPLETED").length,
    totalFees: clearances.reduce((sum, c) => sum + c.totalFees, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200"
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-3 w-3" />
      case "IN_PROGRESS":
        return <Package className="h-3 w-3" />
      case "COMPLETED":
        return <CheckCircle className="h-3 w-3" />
      case "CANCELLED":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "في الانتظار"
      case "IN_PROGRESS":
        return "قيد المعالجة"
      case "COMPLETED":
        return "مكتمل"
      case "REJECTED":
        return "مرفوض"
      default:
        return status
    }
  }

  const handleViewClearance = (clearance: Clearance) => {
    setSelectedClearance(clearance)
    setShowDetailsModal(true)
  }

  const handleDownloadDocuments = async (clearanceId: string) => {
    try {
      const response = await fetch(`/api/customer/clearances/${clearanceId}/documents`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `clearance-${clearanceId}-documents.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('تم تحميل المستندات بنجاح')
      } else {
        toast.error('فشل في تحميل المستندات')
      }
    } catch (error) {
      console.error('Error downloading documents:', error)
      toast.error('حدث خطأ أثناء تحميل المستندات')
    }
  }

  if (loading) {
    return <PageLoading />
  }

  if (!session || session.user.role !== "CUSTOMER") {
    return null
  }

  return (
    <DashboardLayout
      title="التخليصات الجمركية"
      subtitle="تتبع حالة التخليصات الجمركية لرحلاتك"
      actions={
        <Button onClick={() => router.push(`/${locale}/customer/book-trip`)}>
          <Truck className="h-4 w-4 mr-2" />
          حجز رحلة جديدة
        </Button>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التخليصات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClearances}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingClearances}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressClearances}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedClearances}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرسوم</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFees.toFixed(2)} ريال</div>
          </CardContent>
        </Card>
      </div>

      {/* Clearances Management */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة التخليصات الجمركية</CardTitle>
          <CardDescription>عرض وتتبع جميع التخليصات الجمركية الخاصة بك</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في التخليصات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="PENDING">في الانتظار</SelectItem>
                <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                <SelectItem value="COMPLETED">مكتمل</SelectItem>
                <SelectItem value="CANCELLED">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clearances Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التخليص</TableHead>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>رقم الرحلة</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>المخلص الجمركي</TableHead>
                  <TableHead>الرسوم الإجمالية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClearances.map((clearance) => (
                  <TableRow key={clearance.id}>
                    <TableCell className="font-medium">
                      {clearance.clearanceNumber}
                    </TableCell>
                    <TableCell>{clearance.invoice.invoiceNumber}</TableCell>
                    <TableCell>{clearance.invoice.trip.tripNumber}</TableCell>
                    <TableCell>
                      {clearance.invoice.trip.fromCity} → {clearance.invoice.trip.toCity}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {clearance.customsBroker.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {clearance.totalFees.toFixed(2)} ريال
                      </div>
                      {clearance.customsFee > 0 && (
                        <div className="text-sm text-muted-foreground">
                          رسوم جمركية: {clearance.customsFee.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(clearance.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(clearance.status)}
                          {getStatusText(clearance.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(clearance.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewClearance(clearance)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {clearance.status === 'COMPLETED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocuments(clearance.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClearances.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد تخليصات جمركية</h3>
              <p className="text-muted-foreground mb-4">
                لم يتم العثور على تخليصات جمركية تطابق معايير البحث
              </p>
              <Button onClick={() => router.push(`/${locale}/customer/book-trip`)}>
                <Truck className="h-4 w-4 mr-2" />
                حجز رحلة جديدة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clearance Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل التخليص الجمركي</DialogTitle>
            <DialogDescription>
              معلومات مفصلة عن التخليص الجمركي رقم {selectedClearance?.clearanceNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClearance && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">رقم التخليص</label>
                  <p className="font-medium">{selectedClearance.clearanceNumber}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                  <Badge className={getStatusColor(selectedClearance.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedClearance.status)}
                      {getStatusText(selectedClearance.status)}
                    </div>
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">رقم الفاتورة</label>
                  <p className="font-medium">{selectedClearance.invoice.invoiceNumber}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">رقم الرحلة</label>
                  <p className="font-medium">{selectedClearance.invoice.trip.tripNumber}</p>
                </div>
              </div>

              {/* Route Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  معلومات الرحلة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">من</label>
                    <p>{selectedClearance.invoice.trip.fromCity}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">إلى</label>
                    <p>{selectedClearance.invoice.trip.toCity}</p>
                  </div>
                </div>
              </div>

              {/* Customs Broker Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  المخلص الجمركي
                </h3>
                <p>{selectedClearance.customsBroker.name}</p>
              </div>

              {/* Financial Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  المعلومات المالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">الرسوم الجمركية</label>
                    <p className="font-medium">{selectedClearance.customsFee.toFixed(2)} ريال</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">رسوم إضافية</label>
                    <p className="font-medium">{selectedClearance.additionalFees.toFixed(2)} ريال</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">إجمالي الرسوم</label>
                    <p className="font-medium text-lg">{selectedClearance.totalFees.toFixed(2)} ريال</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  التواريخ المهمة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">تاريخ الإنشاء</label>
                    <p>{new Date(selectedClearance.createdAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                  {selectedClearance.estimatedCompletionDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">التاريخ المتوقع للإنجاز</label>
                      <p>{new Date(selectedClearance.estimatedCompletionDate).toLocaleDateString('ar-SA')}</p>
                    </div>
                  )}
                  {selectedClearance.actualCompletionDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">تاريخ الإنجاز الفعلي</label>
                      <p>{new Date(selectedClearance.actualCompletionDate).toLocaleDateString('ar-SA')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedClearance.notes && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">ملاحظات</h3>
                  <p className="text-muted-foreground">{selectedClearance.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedClearance.status === 'COMPLETED' && (
                  <Button onClick={() => handleDownloadDocuments(selectedClearance.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    تحميل المستندات
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
