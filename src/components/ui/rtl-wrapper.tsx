"use client"

import React from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { cn } from "@/lib/utils"

interface RTLWrapperProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function RTLWrapper({ 
  children, 
  className, 
  as: Component = "div" 
}: RTLWrapperProps) {
  const { language } = useLanguage()
  const isRTL = language === 'ar' || language === 'ur'
  
  return (
    <Component 
      className={cn(
        isRTL && "rtl-container",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {children}
    </Component>
  )
}

// Utility function to get RTL-aware classes
export function getRTLClass(ltrClass: string, rtlClass?: string): string {
  // This will be used with CSS-in-JS or conditional classes
  return rtlClass || ltrClass
}

// Hook for RTL-aware styling
export function useRTL() {
  const { language } = useLanguage()
  const isRTL = language === 'ar' || language === 'ur'
  
  return {
    isRTL,
    dir: isRTL ? "rtl" : "ltr",
    textAlign: isRTL ? "right" : "left",
    marginLeft: (value: string) => isRTL ? { marginRight: value } : { marginLeft: value },
    marginRight: (value: string) => isRTL ? { marginLeft: value } : { marginRight: value },
    paddingLeft: (value: string) => isRTL ? { paddingRight: value } : { paddingLeft: value },
    paddingRight: (value: string) => isRTL ? { paddingLeft: value } : { paddingRight: value },
    flexDirection: (direction: "row" | "row-reverse") => 
      isRTL && direction === "row" ? "row-reverse" : 
      isRTL && direction === "row-reverse" ? "row" : direction,
    justifyContent: (justify: "flex-start" | "flex-end" | "center" | "space-between" | "space-around") =>
      isRTL && justify === "flex-start" ? "flex-end" :
      isRTL && justify === "flex-end" ? "flex-start" : justify
  }
}

// RTL-aware class names utility
export function rtlClass(baseClass: string, rtlOverride?: string) {
  return `${baseClass} ${rtlOverride || ''}`
}
