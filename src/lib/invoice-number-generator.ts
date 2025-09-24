/**
 * Generate invoice number with format: PRO-INV- + YYYYMMDD + sequential number
 * Example: PRO-INV-20241224001, PRO-INV-20241224002, etc.
 */
export function generateInvoiceNumber(invoiceCount: number): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  const dateString = `${year}${month}${day}`
  const sequentialNumber = String(invoiceCount + 1).padStart(3, '0')
  
  return `PRO-INV-${dateString}${sequentialNumber}`
}

/**
 * Generate customs clearance invoice number with format: PRO-CLR- + YYYYMMDD + sequential number
 * Example: PRO-CLR-20241224001, PRO-CLR-20241224002, etc.
 */
export function generateClearanceInvoiceNumber(clearanceInvoiceCount: number): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  const dateString = `${year}${month}${day}`
  const sequentialNumber = String(clearanceInvoiceCount + 1).padStart(3, '0')
  
  return `PRO-CLR-${dateString}${sequentialNumber}`
}

/**
 * Parse invoice number to extract date and sequential number
 * @param invoiceNumber - Invoice number in format PRO-INV-20241224001 or PRO-CLR-20241224001
 * @returns Object with type, date and number, or null if invalid format
 */
export function parseInvoiceNumber(invoiceNumber: string): { 
  type: 'regular' | 'clearance'; 
  date: string; 
  number: number 
} | null {
  // Check for regular invoice format
  const regularMatch = invoiceNumber.match(/^PRO-INV-(\d{8})(\d{3})$/)
  if (regularMatch) {
    return {
      type: 'regular',
      date: regularMatch[1],
      number: parseInt(regularMatch[2], 10)
    }
  }
  
  // Check for clearance invoice format
  const clearanceMatch = invoiceNumber.match(/^PRO-CLR-(\d{8})(\d{3})$/)
  if (clearanceMatch) {
    return {
      type: 'clearance',
      date: clearanceMatch[1],
      number: parseInt(clearanceMatch[2], 10)
    }
  }
  
  return null
}

/**
 * Get today's date string in YYYYMMDD format
 */
export function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  return `${year}${month}${day}`
}
