/**
 * Generate trip number with format: PRO-YYYYMMDD-sequential number
 * Example: PRO-20241224-001, PRO-20241224-002, etc.
 */
export function generateTripNumber(tripCount: number): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  
  const dateString = `${year}${month}${day}`
  const sequentialNumber = String(tripCount + 1).padStart(3, '0')
  
  return `PRO-${dateString}-${sequentialNumber}`
}

/**
 * Parse trip number to extract date and sequential number
 * @param tripNumber - Trip number in format PRO-20241224-001
 * @returns Object with date and number, or null if invalid format
 */
export function parseTripNumber(tripNumber: string): { date: string; number: number } | null {
  const match = tripNumber.match(/^PRO-(\d{8})-(\d{3})$/)
  if (!match) return null
  
  const dateString = match[1]
  const number = parseInt(match[2], 10)
  
  return {
    date: dateString,
    number
  }
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
