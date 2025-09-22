"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Truck, User, Zap, CheckCircle, AlertCircle } from "lucide-react"

interface AssignmentResult {
  success: boolean
  message: string
  stats: {
    driversCount: number
    vehicleTypesCount: number
    relationshipsCreated: number
  }
  assignments: {
    driverName: string
    vehicleTypeName: string
  }[]
  summary: {
    driverName: string
    vehicleTypes: string[]
  }[]
}

export default function AutoAssignPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssignmentResult | null>(null)

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

  const handleAutoAssign = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/drivers/auto-assign-vehicle-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: "نجح! ✅",
          description: data.message
        })
      } else {
        toast({
          title: "خطأ ❌",
          description: data.error || "فشل في الربط التلقائي",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error in auto-assignment:", error)
      toast({
        title: "خطأ ❌",
        description: "حدث خطأ أثناء الربط التلقائي",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">الربط التلقائي للسائقين بأنواع المركبات</h1>
          <p className="text-muted-foreground">ربط تلقائي عشوائي للسائقين بأنواع المركبات المختلفة</p>
        </div>
      </div>

      {/* Auto Assignment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            الربط التلقائي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">كيف يعمل الربط التلقائي:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• سيتم ربط كل سائق بـ 1-3 أنواع مركبات عشوائياً</li>
              <li>• سيتم حذف جميع الروابط الموجودة أولاً</li>
              <li>• سيتم إنشاء روابط جديدة تلقائياً</li>
              <li>• بعد الانتهاء ستظهر النتائج أدناه</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleAutoAssign} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري الربط التلقائي...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                بدء الربط التلقائي
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                إحصائيات النتائج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{result.stats.driversCount}</div>
                  <div className="text-sm text-blue-800">سائق</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{result.stats.vehicleTypesCount}</div>
                  <div className="text-sm text-green-800">نوع مركبة</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.stats.relationshipsCreated}</div>
                  <div className="text-sm text-purple-800">رابط تم إنشاؤه</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ملخص السائقين وأنواع المركبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.summary.map((driver, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {driver.driverName}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {driver.vehicleTypes.map((vehicleType, vtIndex) => (
                        <Badge key={vtIndex} variant="secondary" className="text-xs">
                          {vehicleType}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">تم الربط بنجاح!</span>
              </div>
              <p className="text-green-700 mt-2">
                الآن يمكنك الذهاب إلى صفحة حجز الرحلات وستجد أن السائقين يتم فلترتهم حسب نوع المركبة المختار.
              </p>
              <div className="mt-4 space-x-2">
                <Button 
                  onClick={() => router.push('/ar/admin/trips')}
                  variant="outline"
                  size="sm"
                >
                  إدارة الرحلات
                </Button>
                <Button 
                  onClick={() => router.push('/ar/customer/book-trip')}
                  variant="outline"
                  size="sm"
                >
                  حجز رحلة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
