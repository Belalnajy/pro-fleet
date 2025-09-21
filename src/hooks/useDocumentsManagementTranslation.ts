import { useLanguage } from '@/components/providers/language-provider'

// Import translation files
import arTranslations from '@/locales/ar/documents-management.json'
import enTranslations from '@/locales/en/documents-management.json'
import urTranslations from '@/locales/ur/documents-management.json'

const translations = {
  ar: arTranslations,
  en: enTranslations,
  ur: urTranslations,
}

export type DocumentsManagementTranslationKey = keyof typeof arTranslations

export function useDocumentsManagementTranslation() {
  const { language } = useLanguage()
  
  const translate = (key: DocumentsManagementTranslationKey): string => {
    return translations[language as keyof typeof translations][key] || key
  }

  return { translate, language }
}
