import { translations, type Language, type TranslationKey } from './translations'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  custom?: (value: any) => boolean
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}

export class Validator {
  private language: Language
  private t: (key: TranslationKey) => string

  constructor(language: Language) {
    this.language = language
    this.t = (key: TranslationKey) => translations[language][key] || translations.en[key] || key
  }

  validate(value: any, rules: ValidationRule): ValidationResult {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return { isValid: false, message: this.t('required') }
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: true }
    }

    const stringValue = String(value)

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      return { 
        isValid: false, 
        message: this.t('minLength').replace('{min}', String(rules.minLength))
      }
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return { 
        isValid: false, 
        message: this.t('maxLength').replace('{max}', String(rules.maxLength))
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return { isValid: false, message: this.getPatternMessage(rules.pattern) }
    }

    // Numeric validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value)
      
      if (rules.min !== undefined && numValue < rules.min) {
        return { 
          isValid: false, 
          message: this.t('mustBeGreaterThan').replace('{min}', String(rules.min))
        }
      }

      if (rules.max !== undefined && numValue > rules.max) {
        return { 
          isValid: false, 
          message: this.t('mustBeLessThan').replace('{max}', String(rules.max))
        }
      }
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      return { isValid: false, message: this.t('invalidNumber') }
    }

    return { isValid: true }
  }

  private getPatternMessage(pattern: RegExp): string {
    // Common pattern messages
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/

    if (pattern.toString() === emailPattern.toString()) {
      return this.t('invalidEmail')
    }

    if (pattern.toString() === phonePattern.toString()) {
      return this.t('invalidPhone')
    }

    return this.t('invalidNumber')
  }

  // Common validation methods
  validateEmail(email: string): ValidationResult {
    return this.validate(email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    })
  }

  validatePhone(phone: string): ValidationResult {
    return this.validate(phone, {
      required: true,
      pattern: /^[\+]?[1-9][\d]{0,15}$/
    })
  }

  validatePassword(password: string): ValidationResult {
    return this.validate(password, {
      required: true,
      minLength: 8
    })
  }

  validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
    if (password !== confirmPassword) {
      return { isValid: false, message: this.t('passwordsDoNotMatch') }
    }
    return { isValid: true }
  }

  validateRequired(value: any): ValidationResult {
    return this.validate(value, { required: true })
  }

  validatePositiveNumber(value: number): ValidationResult {
    if (value <= 0) {
      return { isValid: false, message: this.t('mustBePositive') }
    }
    return { isValid: true }
  }
}

// Helper function to create validator instance
export function createValidator(language: Language): Validator {
  return new Validator(language)
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  url: /^https?:\/\/.+/,
  number: /^\d+$/,
  decimal: /^\d+\.?\d*$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  arabicText: /^[\u0600-\u06FF\s]+$/,
  urduText: /^[\u0600-\u06FF\u0750-\u077F\s]+$/,
} as const
