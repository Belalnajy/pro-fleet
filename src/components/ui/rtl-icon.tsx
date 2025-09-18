"use client"

import React from "react"
import { useRTL } from "./rtl-wrapper"
import { cn } from "@/lib/utils"

interface RTLIconProps {
  children: React.ReactNode
  className?: string
  position?: "left" | "right"
}

export function RTLIcon({ children, className, position = "left" }: RTLIconProps) {
  const { isRTL } = useRTL()
  
  const getMarginClass = () => {
    if (position === "left") {
      return isRTL ? "ml-2" : "mr-2"
    } else {
      return isRTL ? "mr-2" : "ml-2"
    }
  }
  
  return (
    <span className={cn(getMarginClass(), className)}>
      {children}
    </span>
  )
}

// Utility component for buttons with icons
interface RTLButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  className?: string
  onClick?: () => void
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
}

export function RTLButton({ 
  children, 
  icon, 
  iconPosition = "left", 
  className,
  onClick,
  ...props 
}: RTLButtonProps) {
  const { isRTL } = useRTL()
  
  const iconElement = icon && (
    <RTLIcon position={iconPosition}>
      {icon}
    </RTLIcon>
  )
  
  return (
    <button 
      className={cn(
        "flex items-center",
        isRTL ? "flex-row-reverse" : "flex-row",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {iconPosition === "left" && iconElement}
      {children}
      {iconPosition === "right" && iconElement}
    </button>
  )
}
