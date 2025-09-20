"use client"

import { useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from "@/components/providers/language-provider"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default function AuthRedirectPage({ params }: PageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { locale } = use(params)
  const { t } = useLanguage()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      // Not authenticated, redirect to signin
      router.push(`/${locale}/auth/signin`)
      return
    }

    // Use current locale from URL
    const currentLocale = locale

    // Redirect based on user role with current locale
    const userRole = session.user?.role
    
    switch (userRole) {
      case 'ADMIN':
        router.push(`/${currentLocale}/admin`)
        break
      case 'DRIVER':
        router.push(`/${currentLocale}/driver`)
        break
      case 'CUSTOMER':
        router.push(`/${currentLocale}/customer`)
        break
      case 'ACCOUNTANT':
        router.push(`/${currentLocale}/accountant`)
        break
      case 'CUSTOMS_BROKER':
        router.push(`/${currentLocale}/customs-broker`)
        break
      default:
        router.push(`/${currentLocale}/dashboard`)
    }
  }, [session, status, router, locale])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t("redirecting")}</p>
      </div>
    </div>
  )
}
