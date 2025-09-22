// Saudi cities coordinates mapping
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "الرياض": { lat: 24.7136, lng: 46.6753 },
  "جدة": { lat: 21.3891, lng: 39.8579 },
  "مكة المكرمة": { lat: 21.4225, lng: 39.8262 },
  "المدينة المنورة": { lat: 24.5247, lng: 39.5692 },
  "الدمام": { lat: 26.4207, lng: 50.0888 },
  "الخبر": { lat: 26.2172, lng: 50.1971 },
  "الطائف": { lat: 21.2703, lng: 40.4178 },
  "تبوك": { lat: 28.3998, lng: 36.5700 },
  "بريدة": { lat: 26.3260, lng: 43.9750 },
  "خميس مشيط": { lat: 18.3000, lng: 42.7300 },
  "حائل": { lat: 27.5114, lng: 41.7208 },
  "الهفوف": { lat: 25.3647, lng: 49.5747 },
  "الجبيل": { lat: 27.0174, lng: 49.6251 },
  "ينبع": { lat: 24.0934, lng: 38.0616 },
  "أبها": { lat: 18.2164, lng: 42.5053 },
  "نجران": { lat: 17.4924, lng: 44.1277 },
  "جازان": { lat: 16.9014, lng: 42.5511 },
  "عرعر": { lat: 30.9753, lng: 41.0381 },
  "سكاكا": { lat: 29.9697, lng: 40.2064 },
  "الباحة": { lat: 20.0129, lng: 41.4687 },
  "القطيف": { lat: 26.5205, lng: 50.0089 },
  "الأحساء": { lat: 25.4295, lng: 49.5906 },
  // English names
  "Riyadh": { lat: 24.7136, lng: 46.6753 },
  "Jeddah": { lat: 21.3891, lng: 39.8579 },
  "Mecca": { lat: 21.4225, lng: 39.8262 },
  "Medina": { lat: 24.5247, lng: 39.5692 },
  "Dammam": { lat: 26.4207, lng: 50.0888 },
  "Khobar": { lat: 26.2172, lng: 50.1971 },
  "Taif": { lat: 21.2703, lng: 40.4178 },
  "Tabuk": { lat: 28.3998, lng: 36.5700 },
  "Buraidah": { lat: 26.3260, lng: 43.9750 },
  "Khamis Mushait": { lat: 18.3000, lng: 42.7300 },
  "Hail": { lat: 27.5114, lng: 41.7208 },
  "Hofuf": { lat: 25.3647, lng: 49.5747 },
  "Jubail": { lat: 27.0174, lng: 49.6251 },
  "Yanbu": { lat: 24.0934, lng: 38.0616 },
  "Abha": { lat: 18.2164, lng: 42.5053 },
  "Najran": { lat: 17.4924, lng: 44.1277 },
  "Jazan": { lat: 16.9014, lng: 42.5511 },
  "Arar": { lat: 30.9753, lng: 41.0381 },
  "Sakaka": { lat: 29.9697, lng: 40.2064 },
  "Al Baha": { lat: 20.0129, lng: 41.4687 },
  "Qatif": { lat: 26.5205, lng: 50.0089 },
  "Al Ahsa": { lat: 25.4295, lng: 49.5906 }
}

// Get city coordinates by name
export function getCityCoordinates(cityName: string): { lat: number; lng: number } {
  if (!cityName) {
    return { lat: 24.7136, lng: 46.6753 } // Default to Riyadh
  }

  const coords = CITY_COORDINATES[cityName] || CITY_COORDINATES[cityName.trim()]
  if (coords) {
    return coords
  }
  
  // Try to find by partial match (case insensitive)
  const normalizedName = cityName.toLowerCase().trim()
  for (const [key, value] of Object.entries(CITY_COORDINATES)) {
    if (key.toLowerCase().includes(normalizedName) || normalizedName.includes(key.toLowerCase())) {
      return value
    }
  }
  
  // Default to Riyadh if city not found
  return { lat: 24.7136, lng: 46.6753 }
}
