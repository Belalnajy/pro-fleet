"use client"

import { useLanguage } from '@/components/providers/language-provider'
import { translations, type Language, type TranslationKey, getLanguageDirection, isRTL } from '@/lib/translations'

/**
 * Hook for accessing translation functions and language utilities
 */
export function useTranslation() {
  const { language, setLanguage, t, dir } = useLanguage()

  return {
    // Current language
    language,
    
    // Change language function
    setLanguage,
    
    // Translation function
    t,
    
    // Text direction
    dir,
    
    // Utility functions
    isRTL: dir === 'rtl',
    isLTR: dir === 'ltr',
    
    // Helper for conditional classes
    rtlClass: (rtlClass: string, ltrClass: string = '') => 
      dir === 'rtl' ? rtlClass : ltrClass,
    
    // Helper for conditional content
    rtlContent: <T>(rtlContent: T, ltrContent: T) => 
      dir === 'rtl' ? rtlContent : ltrContent,
  }
}

/**
 * Hook for translation with fallback support
 */
export function useTranslationWithFallback() {
  const { t, language } = useTranslation()

  return {
    t: (key: TranslationKey, fallback?: string) => {
      const translation = t(key)
      return translation === key && fallback ? fallback : translation
    },
    language,
  }
}

/**
 * Hook for getting translations in multiple languages
 */
export function useMultiLanguageTranslation() {
  const { language } = useTranslation()

  return {
    getTranslation: (key: TranslationKey, targetLanguage?: Language) => {
      const lang = targetLanguage || language
      return translations[lang]?.[key] || translations.en[key] || key
    },
    currentLanguage: language,
  }
}
