"use client"

import { ReactNode, Suspense } from "react"
import { Navigation } from "./navigation"
import { useLanguage } from "@/components/providers/language-provider"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  actions 
}: DashboardLayoutProps) {
  const { t, dir } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        {(title || subtitle || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 sm:mb-8 gap-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-48 sm:h-64">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  )
}