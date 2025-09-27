'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useCompanyInfo } from '@/hooks/useCompanyInfo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Truck, 
  Shield, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  MapPinned, 
  MapPin, 
  Hash, 
  CreditCard,
  CheckCircle,
  Thermometer,
  Award,
  ArrowRight,
  Star,
  Zap,
  TrendingUp,
  Headphones,
  FileCheck,
  Building2,
  User,
  Globe,
  Twitter,
  Instagram
} from 'lucide-react'
import { LanguageSelector } from '@/components/ui/language-selector'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Chatbot } from '@/components/ui/chatbot'

interface LocalePageProps {
  params: Promise<{
    locale: string
  }>
}

export default function HomePage({ params }: LocalePageProps) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const { companyInfo } = useCompanyInfo()

  const features = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: t('realTimeTracking'),
      description: t('realTimeTrackingDesc')
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: t('smartRouting'),
      description: t('smartRoutingDesc')
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: t('costOptimization'),
      description: t('costOptimizationDesc')
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: t('reliableService'),
      description: t('reliableServiceDesc')
    },
    {
      icon: <Headphones className="h-8 w-8 text-primary" />,
      title: t('support247'),
      description: t('support247Desc')
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: t('advancedTechnology'),
      description: t('advancedTechnologyDesc')
    }
  ]

  const services = [
    {
      icon: <Truck className="h-12 w-12 text-primary" />,
      title: t('fleetManagement'),
      description: t('fleetManagementDesc')
    },
    {
      icon: <MapPin className="h-12 w-12 text-primary" />,
      title: t('cargoTransport'),
      description: t('cargoTransportDesc')
    },
    {
      icon: <Thermometer className="h-12 w-12 text-primary" />,
      title: t('temperatureControl'),
      description: t('temperatureControlDesc')
    },
    {
      icon: <FileCheck className="h-12 w-12 text-primary" />,
      title: t('customsClearance'),
      description: t('customsClearanceDesc')
    }
  ]

  const whyChooseUs = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('experience'),
      description: t('experienceDesc')
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: t('modernFleet'),
      description: t('modernFleetDesc')
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: t('competitivePrices'),
      description: t('competitivePricesDesc')
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: t('onTimeDelivery'),
      description: t('onTimeDeliveryDesc')
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24 md:h-28">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <img src={companyInfo.logo} alt={companyInfo.name} className="h-16 w-auto sm:h-20 md:h-24 lg:h-32 xl:h-36 object-contain" />
            </div>
            
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Terms and Conditions Link */}
              <Link href={`/${locale}/terms`} className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-black">
                  <FileCheck className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t('termsAndConditions')}
                </Button>
              </Link>
              
              {/* Language Selector */}
              <LanguageSelector variant="compact" showLabel={false} />
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Auth Buttons */}
              <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${locale}/auth/signin`}>
                    {t('signIn')}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/${locale}/auth/signup`}>
                    {t('getStarted')}
                  </Link>
                </Button>
              </div>
              
              {/* Mobile Auth Buttons */}
              <div className="sm:hidden flex items-center space-x-1 rtl:space-x-reverse">
                <Button asChild variant="ghost" size="sm" className="text-xs px-2">
                  <Link href={`/${locale}/auth/signin`}>
                    {t('signIn')}
                  </Link>
                </Button>
                <Button asChild size="sm" className="text-xs px-2">
                  <Link href={`/${locale}/auth/signup`}>
                    {t('getStarted')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              {t('brandTagline')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <p className="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
              {t('heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href={`/${locale}/auth/signup`}>
                  {t('getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link href={`/${locale}/auth/signin`}>
                  {t('signIn')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('features')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('heroDescription')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('servicesTitle')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('aboutUsDescription')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group hover:scale-105">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20">
              المميزات الرئيسية
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              لماذا تختار برو فليت؟
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              نقدم حلول متطورة لإدارة الأسطول والنقل مع تقنيات حديثة تضمن أفضل خدمة لعملائنا
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Real-time Tracking */}
            <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl font-bold text-center">تتبع فوري ودقيق</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed text-center mb-6">
                  تتبع مباشر لجميع الشحنات والمركبات مع تحديثات لحظية للموقع والحالة
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">تحديثات الموقع المباشرة</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">تنبيهات فورية للتسليم</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Temperature Control */}
            <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Thermometer className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl font-bold text-center">مراقبة درجة الحرارة</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed text-center mb-6">
                  نظام متطور لمراقبة درجة الحرارة للحفاظ على جودة البضائع الحساسة
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">مراقبة مستمرة للحرارة</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">تنبيهات عند تجاوز الحدود</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Digital Documentation */}
            <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/50 dark:to-violet-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl font-bold text-center">وثائق رقمية</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed text-center mb-6">
                  إدارة شاملة للفواتير والوثائق الرقمية مع توقيعات إلكترونية آمنة
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">فواتير إلكترونية</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">توقيعات رقمية آمنة</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Analytics */}
            <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-xl font-bold text-center">تحليلات ذكية</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed text-center mb-6">
                  تقارير مفصلة وتحليلات ذكية لتحسين الأداء وخفض التكاليف
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">تقارير شاملة</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">تحليل الأداء</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 24/7 Support */}
            <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-xl font-bold text-center">دعم فني 24/7</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed text-center mb-6">
                  فريق دعم فني متخصص متاح على مدار الساعة لضمان استمرارية العمل
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">دعم مستمر 24/7</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">استجابة سريعة</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security & Compliance */}
            <Card className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-4 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/50 dark:to-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-xl font-bold text-center">أمان والتزام</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed text-center mb-6">
                  أعلى معايير الأمان والامتثال للوائح المحلية والدولية
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">تشفير متقدم</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-muted-foreground">امتثال كامل للوائح</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                {t('aboutUs')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                {t('aboutUsTitle')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t('aboutUsDescription')}
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('ourMission')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('ourMissionText')}
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {t('ourVision')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('ourVisionText')}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {whyChooseUs.map((item, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader className="pb-3">
                    <div className="flex justify-center mb-2">
                      {item.icon}
                    </div>
                    <CardTitle className="text-base sm:text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs sm:text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company Information Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {t('companyInfo')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  {t('phone')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-mono">{companyInfo.phone}</p>
                <p className="text-sm text-muted-foreground mt-1">8002440411</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  {t('email')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{companyInfo.email}</p>
                <p className="text-sm text-muted-foreground mt-1">{companyInfo.website}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t('website')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{companyInfo.website}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  {t('commercialRegister')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-mono">{companyInfo.commercialRegister}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('unifiedRegister')}: {companyInfo.unifiedCommercialRegister}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('nationalAddress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{companyInfo.shortNationalAddress}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('address')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {t('fullAddress')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('followUs')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('socialMedia')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center sm:justify-start space-x-3 rtl:space-x-reverse">
                <Link href="https://twitter.com/profleetapp" target="_blank">
                  <Twitter className="h-6 w-6 text-blue-500" />
                  <span className="font-medium text-sm sm:text-base">@profleetapp</span>
                </Link>
              </div>
            </Card>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center sm:justify-start space-x-3 rtl:space-x-reverse">
                <Link href="https://www.instagram.com/profleetapp/" target="_blank">
                  <Instagram className="h-6 w-6 text-pink-500" />
                  <span className="font-medium text-sm sm:text-base">@profleetapp</span>
                </Link>
              </div>
            </Card>
            <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center sm:justify-start space-x-3 rtl:space-x-reverse">
                <Link href="https://www.facebook.com/profleetapp/" target="_blank">
                  <div className="h-6 w-6 bg-yellow-400 rounded" />
                  <span className="font-medium text-sm sm:text-base">{companyInfo.domain}</span>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Terms and Conditions Section */}
      <section className="bg-primary/5 border-t border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileCheck className="h-8 w-8 text-primary mr-3 rtl:mr-0 rtl:ml-3" />
              <h2 className="text-2xl font-bold text-foreground">{t('termsAndConditions')}</h2>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('readTermsBeforeUse') || 'يرجى قراءة الشروط والأحكام قبل استخدام خدماتنا لضمان فهم حقوقك والتزاماتك'}
            </p>
            <Link href={`/${locale}/terms`}>
              <Button size="lg" className="text-lg px-8">
                <FileCheck className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
                {t('readTermsAndConditions') || 'اقرأ الشروط والأحكام'}
                <ArrowRight className="h-5 w-5 ml-2 rtl:ml-0 rtl:mr-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('getStartedToday')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('getStartedTodayDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href={`/${locale}/auth/signup`}>
                {t('getStarted')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 text-black">
            <Link href={`/${locale}/auth/signin`}>
                {t('signIn')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="col-span-1 lg:col-span-2">
              <div>
                <img src={companyInfo.logo} alt={companyInfo.name} className="h-24 w-auto sm:h-28 md:h-32 lg:h-36 object-contain" />
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t('aboutUsDescription')}
              </p>
              
              {/* Social Media */}
              <div className="mb-6 ">
                <h4 className="font-semibold text-foreground mb-3">{t('followUsOn')}</h4>
                <div className="flex flex-wrap gap-3">
                  <Link href="https://twitter.com/profleetapp" target="_blank" className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground hover:text-primary transition-colors">
                    <Twitter className="h-4 w-4" />
                    <span className="text-sm">profleetapp</span>
                  </Link>
                  <Link href="https://www.instagram.com/profleetapp/" target="_blank" className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground hover:text-primary transition-colors">
                    <Instagram className="h-4 w-4" />
                    <span className="text-sm">profleetapp</span>
                  </Link>
                  <Link href="https://www.snapchat.com/add/profleetapp" target="_blank" className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground hover:text-primary transition-colors">
                    <div className="h-4 w-4 bg-yellow-400 rounded" />
                    <span className="text-sm">profleetapp</span>
                  </Link>
                  <Link href="https://www.tiktok.com/@profleetapp" target="_blank" className="flex items-center space-x-2 rtl:space-x-reverse text-muted-foreground hover:text-primary transition-colors">
                    <div className="h-4 w-4 bg-black rounded" />
                    <span className="text-sm">profleetapp</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('ourServices')}</h3>
              <ul className="space-y-2 text-muted-foreground text-sm  " 
              
             >
                <li>{t('fleetManagement')}</li>
                <li>{t('cargoTransport')}</li>
                <li>{t('temperatureControl')}</li>
                <li>{t('customsClearance')}</li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('contactInfo')}</h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div>{companyInfo.phone}</div>
                    <div className="text-xs">{companyInfo.unifiedNumber}</div>
                  </div>
                </li>
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div>{companyInfo.email}</div>
                  </div>
                </li>
                <li className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <div>{companyInfo.website}</div>
                    <div className="text-xs">{companyInfo.domain}</div>
                  </div>
                </li>
              </ul>
            </div>

            {/* Business Info */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('businessInfo')}</h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li className="flex items-start space-x-2 rtl:space-x-reverse">
                  <Building2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t('commercialRegisterNumber')}</div>
                    <div className="text-xs">{companyInfo.commercialRegister}</div>
                  </div>
                </li>
                <li className="flex items-start space-x-2 rtl:space-x-reverse">
                  <CreditCard className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t('unifiedCommercialRegister')}</div>
                    <div className="text-xs">{companyInfo.unifiedCommercialRegister}</div>
                  </div>
                </li>
                <li className="flex items-start space-x-2 rtl:space-x-reverse">
                  <Hash className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t('unifiedNumber')}</div>
                    <div className="text-xs">8002440411</div>
                  </div>
                </li>
                <li className="flex items-start space-x-2 rtl:space-x-reverse">
                  <MapPinned className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t('shortNationalAddress')}</div>
                    <div className="text-xs">{companyInfo.shortNationalAddress}</div>
                  </div>
                </li>
                <li className="flex items-start space-x-2 rtl:space-x-reverse">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">{t('fullNationalAddress')}</div>
                    <div className="text-xs leading-relaxed">
                      {t('buildingNumber')} {companyInfo.buildingNumber} – {t('subNumber')} {companyInfo.subNumber}<br />
                      {t('postalCode')} {companyInfo.postalCode} – {companyInfo.district}<br />
                      {companyInfo.street}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-start text-muted-foreground text-sm">
              <p>{t('allRightsReserved')}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link href={`/${locale}/terms`} className="hover:text-primary transition-colors">
                {t('termsAndConditions')}
              </Link>
              <span>|</span>
              <span>{t('username')}: profleetapp</span>
              <span>|</span>
              <span>{t('copyright')} © 2025</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <Chatbot position="fixed" />
    </div>
  )
}
