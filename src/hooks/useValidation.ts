"use client"

import { useMemo } from 'react'
import { useLanguage } from '@/components/providers/language-provider'
import { createValidator, type ValidationRule, type ValidationResult } from '@/lib/validation'

export function useValidation() {
  const { language } = useLanguage()
  
  const validator = useMemo(() => createValidator(language), [language])

  return {
    validate: (value: any, rules: ValidationRule): ValidationResult => 
      validator.validate(value, rules),
    
    validateEmail: (email: string): ValidationResult => 
      validator.validateEmail(email),
    
    validatePhone: (phone: string): ValidationResult => 
      validator.validatePhone(phone),
    
    validatePassword: (password: string): ValidationResult => 
      validator.validatePassword(password),
    
    validateConfirmPassword: (password: string, confirmPassword: string): ValidationResult => 
      validator.validateConfirmPassword(password, confirmPassword),
    
    validateRequired: (value: any): ValidationResult => 
      validator.validateRequired(value),
    
    validatePositiveNumber: (value: number): ValidationResult => 
      validator.validatePositiveNumber(value),
  }
}
