import { useState, useEffect } from 'react';

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  domain: string;
  logo: string;
  // Commercial Registration Info
  commercialRegister: string;
  unifiedCommercialRegister: string;
  unifiedNumber: string;
  // National Address
  shortNationalAddress: string;
  buildingNumber: string;
  subNumber: string;
  postalCode: string;
  district: string;
  street: string;
  fullNationalAddress: string;
}

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/settings/public');
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo(data.companyInfo);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, []);

  return { companyInfo, loading };
}
