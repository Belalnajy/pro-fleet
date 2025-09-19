// Import English translations
import enCommon from '@/locales/en/common.json'
import enNavbar from '@/locales/en/navbar.json'
import enAuth from '@/locales/en/auth.json'
import enDashboard from '@/locales/en/dashboard.json'
import enUsers from '@/locales/en/users.json'
import enVehicles from '@/locales/en/vehicles.json'
import enTrips from '@/locales/en/trips.json'
import enHome from '@/locales/en/home.json'
import enAbout from '@/locales/en/about.json'
import enPricing from '@/locales/en/pricing.json'
import enTerms from '@/locales/en/terms.json'
import enSettings from '@/locales/en/settings.json'
import enInvoices from '@/locales/en/invoices.json'
import enReports from '@/locales/en/reports.json'

// Import Arabic translations
import arCommon from '@/locales/ar/common.json'
import arNavbar from '@/locales/ar/navbar.json'
import arAuth from '@/locales/ar/auth.json'
import arDashboard from '@/locales/ar/dashboard.json'
import arUsers from '@/locales/ar/users.json'
import arVehicles from '@/locales/ar/vehicles.json'
import arTrips from '@/locales/ar/trips.json'
import arHome from '@/locales/ar/home.json'
import arAbout from '@/locales/ar/about.json'
import arPricing from '@/locales/ar/pricing.json'
import arTerms from '@/locales/ar/terms.json'
import arSettings from '@/locales/ar/settings.json'
import arInvoices from '@/locales/ar/invoices.json'
import arReports from '@/locales/ar/reports.json'

// Import Urdu translations
import urCommon from '@/locales/ur/common.json'
import urNavbar from '@/locales/ur/navbar.json'
import urAuth from '@/locales/ur/auth.json'
import urDashboard from '@/locales/ur/dashboard.json'
import urUsers from '@/locales/ur/users.json'
import urVehicles from '@/locales/ur/vehicles.json'
import urTrips from '@/locales/ur/trips.json'
import urHome from '@/locales/ur/home.json'
import urAbout from '@/locales/ur/about.json'
import urPricing from '@/locales/ur/pricing.json'
import urTerms from '@/locales/ur/terms.json'
import urSettings from '@/locales/ur/settings.json'
import urInvoices from '@/locales/ur/invoices.json'
import urReports from '@/locales/ur/reports.json'

export const languages = {
  en: {
    name: "English",
    flag: "🇺🇸",
    dir: "ltr",
  },
  ar: {
    name: "العربية",
    flag: "🇸🇦",
    dir: "rtl",
  },
  ur: {
    name: "اردو",
    flag: "🇵🇰",
    dir: "rtl",
  },
} as const

export type Language = keyof typeof languages

// Combine all translation files for each language
export const translations = {
  en: {
    ...enCommon,
    ...enNavbar,
    ...enAuth,
    ...enDashboard,
    ...enUsers,
    ...enVehicles,
    ...enTrips,
    ...enHome,
    ...enAbout,
    ...enPricing,
    ...enTerms,
    ...enSettings,
    ...enInvoices,
    ...enReports,
  },
  ar: {
    ...arCommon,
    ...arNavbar,
    ...arAuth,
    ...arDashboard,
    ...arUsers,
    ...arVehicles,
    ...arTrips,
    ...arHome,
    ...arAbout,
    ...arPricing,
    ...arTerms,
    ...arSettings,
    ...arInvoices,
    ...arReports,
  },
  ur: {
    ...urCommon,
    ...urNavbar,
    ...urAuth,
    ...urDashboard,
    ...urUsers,
    ...urVehicles,
    ...urTrips,
    ...urHome,
    ...urAbout,
    ...urPricing,
    ...urTerms,
    ...urSettings,
    ...urInvoices,
    ...urReports,
  },
} as const

export type TranslationKey = keyof typeof translations.en

// Utility functions for i18n
export function getLanguageDirection(lang: Language): 'ltr' | 'rtl' {
  return languages[lang].dir
}

export function isRTL(lang: Language): boolean {
  return languages[lang].dir === 'rtl'
}

export function getLanguageName(lang: Language): string {
  return languages[lang].name
}

export function getLanguageFlag(lang: Language): string {
  return languages[lang].flag
}

// Default language
export const defaultLanguage: Language = 'en'

// Available languages list
export const availableLanguages = Object.keys(languages) as Language[]

// Helper function to get translation with fallback
export function getTranslation(
  lang: Language,
  key: TranslationKey,
  fallback?: string
): string {
  return translations[lang]?.[key] || translations[defaultLanguage][key] || fallback || key
}
