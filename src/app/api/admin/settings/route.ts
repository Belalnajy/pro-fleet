import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { clearSettingsCache } from "@/lib/system-settings";

// System settings interface
interface SystemSettings {
  business: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
  };
  financial: {
    defaultTaxRate: number;
    enableVAT: boolean;
    vatRate: number;
    defaultCurrency: string;
    currencySymbol: string;
  };
  operations: {
    freeCancellationMinutes: number;
    cancellationFeePercentage: number;
  };
  tracking: {
    enableRealTimeTracking: boolean;
    trackingInterval: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
  system: {
    maintenanceMode: boolean;
  };
  localization: {
    defaultLanguage: string;
  };
}

// Default settings
const defaultSettings: SystemSettings = {
  business: {
    companyName: "PRO FLEET",
    companyEmail: "info@profleet.com",
    companyPhone: "+966 53 997 7837",
    companyAddress: "الرياض، المملكة العربية السعودية"
  },
  financial: {
    defaultTaxRate: 15,
    enableVAT: true,
    vatRate: 15,
    defaultCurrency: "SAR",
    currencySymbol: "ر.س"
  },
  operations: {
    freeCancellationMinutes: 30,
    cancellationFeePercentage: 10
  },
  tracking: {
    enableRealTimeTracking: true,
    trackingInterval: 30
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true
  },
  system: {
    maintenanceMode: false
  },
  localization: {
    defaultLanguage: "ar"
  }
};

// GET - Fetch system settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get settings from database - using key-value pairs
    const settingsRecords = await db.systemSetting.findMany({
      where: { isActive: true }
    });

    if (settingsRecords.length > 0) {
      // Convert key-value pairs to settings object
      const settings = JSON.parse(JSON.stringify(defaultSettings));

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

      return NextResponse.json(settings);
    } else {
      // Return default settings if no records exist
      return NextResponse.json(defaultSettings);
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings: SystemSettings = await request.json();

    // Convert nested settings object to key-value pairs for SystemSetting model
    const settingsEntries: Array<{
      key: string;
      value: string;
      isActive: boolean;
    }> = [];

    // Flatten nested settings
    Object.entries(settings).forEach(([section, sectionData]) => {
      if (typeof sectionData === "object" && sectionData !== null) {
        Object.entries(sectionData).forEach(([key, value]) => {
          let stringValue: string;

          if (typeof value === "object") {
            stringValue = JSON.stringify(value);
          } else {
            stringValue = String(value);
          }

          settingsEntries.push({
            key: `${section}.${key}`,
            value: stringValue,
            isActive: true
          });
        });
      } else {
        settingsEntries.push({
          key: section,
          value: String(sectionData),
          isActive: true
        });
      }
    });

    // Delete existing settings and create new ones (transaction)
    await db.$transaction(async (tx) => {
      // Delete all existing settings
      await tx.systemSetting.deleteMany({});

      // Create new settings
      await tx.systemSetting.createMany({
        data: settingsEntries
      });
    });

    // Clear the settings cache after successful update
    clearSettingsCache();

    return NextResponse.json({
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
