 "use client"

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useValidation } from '@/hooks/useValidation'
import { useTranslation } from '@/hooks/useTranslation'
import { type ValidationRule } from '@/lib/validation'
import { cn } from '@/lib/utils'

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  validationRules?: ValidationRule
  onValidationChange?: (isValid: boolean, message?: string) => void
  showValidation?: boolean
}

export function ValidatedInput({
  label,
  validationRules,
  onValidationChange,
  showValidation = true,
  className,
  ...props
}: ValidatedInputProps) {
  const [value, setValue] = useState(props.value || '')
  const [validationMessage, setValidationMessage] = useState<string>()
  const [isValid, setIsValid] = useState(true)
  const [touched, setTouched] = useState(false)
  
  const { validate } = useValidation()
  const { t, dir } = useTranslation()

  useEffect(() => {
    if (validationRules && touched) {
      const result = validate(value, validationRules)
      setIsValid(result.isValid)
      setValidationMessage(result.message)
      onValidationChange?.(result.isValid, result.message)
    }
  }, [value, validationRules, touched, validate, onValidationChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    props.onChange?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    props.onBlur?.(e)
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label 
          htmlFor={props.id} 
          className={cn(
            "text-sm font-medium",
            dir === 'rtl' && "text-right"
          )}
        >
          {label}
          {validationRules?.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </Label>
      )}
      
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          className,
          !isValid && touched && "border-red-500 focus:border-red-500",
          dir === 'rtl' && "text-right"
        )}
        dir={dir}
      />
      
      {showValidation && validationMessage && touched && (
        <p className={cn(
          "text-sm text-red-500",
          dir === 'rtl' && "text-right"
        )}>
          {validationMessage}
        </p>
      )}
    </div>
  )
}

// Specialized input components
export function EmailInput(props: Omit<ValidatedInputProps, 'validationRules' | 'type'>) {
  const { t } = useTranslation()
  
  return (
    <ValidatedInput
      {...props}
      type="email"
      placeholder={props.placeholder || t('enterEmail')}
      validationRules={{
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }}
    />
  )
}

export function PasswordInput(props: Omit<ValidatedInputProps, 'validationRules' | 'type'>) {
  const { t } = useTranslation()
  
  return (
    <ValidatedInput
      {...props}
      type="password"
      placeholder={props.placeholder || t('enterPassword')}
      validationRules={{
        required: true,
        minLength: 8
      }}
    />
  )
}

export function PhoneInput(props: Omit<ValidatedInputProps, 'validationRules' | 'type'>) {
  const { t } = useTranslation()
  
  return (
    <ValidatedInput
      {...props}
      type="tel"
      placeholder={props.placeholder || t('enterPhone')}
      validationRules={{
        required: true,
        pattern: /^[\+]?[1-9][\d]{0,15}$/
      }}
    />
  )
}

export function RequiredInput(props: ValidatedInputProps) {
  return (
    <ValidatedInput
      {...props}
      validationRules={{
        required: true,
        ...props.validationRules
      }}
    />
  )
}
