"use client"

import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/hooks/useTranslation'
import { type TranslationKey } from '@/lib/translations'

export function useTranslatedToast() {
  const { toast } = useToast()
  const { t } = useTranslation()

  return {
    success: (titleKey: TranslationKey, descriptionKey?: TranslationKey) => {
      toast({
        title: t(titleKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        variant: "default",
      })
    },

    error: (titleKey: TranslationKey, descriptionKey?: TranslationKey) => {
      toast({
        title: t(titleKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        variant: "destructive",
      })
    },

    warning: (titleKey: TranslationKey, descriptionKey?: TranslationKey) => {
      toast({
        title: t(titleKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        variant: "default",
      })
    },

    info: (titleKey: TranslationKey, descriptionKey?: TranslationKey) => {
      toast({
        title: t(titleKey),
        description: descriptionKey ? t(descriptionKey) : undefined,
        variant: "default",
      })
    },

    // Raw toast for custom messages
    raw: (title: string, description?: string, variant?: "default" | "destructive") => {
      toast({
        title,
        description,
        variant: variant || "default",
      })
    },

    // Common toast messages
    itemCreated: () => toast({
      title: t('success'),
      description: t('itemCreated'),
      variant: "default",
    }),

    itemUpdated: () => toast({
      title: t('success'),
      description: t('itemUpdated'),
      variant: "default",
    }),

    itemDeleted: () => toast({
      title: t('success'),
      description: t('itemDeleted'),
      variant: "default",
    }),

    networkError: () => toast({
      title: t('error'),
      description: t('networkError'),
      variant: "destructive",
    }),

    invalidCredentials: () => toast({
      title: t('error'),
      description: t('invalidCredentials'),
      variant: "destructive",
    }),
  }
}
