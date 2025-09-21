"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Truck,
  Clock,
  Zap
} from "lucide-react";

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp?: Date;
  speed?: number;
  heading?: number;
}

interface EnhancedLiveTrackingMapProps {
  driverId?: string;
  tripId?: string;
  currentLocation?: LocationPoint | null;
  start?: LocationPoint;
  destination?: LocationPoint;
  routePoints?: LocationPoint[];
  height?: string;
  initialZoom?: number;
  showPathTrail?: boolean;
  showRecenterButton?: boolean;
  onLocationUpdate?: (location: LocationPoint) => void;
  className?: string;
}

export default function EnhancedLiveTrackingMap({
  driverId,
  tripId,
  currentLocation,
  start,
  destination,
  routePoints = [],
  height = "400px",
  initialZoom = 12,
  showPathTrail = true,
  showRecenterButton = true,
  onLocationUpdate,
  className = ""
}: EnhancedLiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [LRef, setLRef] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const pathPolylineRef = useRef<any>(null);
  const trailPolylineRef = useRef<any>(null);
  const [trail, setTrail] = useState<LocationPoint[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamically load Leaflet on client only
    if (!LRef) {
      import("leaflet").then((mod) => {
        const L = mod.default ?? (mod as any);
        setLRef(L);

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Initialize map
        if (!mapRef.current) return;
        
        const mapInstance = L.map(mapRef.current, {
          center: currentLocation ? [currentLocation.lat, currentLocation.lng] : [24.7136, 46.6753], // Riyadh default
          zoom: initialZoom,
          zoomControl: true,
          attributionControl: false
        });

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        setMap(mapInstance);
        setMapReady(true);
      });
    }

    return () => {
      // Clean up all map layers and markers
      if (map) {
        if (driverMarkerRef.current) {
          map.removeLayer(driverMarkerRef.current);
        }
        if (startMarkerRef.current) {
          map.removeLayer(startMarkerRef.current);
        }
        if (destMarkerRef.current) {
          map.removeLayer(destMarkerRef.current);
        }
        if (pathPolylineRef.current) {
          map.removeLayer(pathPolylineRef.current);
        }
        if (trailPolylineRef.current) {
          map.removeLayer(trailPolylineRef.current);
        }
        map.remove();
      }
    };
  }, [LRef, initialZoom]);

  // Update driver marker when location changes
  useEffect(() => {
    if (!map || !LRef || !currentLocation) return;

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }

    // Create custom driver icon
    const driverIcon = LRef.divIcon({
      html: `
        <div class="relative">
          <div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
        </div>
      `,
      className: 'driver-marker',
      iconSize: [32, 40],
      iconAnchor: [16, 40]
    });

    // Add new driver marker
    const marker = LRef.marker([currentLocation.lat, currentLocation.lng], {
      icon: driverIcon,
      title: `السائق - آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}`
    }).addTo(map);

    // Add popup with driver info
    const popupContent = `
      <div class="text-center p-2">
        <div class="flex items-center justify-center mb-2">
          <svg class="w-5 h-5 text-blue-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
          </svg>
          <strong>موقع السائق</strong>
        </div>
        <div class="text-sm text-gray-600 space-y-1">
          <div>📍 ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}</div>
          ${currentLocation.speed !== undefined ? `<div>🚗 السرعة: ${Math.round(currentLocation.speed * 3.6)} كم/س</div>` : ''}
          <div>🕐 ${new Date().toLocaleTimeString('ar-SA')}</div>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    driverMarkerRef.current = marker;

    // Update trail if enabled
    if (showPathTrail) {
      setTrail(prev => {
        const newTrail = [...prev, currentLocation];
        // Keep only last 50 points to avoid performance issues
        return newTrail.slice(-50);
      });
    }

    setLastUpdate(new Date());

    // Call callback if provided
    if (onLocationUpdate) {
      onLocationUpdate(currentLocation);
    }
  }, [map, LRef, currentLocation, showPathTrail, onLocationUpdate]);

  // Update start marker
  useEffect(() => {
    if (!map || !LRef || !start) return;

    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }

    const startIcon = LRef.divIcon({
      html: `
        <div class="w-6 h-6 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      className: 'start-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = LRef.marker([start.lat, start.lng], {
      icon: startIcon,
      title: 'نقطة البداية'
    }).addTo(map);

    marker.bindPopup('<div class="text-center"><strong>🟢 نقطة البداية</strong></div>');
    startMarkerRef.current = marker;
  }, [map, LRef, start]);

  // Update destination marker
  useEffect(() => {
    if (!map || !LRef || !destination) return;

    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    const destIcon = LRef.divIcon({
      html: `
        <div class="w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      className: 'dest-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = LRef.marker([destination.lat, destination.lng], {
      icon: destIcon,
      title: 'الوجهة'
    }).addTo(map);

    marker.bindPopup('<div class="text-center"><strong>🔴 الوجهة</strong></div>');
    destMarkerRef.current = marker;
  }, [map, LRef, destination]);

  // Update route path
  useEffect(() => {
    if (!map || !LRef) return;

    // Clean up existing polyline
    if (pathPolylineRef.current) {
      map.removeLayer(pathPolylineRef.current);
      pathPolylineRef.current = null;
    }

    let newPolyline = null;

    // Add custom route points if provided (priority over simple route)
    if (routePoints.length > 0) {
      newPolyline = LRef.polyline(
        routePoints.map(point => [point.lat, point.lng]),
        {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 5'
        }
      ).addTo(map);
    }
    // Create route line between start and destination if both exist and no custom route
    else if (start && destination) {
      newPolyline = LRef.polyline(
        [[start.lat, start.lng], [destination.lat, destination.lng]],
        {
          color: '#6366f1',
          weight: 3,
          opacity: 0.6,
          dashArray: '10, 5'
        }
      ).addTo(map);
    }

    if (newPolyline) {
      pathPolylineRef.current = newPolyline;
    }
  }, [map, LRef, routePoints, start, destination]);

  // Update trail
  useEffect(() => {
    if (!map || !LRef || !showPathTrail || trail.length < 2) return;

    // Clean up existing trail polyline
    if (trailPolylineRef.current) {
      map.removeLayer(trailPolylineRef.current);
      trailPolylineRef.current = null;
    }

    const polyline = LRef.polyline(
      trail.map(point => [point.lat, point.lng]),
      {
        color: '#ef4444',
        weight: 3,
        opacity: 0.8
      }
    ).addTo(map);

    trailPolylineRef.current = polyline;
  }, [map, LRef, trail, showPathTrail]);

  // Recenter map to current location
  const recenterMap = () => {
    if (!map || !currentLocation) return;
    
    map.setView([currentLocation.lat, currentLocation.lng], initialZoom, {
      animate: true,
      duration: 1
    });
  };

  // Fit map to show all markers
  const fitToMarkers = () => {
    if (!map || !LRef) return;

    const bounds = LRef.latLngBounds([]);
    
    if (currentLocation) bounds.extend([currentLocation.lat, currentLocation.lng]);
    if (start) bounds.extend([start.lat, start.lng]);
    if (destination) bounds.extend([destination.lat, destination.lng]);
    
    // Include trail points if available
    if (trail.length > 0) {
      trail.forEach(point => bounds.extend([point.lat, point.lng]));
    }
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        className={`relative overflow-hidden rounded-lg border ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none' 
            : ''
        }`}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        {/* Map */}
        <div ref={mapRef} className="w-full h-full" />

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {showRecenterButton && currentLocation && (
            <Button
              size="sm"
              variant="secondary"
              onClick={recenterMap}
              className="bg-white/90 hover:bg-white shadow-lg"
              title="توسيط الخريطة على الموقع الحالي"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="secondary"
            onClick={fitToMarkers}
            className="bg-white/90 hover:bg-white shadow-lg"
            title="عرض جميع النقاط"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={toggleFullscreen}
            className="bg-white/90 hover:bg-white shadow-lg"
            title={isFullscreen ? "تصغير الخريطة" : "تكبير الخريطة"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Status Overlay */}
        <div className="absolute top-4 left-4">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  {currentLocation ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-medium">متصل</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 font-medium">غير متصل</span>
                    </>
                  )}
                </div>
                
                {lastUpdate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{lastUpdate.toLocaleTimeString('ar-SA')}</span>
                  </div>
                )}
              </div>
              
              {currentLocation && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div>📍 {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}</div>
                  {currentLocation.speed !== undefined && (
                    <div>🚗 {Math.round(currentLocation.speed * 3.6)} كم/س</div>
                  )}
                  {trail.length > 0 && (
                    <div>📊 {trail.length} نقطة مُتتبعة</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loading Overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {mapReady && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {currentLocation && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white"></div>
              <span>الموقع الحالي</span>
            </div>
          )}
          {start && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white"></div>
              <span>نقطة البداية</span>
            </div>
          )}
          {destination && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
              <span>الوجهة</span>
            </div>
          )}
          {(start || destination) && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-indigo-500" style={{borderStyle: 'dashed'}}></div>
              <span>خط المسار</span>
            </div>
          )}
          {showPathTrail && trail.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500"></div>
              <span>مسار التتبع</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
