'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  CreditCard,
  FileText,
  Calendar,
  SaudiRiyal
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentStats {
  paymentStatus: string
  _count: { id: number }
  _sum: {
    total: number | null
    amountPaid: number | null
    remainingAmount: number | null
  }
}

interface InstallmentInvoice {
  invoiceNumber: string
  installmentCount: number | null
  installmentsPaid: number | null
  installmentAmount: number | null
  nextInstallmentDate: string | null
  total: number
  amountPaid: number
  remainingAmount: number
}

interface SyncData {
  regularInvoices: {
    stats: PaymentStats[]
    needSyncCount: number
    totalCount: number
  }
  clearanceInvoices: {
    stats: PaymentStats[]
    needSyncCount: number
    totalCount: number
  }
  installmentInvoices: {
    regular: InstallmentInvoice[]
    clearance: InstallmentInvoice[]
  }
}

interface SyncResult {
  success: boolean
  message: string
  details: {
    totalInvoices: number
    updatedCount: number
    errorCount: number
    errors: string[]
  }
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  INSTALLMENT: 'bg-purple-100 text-purple-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
  PENDING: 'معلقة',
  SENT: 'مرسلة',
  PAID: 'مدفوعة',
  PARTIAL: 'دفع جزئي',
  INSTALLMENT: 'أقساط',
  OVERDUE: 'متأخرة',
  CANCELLED: 'ملغية'
}

export default function SyncPaymentsPage() {
  const [data, setData] = useState<SyncData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({})

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/sync-payments')
      if (!response.ok) throw new Error('فشل في جلب البيانات')
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error)
      toast.error('فشل في جلب البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (type: 'regular' | 'clearance' | 'all') => {
    try {
      setSyncing(type)
      const response = await fetch('/api/admin/sync-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })

      if (!response.ok) throw new Error('فشل في المزامنة')
      
      const result = await response.json()
      
      if (type === 'all') {
        setSyncResults({
          regular: result.results.regular,
          clearance: result.results.clearance
        })
      } else {
        setSyncResults(prev => ({
          ...prev,
          [type]: result
        }))
      }
      
      toast.success(result.message)
      await fetchData() // تحديث البيانات
    } catch (error) {
      console.error('خطأ في المزامنة:', error)
      toast.error('فشل في المزامنة')
    } finally {
      setSyncing(null)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="mr-2 text-lg">جاري تحميل البيانات...</span>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مزامنة المدفوعات والأقساط</h1>
          <p className="text-muted-foreground mt-2">
            تحديث وتصحيح حسابات المدفوعات والأقساط لجميع الفواتير
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث البيانات
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 ml-2" />
              الفواتير العادية
            </CardTitle>
            <CardDescription>
              {data.regularInvoices.totalCount} فاتورة إجمالي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                تحتاج مزامنة: {data.regularInvoices.needSyncCount} فاتورة
              </div>
              <Button 
                onClick={() => handleSync('regular')}
                disabled={syncing !== null}
                className="w-full"
                variant={data.regularInvoices.needSyncCount > 0 ? "default" : "secondary"}
              >
                {syncing === 'regular' ? (
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 ml-2" />
                )}
                مزامنة الفواتير العادية
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 ml-2" />
              فواتير التخليص الجمركي
            </CardTitle>
            <CardDescription>
              {data.clearanceInvoices.totalCount} فاتورة إجمالي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                تحتاج مزامنة: {data.clearanceInvoices.needSyncCount} فاتورة
              </div>
              <Button 
                onClick={() => handleSync('clearance')}
                disabled={syncing !== null}
                className="w-full"
                variant={data.clearanceInvoices.needSyncCount > 0 ? "default" : "secondary"}
              >
                {syncing === 'clearance' ? (
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 ml-2" />
                )}
                مزامنة فواتير التخليص
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Database className="h-5 w-5 ml-2" />
              مزامنة شاملة
            </CardTitle>
            <CardDescription>
              جميع الفواتير معاً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                إجمالي: {data.regularInvoices.totalCount + data.clearanceInvoices.totalCount} فاتورة
              </div>
              <Button 
                onClick={() => handleSync('all')}
                disabled={syncing !== null}
                className="w-full"
                variant="default"
              >
                {syncing === 'all' ? (
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
                مزامنة جميع الفواتير
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Results */}
      {Object.keys(syncResults).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">نتائج المزامنة</h2>
          {Object.entries(syncResults).map(([type, result]) => (
            <Alert key={type} className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">{result.message}</div>
                  <div className="text-sm text-muted-foreground">
                    إجمالي الفواتير: {result.details.totalInvoices} | 
                    تم التحديث: {result.details.updatedCount} | 
                    أخطاء: {result.details.errorCount}
                  </div>
                  {result.details.errors.length > 0 && (
                    <div className="text-sm text-red-600">
                      <div className="font-medium">الأخطاء:</div>
                      <ul className="list-disc list-inside">
                        {result.details.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regular Invoices Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 ml-2" />
              إحصائيات الفواتير العادية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.regularInvoices.stats.map((stat) => (
                <div key={stat.paymentStatus} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Badge className={statusColors[stat.paymentStatus]}>
                      {statusLabels[stat.paymentStatus]}
                    </Badge>
                    <span className="text-sm font-medium">{stat._count.id} فاتورة</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">إجمالي القيمة</div>
                    <div className="font-medium">{(stat._sum.total || 0).toLocaleString()} ريال</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clearance Invoices Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 ml-2" />
              إحصائيات فواتير التخليص الجمركي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.clearanceInvoices.stats.map((stat) => (
                <div key={stat.paymentStatus} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Badge className={statusColors[stat.paymentStatus]}>
                      {statusLabels[stat.paymentStatus]}
                    </Badge>
                    <span className="text-sm font-medium">{stat._count.id} فاتورة</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">إجمالي القيمة</div>
                    <div className="font-medium">{(stat._sum.total || 0).toLocaleString()} ريال</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installment Invoices */}
      {(data.installmentInvoices.regular.length > 0 || data.installmentInvoices.clearance.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <CreditCard className="h-5 w-5 ml-2" />
            فواتير الأقساط
          </h2>
          
          {data.installmentInvoices.regular.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الفواتير العادية - أقساط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.installmentInvoices.regular.map((invoice) => (
                    <div key={invoice.invoiceNumber} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <Badge variant="outline">
                          {invoice.installmentsPaid}/{invoice.installmentCount} أقساط
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">قيمة القسط</div>
                          <div className="font-medium">{(invoice.installmentAmount || 0).toLocaleString()} ريال</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">المبلغ المدفوع</div>
                          <div className="font-medium text-green-600">{invoice.amountPaid.toLocaleString()} ريال</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">المبلغ المتبقي</div>
                          <div className="font-medium text-orange-600">{invoice.remainingAmount.toLocaleString()} ريال</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">القسط التالي</div>
                          <div className="font-medium">
                            {invoice.nextInstallmentDate 
                              ? new Date(invoice.nextInstallmentDate).toLocaleDateString('ar-SA')
                              : 'مكتمل'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.installmentInvoices.clearance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">فواتير التخليص الجمركي - أقساط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.installmentInvoices.clearance.map((invoice) => (
                    <div key={invoice.invoiceNumber} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <Badge variant="outline">
                          {invoice.installmentsPaid}/{invoice.installmentCount} أقساط
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">قيمة القسط</div>
                          <div className="font-medium">{(invoice.installmentAmount || 0).toLocaleString()} ريال</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">المبلغ المدفوع</div>
                          <div className="font-medium text-green-600">{invoice.amountPaid.toLocaleString()} ريال</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">المبلغ المتبقي</div>
                          <div className="font-medium text-orange-600">{invoice.remainingAmount.toLocaleString()} ريال</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">القسط التالي</div>
                          <div className="font-medium">
                            {invoice.nextInstallmentDate 
                              ? new Date(invoice.nextInstallmentDate).toLocaleDateString('ar-SA')
                              : 'مكتمل'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
