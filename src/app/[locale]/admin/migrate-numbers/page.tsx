'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface MigrationStatus {
  trips: {
    oldFormatCount: number
    newFormatCount: number
    totalTrips: number
    needsMigration: boolean
    sampleOldTrips: Array<{ tripNumber: string; createdAt: string }>
  }
  invoices: {
    regularInvoices: {
      oldFormatCount: number
      newFormatCount: number
      needsMigration: boolean
      samples: Array<{ invoiceNumber: string; createdAt: string }>
    }
    clearanceInvoices: {
      oldFormatCount: number
      newFormatCount: number
      needsMigration: boolean
      samples: Array<{ invoiceNumber: string; createdAt: string }>
    }
    totalOldInvoices: number
    totalNewInvoices: number
    needsMigration: boolean
  }
}

export default function MigrateNumbersPage() {
  const [status, setStatus] = useState<MigrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState({ trips: false, invoices: false })
  const [results, setResults] = useState<any>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      
      // Fetch trip migration status
      const tripsResponse = await fetch('/api/admin/migrate-trip-numbers')
      const tripsData = await tripsResponse.json()

      // Fetch invoice migration status
      const invoicesResponse = await fetch('/api/admin/migrate-invoice-numbers')
      const invoicesData = await invoicesResponse.json()

      setStatus({
        trips: tripsData,
        invoices: invoicesData
      })
    } catch (error) {
      console.error('Error fetching migration status:', error)
      toast.error('خطأ في جلب حالة الترحيل')
    } finally {
      setLoading(false)
    }
  }

  const migrateTrips = async () => {
    try {
      setMigrating(prev => ({ ...prev, trips: true }))
      
      const response = await fetch('/api/admin/migrate-trip-numbers', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`تم ترحيل ${result.successCount} رحلة بنجاح`)
        setResults(prev => ({ ...prev, trips: result }))
        await fetchStatus() // Refresh status
      } else {
        toast.error(result.error || 'خطأ في ترحيل أرقام الرحلات')
      }
    } catch (error) {
      console.error('Error migrating trips:', error)
      toast.error('خطأ في ترحيل أرقام الرحلات')
    } finally {
      setMigrating(prev => ({ ...prev, trips: false }))
    }
  }

  const migrateInvoices = async () => {
    try {
      setMigrating(prev => ({ ...prev, invoices: true }))
      
      const response = await fetch('/api/admin/migrate-invoice-numbers', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`تم ترحيل ${result.totalSuccess} فاتورة بنجاح`)
        setResults(prev => ({ ...prev, invoices: result }))
        await fetchStatus() // Refresh status
      } else {
        toast.error(result.error || 'خطأ في ترحيل أرقام الفواتير')
      }
    } catch (error) {
      console.error('Error migrating invoices:', error)
      toast.error('خطأ في ترحيل أرقام الفواتير')
    } finally {
      setMigrating(prev => ({ ...prev, invoices: false }))
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ترحيل أرقام الرحلات والفواتير</h1>
          <p className="text-muted-foreground">
            تحديث أرقام الرحلات والفواتير من التنسيق القديم إلى التنسيق الجديد
          </p>
        </div>
        <Button onClick={fetchStatus} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          تحديث الحالة
        </Button>
      </div>

      {/* Trip Numbers Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            أرقام الرحلات
            {status?.trips.needsMigration ? (
              <Badge variant="destructive">يحتاج ترحيل</Badge>
            ) : (
              <Badge variant="default">مكتمل</Badge>
            )}
          </CardTitle>
          <CardDescription>
            تحديث أرقام الرحلات من TWB: و TRP- إلى تنسيق PRO الجديد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {status?.trips.oldFormatCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">رحلات بالتنسيق القديم</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {status?.trips.newFormatCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">رحلات بالتنسيق الجديد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {status?.trips.totalTrips || 0}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي الرحلات</div>
            </div>
          </div>

          {status?.trips.sampleOldTrips && status.trips.sampleOldTrips.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">عينة من الرحلات التي تحتاج ترحيل:</h4>
              <div className="space-y-1">
                {status.trips.sampleOldTrips.slice(0, 5).map((trip, index) => (
                  <div key={index} className="text-sm bg-muted p-2 rounded">
                    {trip.tripNumber} - {new Date(trip.createdAt).toLocaleDateString('ar')}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={migrateTrips}
            disabled={!status?.trips.needsMigration || migrating.trips}
            className="w-full"
          >
            {migrating.trips ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري ترحيل أرقام الرحلات...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                ترحيل أرقام الرحلات
              </>
            )}
          </Button>

          {results?.trips && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-medium mb-2">نتائج ترحيل الرحلات:</h4>
              <p>تم بنجاح: {results.trips.successCount}</p>
              <p>أخطاء: {results.trips.errorCount}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Numbers Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            أرقام الفواتير
            {status?.invoices.needsMigration ? (
              <Badge variant="destructive">يحتاج ترحيل</Badge>
            ) : (
              <Badge variant="default">مكتمل</Badge>
            )}
          </CardTitle>
          <CardDescription>
            تحديث أرقام الفواتير من INV- و CI- إلى تنسيق PRO-INV- و PRO-CLR- الجديد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Regular Invoices */}
            <div className="space-y-2">
              <h4 className="font-medium">الفواتير العادية</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {status?.invoices.regularInvoices.oldFormatCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">تنسيق قديم</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {status?.invoices.regularInvoices.newFormatCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">تنسيق جديد</div>
                </div>
              </div>
            </div>

            {/* Clearance Invoices */}
            <div className="space-y-2">
              <h4 className="font-medium">فواتير التخليص</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {status?.invoices.clearanceInvoices.oldFormatCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">تنسيق قديم</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {status?.invoices.clearanceInvoices.newFormatCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">تنسيق جديد</div>
                </div>
              </div>
            </div>
          </div>

          {status?.invoices.regularInvoices.samples && status.invoices.regularInvoices.samples.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">عينة من الفواتير التي تحتاج ترحيل:</h4>
              <div className="space-y-1">
                {status.invoices.regularInvoices.samples.slice(0, 3).map((invoice, index) => (
                  <div key={index} className="text-sm bg-muted p-2 rounded">
                    {invoice.invoiceNumber} - {new Date(invoice.createdAt).toLocaleDateString('ar')}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={migrateInvoices}
            disabled={!status?.invoices.needsMigration || migrating.invoices}
            className="w-full"
          >
            {migrating.invoices ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري ترحيل أرقام الفواتير...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                ترحيل أرقام الفواتير
              </>
            )}
          </Button>

          {results?.invoices && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-medium mb-2">نتائج ترحيل الفواتير:</h4>
              <p>الفواتير العادية - نجح: {results.invoices.regularInvoices.success}, فشل: {results.invoices.regularInvoices.error}</p>
              <p>فواتير التخليص - نجح: {results.invoices.clearanceInvoices.success}, فشل: {results.invoices.clearanceInvoices.error}</p>
              <p>إجمالي النجح: {results.invoices.totalSuccess}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            تحذير مهم
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <ul className="list-disc list-inside space-y-1">
            <li>تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل تشغيل الترحيل</li>
            <li>عملية الترحيل لا يمكن التراجع عنها</li>
            <li>سيتم تحديث جميع أرقام الرحلات والفواتير الموجودة</li>
            <li>قد تستغرق العملية وقتاً طويلاً حسب عدد السجلات</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
