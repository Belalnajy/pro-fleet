import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface SystemSettings {
  business: {
    companyName: string
    companyEmail: string
    companyPhone: string
    companyAddress: string;
    website: string;
    domain: string;
    companyLogo: string;
    // Commercial Registration Info
    commercialRegister: string
    unifiedCommercialRegister: string
    unifiedNumber: string
    // National Address
    shortNationalAddress: string
    buildingNumber: string
    subNumber: string
    postalCode: string
    district: string
    street: string
    fullNationalAddress: string
  }
  financial: {
    defaultTaxRate: number
    enableVAT: boolean
    vatRate: number
    defaultCurrency: string
    currencySymbol: string
  }
  operations: {
    freeCancellationMinutes: number
    cancellationFeePercentage: number
  }
  tracking: {
    enableRealTimeTracking: boolean
    trackingInterval: number
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
  }
  system: {
    maintenanceMode: boolean
  }
  localization: {
    defaultLanguage: string
  }
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        throw new Error('Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "❌ خطأ في تحميل الإعدادات",
        description: "حدث خطأ أثناء تحميل إعدادات النظام",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings: SystemSettings) => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSettings(newSettings)
        toast({
          title: "✅ تم حفظ الإعدادات بنجاح",
          description: "تم تحديث إعدادات النظام بنجاح",
        })
        return true
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "❌ خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ إعدادات النظام",
        variant: "destructive",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    setSettings,
    loading,
    saving,
    saveSettings,
    reloadSettings: loadSettings,
  }
}
