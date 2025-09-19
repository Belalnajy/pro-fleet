import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// System settings interface
interface SystemSettings {
  defaultTaxRate: number
  vatEnabled: boolean
  vatRate: number
  freeCancellationMinutes: number
  cancellationFeePercentage: number
  temperatureOptions: Array<{ value: string; label: string; price: number }>
  trackingEnabled: boolean
  trackingInterval: number
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyLogo: string
  maintenanceMode: boolean
  allowRegistration: boolean
  requireEmailVerification: boolean
  sessionTimeout: number
  defaultCurrency: string
  currencySymbol: string
  defaultLanguage: string
  supportedLanguages: string[]
}

// Default settings
const defaultSettings: SystemSettings = {
  defaultTaxRate: 15,
  vatEnabled: true,
  vatRate: 15,
  freeCancellationMinutes: 15,
  cancellationFeePercentage: 10,
  temperatureOptions: [
    { value: "ambient", label: "Ambient", price: 0 },
    { value: "cold_2", label: "+2°C", price: 50 },
    { value: "cold_10", label: "+10°C", price: 100 },
    { value: "custom", label: "Custom", price: 150 },
  ],
  trackingEnabled: true,
  trackingInterval: 30,
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  companyName: "PRO FLEET",
  companyAddress: "الرياض، المملكة العربية السعودية",
  companyPhone: "+966 11 123 4567",
  companyEmail: "info@profleet.com",
  companyLogo: "",
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: true,
  sessionTimeout: 30,
  defaultCurrency: "SAR",
  currencySymbol: "ر.س",
  defaultLanguage: "ar",
  supportedLanguages: ["en", "ar", "ur"],
}

// GET - Fetch system settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to get settings from database - using key-value pairs
    const settingsRecords = await db.systemSetting.findMany({
      where: { isActive: true }
    })
    
    if (settingsRecords.length > 0) {
      // Convert key-value pairs to settings object
      const settings = { ...defaultSettings }
      
      settingsRecords.forEach(record => {
        const key = record.key as keyof SystemSettings
        let value: any = record.value
        
        // Parse JSON strings for complex types
        if (key === 'temperatureOptions' || key === 'supportedLanguages') {
          try {
            value = JSON.parse(value)
          } catch {
            value = key === 'temperatureOptions' ? defaultSettings.temperatureOptions : defaultSettings.supportedLanguages
          }
        } else if (typeof defaultSettings[key] === 'number') {
          value = parseFloat(value) || defaultSettings[key]
        } else if (typeof defaultSettings[key] === 'boolean') {
          value = value === 'true'
        }
        
        ;(settings as any)[key] = value
      })
      
      return NextResponse.json(settings)
    } else {
      // Return default settings if no records exist
      return NextResponse.json(defaultSettings)
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings: SystemSettings = await request.json()

    // Convert settings object to key-value pairs for SystemSetting model
    const settingsEntries = Object.entries(settings).map(([key, value]) => {
      let stringValue: string
      
      if (typeof value === 'object') {
        stringValue = JSON.stringify(value)
      } else {
        stringValue = String(value)
      }
      
      return {
        key,
        value: stringValue,
        isActive: true,
      }
    })

    // Delete existing settings and create new ones (transaction)
    await db.$transaction(async (tx) => {
      // Delete all existing settings
      await tx.systemSetting.deleteMany({})
      
      // Create new settings
      await tx.systemSetting.createMany({
        data: settingsEntries,
      })
    })

    return NextResponse.json({ 
      message: "Settings updated successfully"
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
