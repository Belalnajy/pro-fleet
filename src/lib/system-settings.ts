import { db } from "@/lib/db";

// Default settings fallback
const DEFAULT_SETTINGS = {
  business: {
    companyName: "PRO FLEET",
    companyEmail: "info@profleet.app",
    companyPhone: "+966 53 997 7837",
    companyAddress: "الرياض، المملكة العربية السعودية",
    website: "www.profleet.app",
    domain: "profleet.app",
    companyLogo: "/Website-Logo.png",
    // Commercial Registration Info
    commercialRegister: "4030522610",
    unifiedCommercialRegister: "7033220067",
    unifiedNumber: "8002440411",
    // National Address
    shortNationalAddress: "JENA7503",
    buildingNumber: "7503",
    subNumber: "2695",
    postalCode: "23621",
    district: "النعيم",
    street: "الأمير سلطان",
    fullNationalAddress: "رقم المبنى 7503 – الرقم الفرعي 2695\nالرمز البريدي 23621 – الحي النعيم\nالشارع الأمير سلطان"
  },
  financial: {
    defaultTaxRate: 15,
    enableVAT: true,
    vatRate: 15,
    defaultCurrency: "SAR",
    currencySymbol: "ر.س"
  }
};

// Cache for settings to avoid repeated database calls
let settingsCache: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSystemSettings() {
  // Check if cache is still valid
  const now = Date.now();
  if (settingsCache && now - cacheTimestamp < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    // Get settings from database
    const settingsRecords = await db.systemSetting.findMany({
      where: { isActive: true }
    });

    if (settingsRecords.length > 0) {
      // Convert key-value pairs to settings object
      const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

      settingsRecords.forEach((record) => {
        const keyParts = record.key.split(".");
        let value: any = record.value;

        // Parse JSON strings for complex types
        try {
          if (value.startsWith("{") || value.startsWith("[")) {
            value = JSON.parse(value);
          } else if (value === "true" || value === "false") {
            value = value === "true";
          } else if (!isNaN(Number(value))) {
            value = Number(value);
          }
        } catch {
          // Keep as string if parsing fails
        }

        // Set nested value
        if (keyParts.length === 2) {
          const [section, key] = keyParts;
          if (settings[section]) {
            settings[section][key] = value;
          }
        } else {
          settings[record.key] = value;
        }
      });

      // Update cache
      settingsCache = settings;
      cacheTimestamp = now;

      return settings;
    } else {
      // Return default settings if no records exist
      settingsCache = DEFAULT_SETTINGS;
      cacheTimestamp = now;
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error("Error fetching system settings:", error);
    // Return default settings on error
    return DEFAULT_SETTINGS;
  }
}

// Helper functions for commonly used settings
export async function getCompanyPhone(): Promise<string> {
  const settings = await getSystemSettings();
  return settings.business.companyPhone;
}

export async function getCompanyInfo() {
  const settings = await getSystemSettings();
  return {
    name: settings.business.companyName,
    email: settings.business.companyEmail,
    phone: settings.business.companyPhone,
    address: settings.business.companyAddress,
    website: settings.business.website,
    domain: settings.business.domain,
    logo: settings.business.companyLogo
  };
}

export async function getBusinessRegistrationInfo() {
  const settings = await getSystemSettings();
  return {
    commercialRegister: settings.business.commercialRegister,
    unifiedCommercialRegister: settings.business.unifiedCommercialRegister,
    unifiedNumber: settings.business.unifiedNumber
  };
}

export async function getNationalAddressInfo() {
  const settings = await getSystemSettings();
  return {
    shortNationalAddress: settings.business.shortNationalAddress,
    buildingNumber: settings.business.buildingNumber,
    subNumber: settings.business.subNumber,
    postalCode: settings.business.postalCode,
    district: settings.business.district,
    street: settings.business.street,
    fullNationalAddress: settings.business.fullNationalAddress
  };
}

export async function getCompleteBusinessInfo() {
  const settings = await getSystemSettings();
  return {
    // Basic company info
    name: settings.business.companyName,
    email: settings.business.companyEmail,
    phone: settings.business.companyPhone,
    address: settings.business.companyAddress,
    website: settings.business.website,
    domain: settings.business.domain,
    logo: settings.business.companyLogo,
    // Registration info
    commercialRegister: settings.business.commercialRegister,
    unifiedCommercialRegister: settings.business.unifiedCommercialRegister,
    unifiedNumber: settings.business.unifiedNumber,
    // National Address
    shortNationalAddress: settings.business.shortNationalAddress,
    buildingNumber: settings.business.buildingNumber,
    subNumber: settings.business.subNumber,
    postalCode: settings.business.postalCode,
    district: settings.business.district,
    street: settings.business.street,
    fullNationalAddress: settings.business.fullNationalAddress
  };
}

// Update a single system setting
export async function updateSystemSetting(key: string, value: string) {
  try {
    await db.systemSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        isActive: true
      }
    });
    
    // Clear cache to ensure fresh data
    clearSettingsCache();
    
    return true;
  } catch (error) {
    console.error('Error updating system setting:', error);
    throw error;
  }
}

export async function getFinancialSettings() {
  const settings = await getSystemSettings();
  return settings.financial;
}

// Clear cache function (useful when settings are updated)
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
}
