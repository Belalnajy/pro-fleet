"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useTranslation } from "@/hooks/useTranslation"
import { 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  SaudiRiyal,
  Users,
  Truck
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Example component demonstrating i18n features
 */
export function I18nExample() {
  const { t, dir, isRTL, rtlClass, rtlContent } = useTranslation()

  const stats = [
    {
      title: t('totalTrips'),
      value: '1,234',
      icon: Truck,
      change: '+12%'
    },
    {
      title: t('activeDrivers'),
      value: '56',
      icon: Users,
      change: '+3%'
    },
    {
      title: t('todayRevenue'),
      value: '45,678 ' + t('currency'),
      icon: SaudiRiyal,
      change: '+8%'
    }
  ]

  return (
    <div className={cn("space-y-6 p-6", dir === 'rtl' && "text-right")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t('brandName') || 'PRO FLEET'}
          </h1>
          <p className="text-muted-foreground">
            {t('brandTagline') || 'Smart Fleet Management'}
          </p>
        </div>
        <LanguageSelector />
      </div>

      {/* Language Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('selectLanguage')}
          </CardTitle>
          <CardDescription>
            Current direction: <Badge variant="outline">{dir.toUpperCase()}</Badge>
            {isRTL && <Badge className="ml-2">RTL</Badge>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Direction Demo */}
            <div className="space-y-2">
              <h4 className="font-medium">{t('actions')}</h4>
              <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                <Button size="sm" variant="outline">
                  {rtlContent(<ArrowLeft className="h-4 w-4" />, <ArrowRight className="h-4 w-4" />)}
                  {t('previous')}
                </Button>
                <Button size="sm">
                  {t('next')}
                  {rtlContent(<ArrowRight className="h-4 w-4" />, <ArrowLeft className="h-4 w-4" />)}
                </Button>
              </div>
            </div>

            {/* Text Alignment Demo */}
            <div className="space-y-2">
              <h4 className="font-medium">{t('date')} & {t('time')}</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="number">2024-01-15</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="number">14:30</span>
                </div>
              </div>
            </div>

            {/* Currency Demo */}
            <div className="space-y-2">
              <h4 className="font-medium">{t('price')}</h4>
              <div className="text-2xl font-bold">
                1,500 {t('currency')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className={cn(
                "flex items-center justify-between",
                isRTL && "flex-row-reverse"
              )}>
                <div className={cn("space-y-2", isRTL && "text-right")}>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="text-xs text-green-600">
                    {stat.change} {t('thisMonth')}
                  </p>
                </div>
                <div className={cn(
                  "h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center",
                  rtlClass("ml-4", "mr-4")
                )}>
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Example */}
      <Card>
        <CardHeader>
          <CardTitle>{t('search')}</CardTitle>
          <CardDescription>
            {t('filter')} {t('actions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder={t('search') + '...'}
              className={cn(
                "flex-1 px-3 py-2 border rounded-md",
                isRTL && "text-right"
              )}
            />
            <Button>
              {t('search')}
            </Button>
            <Button variant="outline">
              {t('filter')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RTL/LTR Specific Content */}
      <Card>
        <CardHeader>
          <CardTitle>Direction-Specific Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rtl-only">
              <Badge>RTL Only Content</Badge>
              <p className="mt-2">This content only shows in RTL languages (Arabic, Urdu)</p>
            </div>
            <div className="ltr-only">
              <Badge>LTR Only Content</Badge>
              <p className="mt-2">This content only shows in LTR languages (English)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
