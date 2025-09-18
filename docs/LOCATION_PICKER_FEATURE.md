# 🗺️ Location Picker Feature Documentation

## Overview
The Location Picker feature allows users to select trip start and end locations interactively from a map interface, providing a more intuitive and precise way to define trip routes compared to traditional dropdown city selection.

## Components

### 1. LocationPicker Component
**File:** `src/components/ui/location-picker.tsx`

Interactive map component that allows users to:
- Click on the map to select a location
- Search for locations by name or address
- Choose from predefined major cities
- Get current location using GPS
- View detailed location information

**Key Features:**
- 🗺️ Interactive Leaflet map with OpenStreetMap tiles
- 🔍 Location search functionality
- 📍 Predefined Saudi cities (Riyadh, Jeddah, Mecca, Medina, Dammam, Tabuk)
- 📱 Current location detection
- 🎯 Visual markers for origin (green) and destination (red)
- 📝 Location name input and address display

### 2. LocationSelector Component
**File:** `src/components/ui/location-selector.tsx`

Form-friendly wrapper component that:
- Displays selected location summary
- Provides edit button to open LocationPicker
- Shows coordinates and address information
- Integrates seamlessly with forms

**Visual Features:**
- 🟢 Green indicator for origin locations
- 🔴 Red indicator for destination locations
- 📋 Clean location summary cards
- ✏️ Easy edit functionality

## Integration Points

### 1. Admin Trips Page
**File:** `src/app/[locale]/admin/trips/page.tsx`

- Integrated LocationSelector components for origin and destination
- Fallback to traditional city dropdowns
- Updated form state to handle location data
- Modified API calls to support location-based trip creation

### 2. Customer Booking Page
**File:** `src/app/[locale]/customer/book-trip/page.tsx`

- Same LocationSelector integration as admin page
- Customer-friendly interface
- Maintains booking flow compatibility

### 3. API Endpoint
**File:** `src/app/api/trips/create-with-location/route.ts`

New API endpoint that:
- Accepts either city IDs or location coordinates
- Attempts to find/create city records from location names
- Stores location data in trip notes (temporary solution)
- Maintains backward compatibility

## Styling and UI

### CSS Files
- `src/styles/map.css` - Map-specific styles
- Enhanced modal dialogs with better spacing
- Responsive design for mobile and desktop
- RTL support for Arabic interface

### Design Features
- 🎨 Modern gradient backgrounds
- 📱 Responsive grid layouts
- 🖼️ Professional modal dialogs
- 🎯 Color-coded location indicators
- ✨ Smooth transitions and hover effects

## Usage Examples

### Basic Usage
```tsx
import { LocationSelector } from "@/components/ui/location-selector"

const [location, setLocation] = useState(null)

<LocationSelector
  label="نقطة البداية"
  placeholder="اختر نقطة البداية من الخريطة"
  value={location}
  onChange={setLocation}
  type="origin"
  required
/>
```

### Direct Map Usage
```tsx
import { LocationPicker } from "@/components/ui/location-picker"

<LocationPicker
  isOpen={showPicker}
  onClose={() => setShowPicker(false)}
  onLocationSelect={handleLocationSelect}
  title="اختيار نقطة البداية"
  type="origin"
/>
```

## Technical Details

### Dependencies
- `leaflet` - Map rendering library
- `react-leaflet` - React wrapper for Leaflet
- `lucide-react` - Icons
- `@radix-ui/react-dialog` - Modal dialogs

### Location Data Structure
```typescript
interface LocationData {
  lat: number
  lng: number
  address?: string
  name?: string
}
```

### Predefined Cities
The system includes coordinates for major Saudi cities:
- Riyadh: 24.7136, 46.6753
- Jeddah: 21.3891, 39.8579
- Mecca: 21.3891, 39.8579
- Medina: 24.5247, 39.5692
- Dammam: 26.4207, 50.0888
- Tabuk: 28.3998, 36.5700

## Testing

### Test Page
**File:** `src/app/test-location/page.tsx`

A dedicated test page that demonstrates:
- Location selection for both origin and destination
- Distance calculation between points
- Visual feedback and validation
- Reset functionality

**Access:** Visit `/test-location` to test the feature

## Future Enhancements

### Recommended Improvements
1. **Database Schema:** Add dedicated latitude/longitude fields to trips table
2. **Geocoding Service:** Integrate with Google Maps or similar for better address resolution
3. **Route Visualization:** Show route path between selected points
4. **Saved Locations:** Allow users to save frequently used locations
5. **Location History:** Remember recently selected locations
6. **Offline Maps:** Cache map tiles for offline usage

### Performance Optimizations
1. **Lazy Loading:** Load map components only when needed
2. **Tile Caching:** Implement map tile caching
3. **Debounced Search:** Reduce API calls during location search
4. **Component Memoization:** Optimize re-renders

## Troubleshooting

### Common Issues
1. **Map not loading:** Check internet connection and tile server availability
2. **Location not found:** Verify search query and try alternative spellings
3. **GPS not working:** Ensure location permissions are granted
4. **Styling issues:** Verify CSS imports and Leaflet CSS inclusion

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- 📱 Mobile browsers supported

## Security Considerations

### Data Privacy
- Location data is only stored when explicitly selected by user
- No automatic location tracking
- GPS usage requires user permission
- Location data can be cleared/reset at any time

### API Security
- Location data validation on server side
- Sanitization of user input
- Rate limiting on search endpoints (recommended)

## Accessibility

### Features
- Keyboard navigation support
- Screen reader compatible
- High contrast color schemes
- Proper ARIA labels
- Focus management in modals

### RTL Support
- Full Arabic/Urdu language support
- Right-to-left layout adjustments
- Proper text direction handling
- Cultural considerations in UI design

---

**Last Updated:** September 2024  
**Version:** 1.0.0  
**Maintainer:** Pro Fleet Development Team
