import { useState, useEffect } from 'react'

interface CancellationSettings {
  freeCancellationMinutes: number
  cancellationFeePercentage: number
}

export function useCancellationSettings() {
  const [settings, setSettings] = useState<CancellationSettings>({
    freeCancellationMinutes: 10,
    cancellationFeePercentage: 20,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings/cancellation')
      if (!response.ok) {
        throw new Error('Failed to fetch cancellation settings')
      }
      
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching cancellation settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const canCancelFree = (tripCreatedAt: string | Date): boolean => {
    const now = new Date()
    const created = new Date(tripCreatedAt)
    const minutesDifference = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    return minutesDifference <= settings.freeCancellationMinutes
  }

  const getCancellationFee = (tripPrice: number, tripCreatedAt: string | Date): number => {
    if (canCancelFree(tripCreatedAt)) {
      return 0
    }
    return (tripPrice * settings.cancellationFeePercentage) / 100
  }

  const getTimeRemaining = (tripCreatedAt: string | Date): number => {
    const now = new Date()
    const created = new Date(tripCreatedAt)
    const minutesDifference = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    return Math.max(0, settings.freeCancellationMinutes - minutesDifference)
  }

  return {
    settings,
    loading,
    error,
    canCancelFree,
    getCancellationFee,
    getTimeRemaining,
    refetch: fetchSettings,
  }
}
