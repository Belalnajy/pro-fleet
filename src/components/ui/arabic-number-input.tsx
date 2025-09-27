"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { convertArabicToEnglishNumbers, normalizeNumberInput, hasArabicNumbers } from "@/lib/arabic-numbers"

export interface ArabicNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  allowDecimals?: boolean
  allowNegative?: boolean
  maxDecimals?: number
}

const ArabicNumberInput = React.forwardRef<HTMLInputElement, ArabicNumberInputProps>(
  ({ 
    className, 
    type = "text", 
    onChange, 
    onValueChange,
    allowDecimals = true,
    allowNegative = false,
    maxDecimals = 2,
    value,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(
      value ? String(value) : ''
    )

    // Update display value when external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(String(value))
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Convert Arabic numbers to English
      let normalizedValue = convertArabicToEnglishNumbers(inputValue)
      
      // Apply number formatting rules
      if (normalizedValue) {
        // Remove invalid characters
        let cleanValue = normalizedValue.replace(/[^\d.-]/g, '')
        
        // Handle decimal points
        if (!allowDecimals) {
          cleanValue = cleanValue.replace(/\./g, '')
        } else {
          // Allow only one decimal point
          const parts = cleanValue.split('.')
          if (parts.length > 2) {
            cleanValue = parts[0] + '.' + parts.slice(1).join('')
          }
          
          // Limit decimal places
          if (parts.length === 2 && parts[1].length > maxDecimals) {
            cleanValue = parts[0] + '.' + parts[1].substring(0, maxDecimals)
          }
        }
        
        // Handle negative sign
        if (!allowNegative) {
          cleanValue = cleanValue.replace(/-/g, '')
        } else {
          // Ensure minus sign is only at the beginning
          if (cleanValue.includes('-')) {
            const isNegative = cleanValue.charAt(0) === '-'
            cleanValue = cleanValue.replace(/-/g, '')
            if (isNegative) {
              cleanValue = '-' + cleanValue
            }
          }
        }
        
        normalizedValue = cleanValue
      }
      
      // Update display value
      setDisplayValue(normalizedValue)
      
      // Call onChange callbacks
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: normalizedValue
          }
        }
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
      }
      
      if (onValueChange) {
        onValueChange(normalizedValue)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
          // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          (e.keyCode === 90 && e.ctrlKey === true) ||
          // Allow: home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
        return
      }
      
      // Ensure that it is a number and stop the keypress
      const char = String.fromCharCode(e.keyCode)
      const isArabicDigit = /[٠-٩]/.test(char)
      const isEnglishDigit = /[0-9]/.test(char)
      const isDecimalPoint = char === '.' && allowDecimals
      const isMinusSign = char === '-' && allowNegative && displayValue.length === 0
      
      if (!isArabicDigit && !isEnglishDigit && !isDecimalPoint && !isMinusSign) {
        e.preventDefault()
      }
      
      // Prevent multiple decimal points
      if (isDecimalPoint && displayValue.includes('.')) {
        e.preventDefault()
      }
      
      // Call original onKeyDown if provided
      if (props.onKeyDown) {
        props.onKeyDown(e)
      }
    }

    return (
      <input
        type="text"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
ArabicNumberInput.displayName = "ArabicNumberInput"

export { ArabicNumberInput }
