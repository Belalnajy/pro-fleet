"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/components/providers/language-provider"
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  DollarSign,
  Clock,
  Thermometer,
  MapPin,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Database,
  Key,
} from "lucide-react"

interface SystemSettings {
  // Tax Settings
  defaultTaxRate: number
  vatEnabled: boolean
  vatRate: number
  
  // Cancellation Policy
  freeCancellationMinutes: number
  cancellationFeePercentage: number
  
  // Temperature Options
  temperatureOptions: Array<{ value: string; label: string; price: number }>
  
  // Tracking Settings
  trackingEnabled: boolean
  trackingInterval: number
  
  // Notification Settings
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  
  // Business Settings
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyLogo: string
  
  // System Settings
  maintenanceMode: boolean
  allowRegistration: boolean
  requireEmailVerification: boolean
  sessionTimeout: number
  
  // Currency Settings
  defaultCurrency: string
  currencySymbol: string
  
  // Language Settings
  defaultLanguage: string
  supportedLanguages: string[]
}

export default function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status } = useSession()
  const { locale } = use(params)
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const [settings, setSettings] = useState<SystemSettings>({
    defaultTaxRate: 15,
    vatEnabled: true,
    vatRate: 15,
    freeCancellationMinutes: 15,
    cancellationFeePercentage: 10,
    temperatureOptions: [
      { value: "ambient", label: "Ambient", price: 0 },
      { value: "cold_2", label: "+2°C", price: 50 },
      { value: "cold_10", label: "+10°C", price: 100 },
      { value: "custom", label: "Custom", price: 150 },
    ],
    trackingEnabled: true,
    trackingInterval: 30,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    companyName: "PRO FLEET",
    companyAddress: "Riyadh, Saudi Arabia",
    companyPhone: "+966500000000",
    companyEmail: "info@profleet.com",
    companyLogo: "",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    defaultCurrency: "SAR",
    currencySymbol: "ر.س",
    defaultLanguage: "en",
    supportedLanguages: ["en", "ar", "ur"],
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTempOption, setNewTempOption] = useState({ value: "", label: "", price: "" })
  // Customer tracking availability (system setting)
  const [customerTrackingEnabled, setCustomerTrackingEnabled] = useState<boolean>(false)
  const [trackingSaving, setTrackingSaving] = useState<boolean>(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`)
    } else {
      fetchSettings()
    }
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...settings, ...data })
      }
      // Fetch system-level tracking toggle
      try {
        const tRes = await fetch("/api/system-settings/tracking")
        if (tRes.ok) {
          const tJson = await tRes.json()
          setCustomerTrackingEnabled(!!tJson.enabled)
        }
      } catch (e) {
        console.error("Error fetching tracking toggle:", e)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveCustomerTrackingToggle = async (enabled: boolean) => {
    setTrackingSaving(true)
    try {
      const res = await fetch("/api/system-settings/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) throw new Error("Failed to save tracking toggle")
      const json = await res.json()
      setCustomerTrackingEnabled(!!json.enabled)
    } catch (e) {
      console.error(e)
      // revert toggle on failure
      setCustomerTrackingEnabled((prev) => prev)
      alert("خطأ في حفظ الإعدادات")
    } finally {
      setTrackingSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        alert("تم حفظ الإعدادات بنجاح")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("خطأ في حفظ الإعدادات")
    } finally {
      setSaving(false)
    }
  }

  const handleAddTemperatureOption = () => {
    if (newTempOption.value && newTempOption.label && newTempOption.price) {
      setSettings({
        ...settings,
        temperatureOptions: [
          ...settings.temperatureOptions,
          {
            value: newTempOption.value,
            label: newTempOption.label,
            price: parseFloat(newTempOption.price),
          },
        ],
      })
      setNewTempOption({ value: "", label: "", price: "" })
    }
  }

  const handleRemoveTemperatureOption = (index: number) => {
    const updatedOptions = settings.temperatureOptions.filter((_, i) => i !== index)
    setSettings({ ...settings, temperatureOptions: updatedOptions })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t("loading")}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إعدادات النظام</h1>
            <p className="text-muted-foreground">إعداد وتهيئة إعدادات النظام</p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>

        <Tabs defaultValue="business" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="business">الأعمال</TabsTrigger>
            <TabsTrigger value="financial">المالية</TabsTrigger>
            <TabsTrigger value="operations">العمليات</TabsTrigger>
            <TabsTrigger value="locations">المواقع</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="system">النظام</TabsTrigger>
            <TabsTrigger value="localization">اللغة</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  {t("businessInformation")}
                </CardTitle>
                <CardDescription>{t("updateCompanyDetails")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">{t("companyName")}</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">{t("companyEmail")}</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyPhone">{t("companyPhone")}</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone}
                      onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyAddress">{t("companyAddress")}</Label>
                    <Textarea
                      id="companyAddress"
                      value={settings.companyAddress}
                      onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">أنواع المركبات (ديناميكي)</h4>
                    <p className="text-sm text-muted-foreground mb-3">أنشئ وعدّل أنواع المركبات لاستخدامها عبر النظام.</p>
                    <Button onClick={() => router.push("/admin/vehicle-types")}>
                      الذهاب إلى أنواع المركبات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  {t("taxSettings")}
                </CardTitle>
                <CardDescription>{t("configureTaxAndVAT")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultTaxRate">{t("defaultTaxRate")} (%)</Label>
                    <Input
                      id="defaultTaxRate"
                      type="number"
                      step="0.01"
                      value={settings.defaultTaxRate}
                      onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="vatEnabled"
                      checked={settings.vatEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, vatEnabled: checked })}
                    />
                    <Label htmlFor="vatEnabled">{t("enableVAT")}</Label>
                  </div>
                  {settings.vatEnabled && (
                    <div>
                      <Label htmlFor="vatRate">{t("vatRate")} (%)</Label>
                      <Input
                        id="vatRate"
                        type="number"
                        step="0.01"
                        value={settings.vatRate}
                        onChange={(e) => setSettings({ ...settings, vatRate: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">{t("currencySettings")}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultCurrency">{t("defaultCurrency")}</Label>
                      <Select
                        value={settings.defaultCurrency}
                        onValueChange={(value) => setSettings({ ...settings, defaultCurrency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currencySymbol">{t("currencySymbol")}</Label>
                      <Input
                        id="currencySymbol"
                        value={settings.currencySymbol}
                        onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {t("cancellationPolicy")}
                </CardTitle>
                <CardDescription>{t("configureCancellationRules")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="freeCancellationMinutes">{t("freeCancellationMinutes")}</Label>
                    <Input
                      id="freeCancellationMinutes"
                      type="number"
                      value={settings.freeCancellationMinutes}
                      onChange={(e) => setSettings({ ...settings, freeCancellationMinutes: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cancellationFeePercentage">{t("cancellationFeePercentage")} (%)</Label>
                    <Input
                      id="cancellationFeePercentage"
                      type="number"
                      step="0.01"
                      value={settings.cancellationFeePercentage}
                      onChange={(e) => setSettings({ ...settings, cancellationFeePercentage: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Thermometer className="h-5 w-5 mr-2" />
                  {t("temperatureOptions")}
                </CardTitle>
                <CardDescription>{t("manageTemperatureSettings")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {settings.temperatureOptions.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">({option.value})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{option.price} {settings.currencySymbol}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTemperatureOption(index)}
                        >
                          {t("remove")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">{t("addNewTemperatureOption")}</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder={t("value")}
                      value={newTempOption.value}
                      onChange={(e) => setNewTempOption({ ...newTempOption, value: e.target.value })}
                    />
                    <Input
                      placeholder={t("label")}
                      value={newTempOption.label}
                      onChange={(e) => setNewTempOption({ ...newTempOption, label: e.target.value })}
                    />
                    <Input
                      placeholder={t("price")}
                      type="number"
                      step="0.01"
                      value={newTempOption.price}
                      onChange={(e) => setNewTempOption({ ...newTempOption, price: e.target.value })}
                    />
                    <Button onClick={handleAddTemperatureOption}>
                      {t("add")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  {t("trackingSettings")}
                </CardTitle>
                <CardDescription>{t("configureGPSTracking")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackingEnabled"
                    checked={settings.trackingEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, trackingEnabled: checked })}
                  />
                  <Label htmlFor="trackingEnabled">{t("enableRealTimeTracking")}</Label>
                </div>
                {settings.trackingEnabled && (
                  <div>
                    <Label htmlFor="trackingInterval">{t("trackingInterval")} ({t("seconds")})</Label>
                    <Input
                      id="trackingInterval"
                      type="number"
                      value={settings.trackingInterval}
                      onChange={(e) => setSettings({ ...settings, trackingInterval: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  إدارة المواقع
                </CardTitle>
                <CardDescription>أدوات لإدارة المدن والمركبات المستخدمة في النظام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">إدارة المدن</h4>
                    <p className="text-sm text-muted-foreground mb-3">أضف وعدّل واحذف المدن المستخدمة في التسعير والرحلات.</p>
                    <Button onClick={() => router.push("/admin/cities")}>
                      الذهاب إلى إدارة المدن
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">إدارة السيارات</h4>
                    <p className="text-sm text-muted-foreground mb-3">أضف وعدّل واحذف المركبات في الأسطول.</p>
                    <Button onClick={() => router.push("/admin/vehicles")}>
                      الذهاب إلى إدارة السيارات
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-2">إدارة درجات الحرارة</h4>
                    <p className="text-sm text-muted-foreground mb-3">أضف وعدّل إعدادات درجات الحرارة للمركبات.</p>
                    <Button onClick={() => router.push("/admin/temperatures")}>
                      الذهاب إلى إدارة درجات الحرارة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  {t("notificationSettings")}
                </CardTitle>
                <CardDescription>{t("configureNotificationChannels")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <Label htmlFor="emailNotifications">{t("emailNotifications")}</Label>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <Label htmlFor="smsNotifications">{t("smsNotifications")}</Label>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="pushNotifications">{t("pushNotifications")}</Label>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {t("systemConfiguration")}
                </CardTitle>
                <CardDescription>{t("configureSystemBehavior")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">{t("maintenanceMode")}</Label>
                      <p className="text-sm text-muted-foreground">{t("maintenanceModeDescription")}</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="customerTrackingToggle">Customer Tracking</Label>
                      <p className="text-sm text-muted-foreground">Enable or disable real-time tracking visibility for customers</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="customerTrackingToggle"
                        checked={customerTrackingEnabled}
                        onCheckedChange={(checked) => {
                          setCustomerTrackingEnabled(checked)
                          saveCustomerTrackingToggle(checked)
                        }}
                        disabled={trackingSaving}
                      />
                      {trackingSaving && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  {t("languageSettings")}
                </CardTitle>
                <CardDescription>{t("configureLanguageSupport")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultLanguage">{t("defaultLanguage")}</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(value) => setSettings({ ...settings, defaultLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="ur">اردو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
