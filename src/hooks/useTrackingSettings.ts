import { useState, useEffect } from 'react'

export function useTrackingSettings() {
  const [trackingEnabled, setTrackingEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  const checkTrackingSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/tracking')
      
      if (response.ok) {
        const data = await response.json()
        setTrackingEnabled(data.trackingEnabled)
      } else {
        // Default to enabled if API fails
        setTrackingEnabled(true)
      }
    } catch (error) {
      console.error('Error checking tracking settings:', error)
      // Default to enabled on error
      setTrackingEnabled(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkTrackingSettings()
  }, [])

  return {
    trackingEnabled,
    loading,
    refresh: checkTrackingSettings,
  }
}
