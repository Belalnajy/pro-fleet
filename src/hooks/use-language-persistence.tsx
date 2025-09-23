"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { translations, type Language } from '@/lib/translations'

export function useLanguagePersistence() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Get saved language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language
    
    // Get current locale from URL
    const currentLocale = pathname.split('/')[1] as Language
    
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
      const newUrl = `/${savedLanguage}${newPath}`
      router.replace(newUrl)
    } else if (currentLocale && translations[currentLocale]) {
      // Update localStorage to match current URL (in case user navigated directly)
      localStorage.setItem("language", currentLocale)
      document.cookie = `preferred-language=${currentLocale}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [pathname, router])
}
