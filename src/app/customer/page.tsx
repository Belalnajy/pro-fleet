"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Get preferred language from localStorage or default to 'en'
    const preferredLanguage = typeof window !== 'undefined' 
      ? localStorage.getItem('language') || 'en'
      : 'en'
    
    // Redirect to locale-prefixed customer page
    router.replace(`/${preferredLanguage}/customer`)
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
