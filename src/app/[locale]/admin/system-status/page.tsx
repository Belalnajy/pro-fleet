"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Truck, 
  Settings, 
  Activity,
  RefreshCw,
  Eye
} from "lucide-react"

interface SystemStatus {
  drivers: {
    total: number
    withVehicleTypes: number
    withoutVehicleTypes: number
  }
  vehicleTypes: {
    total: number
    assigned: number
    unassigned: number
  }
  relationships: {
    total: number
  }
  lastUpdated: string
}

export default function SystemStatusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    router.push("/auth/signin")
    return null
  }

  const fetchSystemStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/system-status")
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      } else {
        toast({
          title: "خطأ",
          description: "فشل في جلب حالة النظام",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching system status:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب حالة النظام",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  const getHealthStatus = () => {
    if (!systemStatus) return { status: "unknown", color: "gray" }
    
    const { drivers, relationships } = systemStatus
    const coveragePercentage = drivers.total > 0 ? (drivers.withVehicleTypes / drivers.total) * 100 : 0
    
    if (coveragePercentage >= 80) {
      return { status: "healthy", color: "green", message: "النظام يعمل بشكل مثالي" }
    } else if (coveragePercentage >= 50) {
      return { status: "warning", color: "yellow", message: "النظام يحتاج لتحسين" }
    } else {
      return { status: "critical", color: "red", message: "النظام يحتاج لإعداد عاجل" }
    }
  }

  const health = getHealthStatus()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">حالة النظام</h1>
          <p className="text-muted-foreground">مراقبة حالة نظام إدارة السائقين وأنواع المركبات</p>
        </div>
        <Button onClick={fetchSystemStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* System Health Overview */}
      <Card className={`border-${health.color}-200 bg-${health.color}-50`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {health.status === "healthy" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {health.status === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
            {health.status === "critical" && <AlertTriangle className="h-5 w-5 text-red-600" />}
            حالة النظام العامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge 
                variant={health.status === "healthy" ? "default" : "destructive"}
                className={`bg-${health.color}-600 text-white`}
              >
                {health.message}
              </Badge>
              {systemStatus && (
                <p className="text-sm text-muted-foreground mt-2">
                  آخر تحديث: {new Date(systemStatus.lastUpdated).toLocaleString('ar-SA')}
                </p>
              )}
            </div>
            <div className="text-right">
              {systemStatus && (
                <div className="text-2xl font-bold">
                  {Math.round((systemStatus.drivers.withVehicleTypes / systemStatus.drivers.total) * 100)}%
                </div>
              )}
              <div className="text-sm text-muted-foreground">تغطية السائقين</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Drivers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي السائقين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.drivers.total}</div>
              <p className="text-xs text-muted-foreground">
                سائق نشط في النظام
              </p>
            </CardContent>
          </Card>

          {/* Drivers with Vehicle Types */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سائقين مع أنواع مركبات</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemStatus.drivers.withVehicleTypes}</div>
              <p className="text-xs text-muted-foreground">
                من {systemStatus.drivers.total} سائق
              </p>
            </CardContent>
          </Card>

          {/* Drivers without Vehicle Types */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سائقين بدون أنواع مركبات</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{systemStatus.drivers.withoutVehicleTypes}</div>
              <p className="text-xs text-muted-foreground">
                يحتاجون لتخصيص أنواع مركبات
              </p>
            </CardContent>
          </Card>

          {/* Total Relationships */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الروابط</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStatus.relationships.total}</div>
              <p className="text-xs text-muted-foreground">
                رابط سائق-نوع مركبة
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            إجراءات سريعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => router.push('/ar/admin/driver-vehicle-types')}
              variant="outline"
              className="h-16 flex flex-col gap-2"
            >
              <Settings className="h-5 w-5" />
              إدارة الروابط يدوياً
            </Button>
            
            <Button 
              onClick={() => router.push('/ar/admin/auto-assign')}
              variant="outline"
              className="h-16 flex flex-col gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              الربط التلقائي
            </Button>
            
            <Button 
              onClick={() => router.push('/ar/admin/trips')}
              variant="outline"
              className="h-16 flex flex-col gap-2"
            >
              <Eye className="h-5 w-5" />
              اختبار الفلترة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {systemStatus && systemStatus.drivers.withoutVehicleTypes > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              توصيات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-yellow-800">
              <p>• يوجد {systemStatus.drivers.withoutVehicleTypes} سائق بدون أنواع مركبات مخصصة</p>
              <p>• استخدم الربط التلقائي لتوفير الوقت</p>
              <p>• راجع المؤهلات قبل تخصيص أنواع المركبات</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
