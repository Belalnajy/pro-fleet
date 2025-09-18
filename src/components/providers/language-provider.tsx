"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { translations, languages, type Language, type TranslationKey } from '@/lib/translations'
import type { Locale } from "@/lib/types"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
  initialLocale?: Locale
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLocale || "en")
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Mark as client-side to prevent hydration mismatch
    setIsClient(true)
    
    // Initialize with the locale from URL or saved preference
    if (initialLocale) {
      setLanguageState(initialLocale)
    } else if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem("language") as Language
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage)
      }
    }
  }, [initialLocale])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    
    // Only update localStorage and DOM if we're on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem("language", lang)
      
      // Update document direction and language
      document.documentElement.dir = languages[lang].dir
      document.documentElement.lang = lang
      
      // Navigate to the new locale URL
      // Remove current locale from pathname (handle both /en, /ar, /ur)
      const pathSegments = pathname.split('/')
      const currentLocale = pathSegments[1]
      
      let newPath = '/'
      if (pathSegments.length > 2) {
        // If there are segments after the locale, keep them
        newPath = '/' + pathSegments.slice(2).join('/')
      }
      
      // Navigate to new locale
      router.push(`/${lang}${newPath}`)
    }
  }

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  const dir = languages[language]?.dir || "ltr"

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}