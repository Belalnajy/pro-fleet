"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLanguage } from "./language-provider"
import { translations, type Language } from '@/lib/translations'

export function LanguageInitializer() {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Get current locale from URL
    const currentLocale = pathname.split('/')[1] as Language
    
    // Get saved language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language
    
    // If there's a saved language and it's different from current URL locale
    if (savedLanguage && 
        translations[savedLanguage] && 
        savedLanguage !== currentLocale) {
      
      // Navigate to saved language preference
      const pathSegments = pathname.split('/')
      let newPath = '/'
      if (pathSegments.length > 2) {
        newPath = '/' + pathSegments.slice(2).join('/')
      }
      
      // Use replace to avoid adding to history
      router.replace(`/${savedLanguage}${newPath}`)
    } else if (currentLocale && translations[currentLocale]) {
      // Update localStorage and cookies to match current URL
      localStorage.setItem("language", currentLocale)
      document.cookie = `preferred-language=${currentLocale}; path=/; max-age=31536000; SameSite=Lax`
      
      // Update language state if different
      if (currentLocale !== language) {
        setLanguage(currentLocale)
      }
    }
  }, [pathname, language, setLanguage, router])

  return null // This component doesn't render anything
}
