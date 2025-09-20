"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Settings,
  Bell,
  Mail,
  Shield,
  Download,
  Upload,
  Database,
  Calculator,
  FileText,
  Loader2
} from "lucide-react"

export default function AccountantSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    invoiceReminders: true,
    paymentAlerts: true,
    reportSchedule: "weekly",
    
    // Financial Settings
    defaultCurrency: "SAR",
    taxRate: 15,
    customsFeeRate: 2,
    paymentTerms: 30,
    
    // System Settings
    autoBackup: true,
    dataRetention: 365,
    auditLog: true,
    
    // Report Settings
    defaultReportFormat: "pdf",
    includeCharts: true,
    showDetails: true
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ACCOUNTANT") {
      router.push(`/${locale}/auth/signin`)
    }
  }, [session, status, router])

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ الإعدادات بنجاح"
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      toast({
        title: "جاري التصدير",
        description: "سيتم تحميل الملف قريباً"
      })
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "تم التصدير",
        description: "تم تصدير البيانات بنجاح"
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "خطأ",
        description: "فشل في تصدير البيانات",
        variant: "destructive"
      })
    }
  }

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل الإعدادات...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== "ACCOUNTANT") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إعدادات المحاسبة</h1>
            <p className="text-gray-600">إدارة إعدادات النظام المحاسبي والتفضيلات</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            حفظ الإعدادات
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                إعدادات التنبيهات
              </CardTitle>
              <CardDescription>
                إدارة التنبيهات والإشعارات المحاسبية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-gray-500">تلقي إشعارات عبر البريد الإلكتروني</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تذكير الفواتير</Label>
                  <p className="text-sm text-gray-500">تذكير بالفواتير المستحقة</p>
                </div>
                <Switch
                  checked={settings.invoiceReminders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, invoiceReminders: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تنبيهات الدفع</Label>
                  <p className="text-sm text-gray-500">تنبيه عند استلام مدفوعات جديدة</p>
                </div>
                <Switch
                  checked={settings.paymentAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, paymentAlerts: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>جدولة التقارير</Label>
                <Select 
                  value={settings.reportSchedule} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, reportSchedule: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">يومي</SelectItem>
                    <SelectItem value="weekly">أسبوعي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="quarterly">ربع سنوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                الإعدادات المالية
              </CardTitle>
              <CardDescription>
                إعدادات العملة والضرائب والرسوم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>العملة الافتراضية</Label>
                <Select 
                  value={settings.defaultCurrency} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, defaultCurrency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                    <SelectItem value="EUR">يورو (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>معدل الضريبة (%)</Label>
                <Input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>معدل رسوم الجمارك (%)</Label>
                <Input
                  type="number"
                  value={settings.customsFeeRate}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, customsFeeRate: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>شروط الدفع (أيام)</Label>
                <Input
                  type="number"
                  value={settings.paymentTerms}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                إعدادات النظام
              </CardTitle>
              <CardDescription>
                إعدادات النسخ الاحتياطي والأمان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>النسخ الاحتياطي التلقائي</Label>
                  <p className="text-sm text-gray-500">نسخ احتياطي يومي للبيانات</p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoBackup: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>فترة الاحتفاظ بالبيانات (أيام)</Label>
                <Input
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>سجل المراجعة</Label>
                  <p className="text-sm text-gray-500">تسجيل جميع العمليات المحاسبية</p>
                </div>
                <Switch
                  checked={settings.auditLog}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, auditLog: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Report Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                إعدادات التقارير
              </CardTitle>
              <CardDescription>
                تخصيص تنسيق ومحتوى التقارير
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>تنسيق التقرير الافتراضي</Label>
                <Select 
                  value={settings.defaultReportFormat} 
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, defaultReportFormat: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>تضمين الرسوم البيانية</Label>
                  <p className="text-sm text-gray-500">إضافة رسوم بيانية للتقارير</p>
                </div>
                <Switch
                  checked={settings.includeCharts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, includeCharts: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>إظهار التفاصيل</Label>
                  <p className="text-sm text-gray-500">تضمين تفاصيل المعاملات</p>
                </div>
                <Switch
                  checked={settings.showDetails}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showDetails: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              إدارة البيانات
            </CardTitle>
            <CardDescription>
              تصدير واستيراد البيانات المحاسبية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExportData} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                تصدير البيانات
              </Button>
              <Button variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                استيراد البيانات
              </Button>
              <Button variant="outline" className="flex-1">
                <Database className="h-4 w-4 mr-2" />
                نسخة احتياطية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
