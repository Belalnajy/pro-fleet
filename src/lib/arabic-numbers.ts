/**
 * Utility functions for handling Arabic numbers
 */

/**
 * Convert Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) to Western digits (0123456789)
 * @param input - String containing Arabic-Indic digits
 * @returns String with Western digits
 */
export function convertArabicToEnglishNumbers(input: string): string {
  if (!input) return input;
  
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = input;
  
  for (let i = 0; i < arabicNumbers.length; i++) {
    const arabicRegex = new RegExp(arabicNumbers[i], 'g');
    result = result.replace(arabicRegex, englishNumbers[i]);
  }
  
  return result;
}

/**
 * Convert Western digits to Arabic-Indic digits for display
 * @param input - String containing Western digits
 * @returns String with Arabic-Indic digits
 */
export function convertEnglishToArabicNumbers(input: string): string {
  if (!input) return input;
  
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = input;
  
  for (let i = 0; i < englishNumbers.length; i++) {
    const englishRegex = new RegExp(englishNumbers[i], 'g');
    result = result.replace(englishRegex, arabicNumbers[i]);
  }
  
  return result;
}

/**
 * Check if a string contains Arabic-Indic digits
 * @param input - String to check
 * @returns boolean indicating if Arabic digits are present
 */
export function hasArabicNumbers(input: string): boolean {
  if (!input) return false;
  return /[٠-٩]/.test(input);
}

/**
 * Normalize number input by converting Arabic digits to English
 * and ensuring it's a valid number format
 * @param input - Raw input string
 * @returns Normalized number string
 */
export function normalizeNumberInput(input: string): string {
  if (!input) return '';
  
  // Convert Arabic digits to English
  let normalized = convertArabicToEnglishNumbers(input);
  
  // Remove any non-numeric characters except decimal point and minus sign
  normalized = normalized.replace(/[^\d.-]/g, '');
  
  // Ensure only one decimal point
  const parts = normalized.split('.');
  if (parts.length > 2) {
    normalized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Ensure minus sign is only at the beginning
  if (normalized.includes('-')) {
    const isNegative = normalized.charAt(0) === '-';
    normalized = normalized.replace(/-/g, '');
    if (isNegative) {
      normalized = '-' + normalized;
    }
  }
  
  return normalized;
}

/**
 * Format number for display in Arabic locale
 * @param value - Number value
 * @param options - Formatting options
 * @returns Formatted string with Arabic digits
 */
export function formatNumberForArabic(
  value: number | string, 
  options: {
    useArabicDigits?: boolean;
    decimals?: number;
    currency?: string;
  } = {}
): string {
  const { useArabicDigits = true, decimals = 2, currency } = options;
  
  if (!value && value !== 0) return '';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  
  let formatted = numValue.toFixed(decimals);
  
  // Add currency if provided
  if (currency) {
    formatted = `${formatted} ${currency}`;
  }
  
  // Convert to Arabic digits if requested
  if (useArabicDigits) {
    formatted = convertEnglishToArabicNumbers(formatted);
  }
  
  return formatted;
}

/**
 * Parse number input that may contain Arabic digits
 * @param input - Input string
 * @returns Parsed number or NaN if invalid
 */
export function parseArabicNumber(input: string): number {
  if (!input) return NaN;
  
  const normalized = normalizeNumberInput(input);
  return parseFloat(normalized);
}

/**
 * Validate if input is a valid number (including Arabic digits)
 * @param input - Input string
 * @returns boolean indicating if input is a valid number
 */
export function isValidNumber(input: string): boolean {
  if (!input) return false;
  
  const normalized = normalizeNumberInput(input);
  return !isNaN(parseFloat(normalized)) && isFinite(parseFloat(normalized));
}
