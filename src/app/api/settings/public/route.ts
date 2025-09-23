import { NextResponse } from "next/server";
import { getCompleteBusinessInfo } from "@/lib/system-settings";

// GET - Fetch public system settings (no authentication required)
export async function GET() {
  try {
    // Get complete business info from system settings
    const businessInfo = await getCompleteBusinessInfo();
    
    return NextResponse.json({
      companyInfo: businessInfo
    });
  } catch (error) {
    console.error("Error fetching public settings:", error);
    
    // Return default settings on error
    return NextResponse.json({
      companyInfo: {
        name: "PRO FLEET",
        email: "info@profleet.app",
        phone: "+966 53 997 7837",
        address: "الرياض، المملكة العربية السعودية",
        website: "www.profleet.app",
        domain: "profleet.app",
        logo: "/Website-Logo.png",
        commercialRegister: "4030522610",
        unifiedCommercialRegister: "7033220067",
        unifiedNumber: "8002440411",
        shortNationalAddress: "JENA7503",
        buildingNumber: "7503",
        subNumber: "2695",
        postalCode: "23621",
        district: "النعيم",
        street: "الأمير سلطان",
        fullNationalAddress: "رقم المبنى 7503 – الرقم الفرعي 2695\nالرمز البريدي 23621 – الحي النعيم\nالشارع الأمير سلطان"
      }
    });
  }
}
