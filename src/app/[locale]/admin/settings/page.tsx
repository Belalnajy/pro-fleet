"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, Settings, MapPin, Thermometer } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/useTranslation"
import { useSystemSettings } from "@/hooks/useSystemSettings"

interface SystemSettings {
  business: {
    companyName: string
    companyEmail: string
    companyPhone: string
    companyAddress: string
  }
  financial: {
    defaultTaxRate: number
    enableVAT: boolean
    vatRate: number
    defaultCurrency: string
    currencySymbol: string
  }
  operations: {
    freeCancellationMinutes: number
    cancellationFeePercentage: number
  }
  tracking: {
    enableRealTimeTracking: boolean
    trackingInterval: number
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
  }
  system: {
    maintenanceMode: boolean
  }
  localization: {
    defaultLanguage: string
  }
}

export default function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const { settings, setSettings, loading, saving, saveSettings } = useSystemSettings()

  const handleSaveSettings = async () => {
    if (settings) {
      await saveSettings(settings)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('systemSettings')}</h1>
          <p className="text-muted-foreground">{t('configureSystemSettings')}</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? t('saving') : t('saveSettings')}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-4 mb-6 ">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 ">
          <TabsTrigger value="business">{t('business')}</TabsTrigger>
          <TabsTrigger value="financial">{t('financial')}</TabsTrigger>
          <TabsTrigger value="operations">{t('operations')}</TabsTrigger>
          <TabsTrigger value="locations">{t('locations')}</TabsTrigger>
 
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('companyInfo')}</CardTitle>
              <CardDescription>{t('updateCompanyDetails')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('companyName')}</Label>
                <Input
                  id="companyName"
                  value={settings.business.companyName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business: { ...settings.business, companyName: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">{t('companyEmail')}</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.business.companyEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business: { ...settings.business, companyEmail: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">{t('companyPhone')}</Label>
                <Input
                  id="companyPhone"
                  value={settings.business.companyPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business: { ...settings.business, companyPhone: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress">{t('companyAddress')}</Label>
                <Input
                  id="companyAddress"
                  value={settings.business.companyAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business: { ...settings.business, companyAddress: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('taxSettings')}</CardTitle>
              <CardDescription>{t('configureTaxVAT')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultTaxRate">{t('defaultTaxRate')}</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  value={settings.financial.defaultTaxRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      financial: { ...settings.financial, defaultTaxRate: parseFloat(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableVAT"
                  checked={settings.financial.enableVAT}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      financial: { ...settings.financial, enableVAT: checked },
                    })
                  }
                />
                <Label htmlFor="enableVAT">{t('enableVAT')}</Label>
              </div>
              {settings.financial.enableVAT && (
                <div className="space-y-2">
                  <Label htmlFor="vatRate">{t('vatRate')}</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    value={settings.financial.vatRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        financial: { ...settings.financial, vatRate: parseFloat(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('currencySettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">{t('defaultCurrency')}</Label>
                <Input
                  id="defaultCurrency"
                  value={settings.financial.defaultCurrency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      financial: { ...settings.financial, defaultCurrency: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">{t('currencySymbol')}</Label>
                <Input
                  id="currencySymbol"
                  value={settings.financial.currencySymbol}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      financial: { ...settings.financial, currencySymbol: e.target.value },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('cancellationPolicy')}</CardTitle>
              <CardDescription>{t('configureCancellationRules')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="freeCancellationMinutes">{t('freeCancellationMinutes')}</Label>
                <Input
                  id="freeCancellationMinutes"
                  type="number"
                  value={settings.operations.freeCancellationMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, freeCancellationMinutes: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellationFeePercentage">{t('cancellationFeePercentage')}</Label>
                <Input
                  id="cancellationFeePercentage"
                  type="number"
                  value={settings.operations.cancellationFeePercentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      operations: { ...settings.operations, cancellationFeePercentage: parseFloat(e.target.value) || 0 },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('trackingSettings')}</CardTitle>
              <CardDescription>{t('configureGPSTracking')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableRealTimeTracking"
                      checked={settings.tracking.enableRealTimeTracking}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          tracking: { ...settings.tracking, enableRealTimeTracking: checked },
                        })
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="enableRealTimeTracking" className="text-base font-medium">
                        {t('enableRealTimeTracking')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {settings.tracking.enableRealTimeTracking 
                          ? "العملاء يمكنهم رؤية موقع شحناتهم في الوقت الفعلي" 
                          : "العملاء لا يمكنهم الوصول لصفحة التتبع"}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    settings.tracking.enableRealTimeTracking 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {settings.tracking.enableRealTimeTracking ? "مفعل" : "معطل"}
                  </div>
                </div>
                
                {settings.tracking.enableRealTimeTracking && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">معلومات مهمة</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      عند تفعيل التتبع، سيتمكن العملاء من رؤية موقع شحناتهم المباشر والوصول لصفحة التتبع.
                      عند إلغاء التفعيل، ستظهر للعملاء رسالة بأن الخدمة غير متاحة مؤقتاً.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingInterval">{t('trackingInterval')}</Label>
                <Input
                  id="trackingInterval"
                  type="number"
                  value={settings.tracking.trackingInterval}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      tracking: { ...settings.tracking, trackingInterval: parseInt(e.target.value) || 30 },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('locationManagement')}
              </CardTitle>
              <CardDescription>{t('manageCitiesTemperature')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href={`/${locale}/admin/cities`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('manageCities')}
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/temperatures`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    {t('manageTemperatureSettings')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
