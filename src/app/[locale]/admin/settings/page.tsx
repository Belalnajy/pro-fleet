"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, RefreshCw, Settings, MapPin, Thermometer, Truck, Receipt } from "lucide-react"
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
    <DashboardLayout
      title={t('systemSettings')}
      subtitle={t('configureSystemSettings')}
      actions={
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? t('saving') : t('saveSettings')}
        </Button>
      }
    >
      <div className="space-y-6" dir="rtl">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('welcomeToSettings')}</h2>
              <p className="text-sm text-muted-foreground">{t('customizeProFleetSettings')}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="business" className="w-full">
          {/* Responsive Grid Tabs - No Overflow */}
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto p-2 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="business" 
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <div className="p-1.5 rounded-md bg-primary/10">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <span className="text-center leading-tight">{t('business')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="financial" 
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <div className="p-1.5 rounded-md bg-green-500/10">
                <Save className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-center leading-tight">{t('financial')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="operations" 
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <div className="p-1.5 rounded-md bg-orange-500/10">
                <RefreshCw className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-center leading-tight">{t('operations')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="locations" 
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-center leading-tight">{t('locations')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="customs" 
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <div className="p-1.5 rounded-md bg-teal-500/10">
                <Receipt className="w-4 h-4 text-teal-600" />
              </div>
              <span className="text-center leading-tight">{t('customs')}</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="business" className="space-y-6 mt-6">
          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('companyInfo')}</CardTitle>
                  <CardDescription className="text-sm">{t('updateCompanyDetails')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium">{t('companyName')}</Label>
                  <Input
                    id="companyName"
                    className="h-11"
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
                  <Label htmlFor="companyEmail" className="text-sm font-medium">{t('companyEmail')}</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    className="h-11"
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
                  <Label htmlFor="companyPhone" className="text-sm font-medium">{t('companyPhone')}</Label>
                  <Input
                    id="companyPhone"
                    className="h-11"
                    value={settings.business.companyPhone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        business: { ...settings.business, companyPhone: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="text-sm font-medium">{t('companyAddress')}</Label>
                <Input
                  id="companyAddress"
                  className="h-11"
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

        <TabsContent value="financial" className="space-y-6 mt-6">
          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Save className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('taxSettings')}</CardTitle>
                  <CardDescription className="text-sm">{t('configureTaxVAT')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate" className="text-sm font-medium">{t('defaultTaxRate')}</Label>
                  <Input
                    id="defaultTaxRate"
                    type="number"
                    className="h-11"
                    placeholder="15"
                    value={settings.financial.defaultTaxRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        financial: { ...settings.financial, defaultTaxRate: parseFloat(e.target.value) || 0 },
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 h-11">
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
                  <Label htmlFor="enableVAT" className="text-sm font-medium">{t('enableVAT')}</Label>
                </div>
              </div>
              {settings.financial.enableVAT && (
                <div className="space-y-2">
                  <Label htmlFor="vatRate" className="text-sm font-medium">{t('vatRate')}</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    className="h-11"
                    placeholder="15"
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

          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('currencySettings')}</CardTitle>
                  <CardDescription className="text-sm">{t('currencySymbolsSettings')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency" className="text-sm font-medium">{t('defaultCurrency')}</Label>
                  <Input
                    id="defaultCurrency"
                    className="h-11"
                    placeholder="SAR"
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
                  <Label htmlFor="currencySymbol" className="text-sm font-medium">{t('currencySymbol')}</Label>
                  <Input
                    id="currencySymbol"
                    className="h-11"
                    placeholder={t('sarPlaceholder')}
                    value={settings.financial.currencySymbol}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        financial: { ...settings.financial, currencySymbol: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6 mt-6">
          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('cancellationPolicy')}</CardTitle>
                  <CardDescription className="text-sm">{t('configureCancellationRules')}</CardDescription>
                </div>
              </div>
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
                          ? t('customersCanSeeRealTimeTracking')
                          : t('customersCannotAccessTracking')}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    settings.tracking.enableRealTimeTracking 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {settings.tracking.enableRealTimeTracking ? t('enabled') : t('disabled')}
                  </div>
                </div>
                
                {settings.tracking.enableRealTimeTracking && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">{t('importantInfo')}</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {t('trackingEnabledDescription')}<br/>
                      {t('trackingDisabledDescription')}
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

        <TabsContent value="locations" className="space-y-6 mt-6">
          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('locationManagement')}</CardTitle>
                  <CardDescription className="text-sm">{t('manageCitiesTemperature')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href={`/${locale}/admin/cities`} className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{t('manageCities')}</span>
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/temperatures`} className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <Thermometer className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">{t('manageTemperatureSettings')}</span>
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/vehicle-types`} className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <Truck className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">{t('manageVehicleTypes')}</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Driver Management Section */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('driverManagement')}</CardTitle>
                  <CardDescription className="text-sm">{t('manageDriverVehicleAssignments')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href={`/${locale}/admin/system-status`} className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">{t('systemStatus')}</span>
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/driver-vehicle-types`} className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                      <Settings className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">{t('manageDriverVehicleTypes')}</span>
                  </Button>
                </Link>
                <Link href={`/${locale}/admin/auto-assign`} className="block">
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 hover:border-yellow-200 transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-lg bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors">
                      <RefreshCw className="h-5 w-5 text-yellow-600" />
                    </div>
                    <span className="text-sm font-medium">{t('autoAssignVehicleTypes')}</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customs" className="space-y-6 mt-6">
          <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Receipt className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('customsTariffsManagement')}</CardTitle>
                  <CardDescription className="text-sm">{t('manageCustomsTariffs')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl border border-teal-200/50 dark:border-teal-800/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-teal-500/10">
                    <Receipt className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-teal-900 dark:text-teal-100 mb-2">
                      {t('customsTariffsManagement')}
                    </h3>
                    <p className="text-teal-700 dark:text-teal-300 text-sm mb-4">
                      {t('customsTariffsDescription')}
                    </p>
                    <Link href={`/${locale}/admin/customs-tariffs`}>
                      <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{t('openCustomsTariffs')}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  )
}
