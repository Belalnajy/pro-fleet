"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return children with default theme during SSR to prevent hydration mismatch
    return <div className="light">{children}</div>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}