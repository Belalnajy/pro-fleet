"use client"

import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, Settings, MapPin, Thermometer } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/hooks/useTranslation"
import { useToast } from "@/hooks/use-toast"

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
  const [settings, setSettings] = useState<SystemSettings>({
    business: {
      companyName: "PRO FLEET",
      companyEmail: "info@profleet.com",
      companyPhone: "+966 11 123 4567",
      companyAddress: "الرياض، المملكة العربية السعودية",
    },
    financial: {
      defaultTaxRate: 0,
      enableVAT: false,
      vatRate: 0,
      defaultCurrency: "USD",
      currencySymbol: "$",
    },
    operations: {
      freeCancellationMinutes: 30,
      cancellationFeePercentage: 10,
    },
    tracking: {
      enableRealTimeTracking: true,
      trackingInterval: 30,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
    },
    system: {
      maintenanceMode: false,
    },
    localization: {
      defaultLanguage: "ar",
    },
  })

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        // دمج البيانات المحملة مع القيم الافتراضية
        setSettings(prevSettings => ({
          business: {
            companyName: data.business?.companyName || prevSettings.business.companyName,
            companyEmail: data.business?.companyEmail || prevSettings.business.companyEmail,
            companyPhone: data.business?.companyPhone || prevSettings.business.companyPhone,
            companyAddress: data.business?.companyAddress || prevSettings.business.companyAddress,
          },
          financial: {
            ...prevSettings.financial,
            ...data.financial
          },
          operations: {
            ...prevSettings.operations,
            ...data.operations
          },
          tracking: {
            ...prevSettings.tracking,
            ...data.tracking
          },
          notifications: {
            ...prevSettings.notifications,
            ...data.notifications
          },
          system: {
            ...prevSettings.system,
            ...data.system
          },
          localization: {
            ...prevSettings.localization,
            ...data.localization
          }
        }))
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
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
        toast({
          title: "✅ " + t('settingsSavedSuccessfully'),
          description: t('configureSystemSettings'),
        })
      } else {
        toast({
          title: "❌ " + t('errorSavingSettings'),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "❌ " + t('errorSavingSettings'),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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

      <Tabs defaultValue="business" className="space-y-4 mb-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2">
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
                <Label htmlFor="enableRealTimeTracking">{t('enableRealTimeTracking')}</Label>
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
              <div className="flex gap-4">
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
