"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, Clock, Truck } from "lucide-react";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

interface TrackingPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface TripInfo {
  id: string;
  tripNumber: string;
  status: string;
  fromCity: string;
  toCity: string;
  vehicle: string;
  customer?: {
    name: string;
  };
  driver?: {
    name: string;
  };
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  name: string;
  type: 'start' | 'end';
}

interface TrackingMapProps {
  tripId?: string;
  showAllActiveTrips?: boolean;
  height?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  center?: [number, number] | null;
  showRoute?: boolean;
  adminMode?: boolean;
  customerMode?: boolean;
}

export function TrackingMap({
  tripId,
  showAllActiveTrips = false,
  height = "400px",
  autoRefresh = false,
  refreshInterval = 30000,
  center = null,
  showRoute = false,
  adminMode = false,
  customerMode = false,
}: TrackingMapProps) {
  const [trackingData, setTrackingData] = useState<{
    trips: Array<TripInfo & { trackingLogs: TrackingPoint[] }>;
    points: TrackingPoint[];
  }>({ trips: [], points: [] });
  const [routeData, setRouteData] = useState<{
    startPoint: RoutePoint | null;
    endPoint: RoutePoint | null;
    trackingPoints: TrackingPoint[];
    totalDistance: number;
    estimatedDuration: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (center && mapRef.current) {
      try {
        const currentZoom = mapRef.current.getZoom ? mapRef.current.getZoom() : 10;
        mapRef.current.setView(center, currentZoom, { animate: true });
      } catch (e) {
        // noop
      }
    }
  }, [center]);

  const fetchTrackingData = async () => {
    try {
      setError(null);
      
      // If showRoute is enabled and we have a tripId, fetch route data
      console.log('TrackingMap showRoute:', showRoute, 'tripId:', tripId);
      if (showRoute && tripId) {
        let routeApiUrl;
        if (adminMode) {
          routeApiUrl = `/api/admin/trips/${tripId}/route`;
        } else if (customerMode) {
          routeApiUrl = `/api/customer/trips/${tripId}/route`;
        } else {
          routeApiUrl = `/api/driver/trips/${tripId}/route`;
        }
        
        console.log('TrackingMap fetching route from:', routeApiUrl);
        const routeResponse = await fetch(routeApiUrl);
        console.log('TrackingMap route response status:', routeResponse.status);
        
        if (routeResponse.ok) {
          const routeData = await routeResponse.json();
          console.log('TrackingMap received route data:', routeData);
          
          // The API returns data in format: { success: true, trip: {...}, route: {...} }
          const route = routeData.route;
          
          if (route) {
            // Transform route data - API already returns correct structure
            const transformedRoute = {
              ...route,
              // API returns startPoint and endPoint directly
              startPoint: route.startPoint,
              endPoint: route.endPoint,
              trackingPoints: route.trackingPoints || []
            };
            
            setRouteData(transformedRoute);
            console.log('TrackingMap transformedRoute:', transformedRoute);
            
            // Create points array for tracking display
            const allPoints = [
              route.startPoint,
              ...(route.trackingPoints || []),
              route.endPoint
            ].filter(Boolean);
            
            setTrackingData({
              trips: [{
                ...routeData.trip,
                trackingLogs: route.trackingPoints || []
              }],
              points: allPoints
            });
            
            setLastUpdate(new Date());
            return;
          }
        }
      }
      
      // Fallback to regular tracking API
      let url;
      if (customerMode) {
        url = "/api/customer/tracking";
      } else if (adminMode) {
        url = "/api/admin/tracking";
      } else {
        url = "/api/tracking";
      }
      
      const params = new URLSearchParams();
      
      if (tripId) {
        params.append("tripId", tripId);
      }
      
      if (showAllActiveTrips) {
        params.append("activeOnly", "true");
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tracking data");
      }

      const data = await response.json();
      console.log('TrackingMap API Response:', data);
      
      // Transform data for map display
      const dataArray = customerMode ? (data.data || []) : (Array.isArray(data) ? data : []);
      console.log('TrackingMap dataArray:', dataArray);
      
      if (Array.isArray(dataArray)) {
        const trips = dataArray.map((item: any) => ({
          id: item.trip?.id || item.id,
          tripNumber: item.trip?.tripNumber || item.tripNumber,
          status: item.trip?.status || item.status,
          fromCity: item.trip?.fromCity || item.fromCity,
          toCity: item.trip?.toCity || item.toCity,
          vehicle: item.trip?.vehicle || item.vehicle,
          customer: item.customer,
          driver: item.driver,
          trackingLogs: item.trackingHistory || item.trackingLogs || [],
        }));
        
        const allPoints = trips.flatMap((trip: any) => 
          trip.trackingLogs.map((log: any) => ({
            ...log,
            tripId: trip.id,
            tripNumber: trip.tripNumber,
          }))
        );
        
        setTrackingData({ trips, points: allPoints });
      } else {
        // Single trip data
        const trip = {
          id: data.id,
          tripNumber: data.tripNumber,
          status: data.status,
          fromCity: data.fromCity,
          toCity: data.toCity,
          vehicle: data.vehicle,
          customer: data.customer,
          driver: data.driver,
          trackingLogs: data.trackingLogs || [],
        };
        
        const points = trip.trackingLogs.map((log: any) => ({
          ...log,
          tripId: trip.id,
          tripNumber: trip.tripNumber,
        }));
        
        setTrackingData({ trips: [trip], points });
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    // Load Leaflet CSS
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      setMapLoaded(true);
    }
  }, [tripId, showAllActiveTrips]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchTrackingData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "delivered":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "PENDING":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "PAID":
      case "paid":
        return "bg-green-100 text-green-800"
      case "ASSIGNED":
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "IN_TRANSIT":
      case "inTransit":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
      case "overdue":
        return "bg-red-100 text-red-800"
      case "IN_PROGRESS":
      case "inProgress":
        return "bg-blue-100 text-blue-800"
      case "EN_ROUTE_PICKUP":
      case "enRoutePickup":
        return "bg-blue-100 text-blue-800"
      case "AT_PICKUP":
      case "atPickup":
        return "bg-blue-100 text-blue-800"
      case "PICKED_UP":
      case "pickedUp":
        return "bg-blue-100 text-blue-800"
      case "AT_DESTINATION":
      case "atDestination":
        return "bg-blue-100 text-blue-800"
      case "SENT":
      case "sent":
        return "bg-blue-100 text-blue-800"
        
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate map center
  const getMapCenter = () => {
    // If we have route data with start/end points, use them
    if (routeData && routeData.startPoint && trackingData.points.length === 0) {
      // Center between start and end points
      const startLat = routeData.startPoint.latitude;
      const startLng = routeData.startPoint.longitude;
      const endLat = routeData.endPoint?.latitude || startLat;
      const endLng = routeData.endPoint?.longitude || startLng;
      
      return [
        (startLat + endLat) / 2,
        (startLng + endLng) / 2
      ];
    }
    
    if (trackingData.points.length === 0) {
      return [24.7136, 46.6753]; // Riyadh, Saudi Arabia
    }
    
    const latSum = trackingData.points.reduce((sum, point) => sum + point.latitude, 0);
    const lngSum = trackingData.points.reduce((sum, point) => sum + point.longitude, 0);
    
    return [
      latSum / trackingData.points.length,
      lngSum / trackingData.points.length
    ];
  };

  const createCustomIcon = (color: string = "red", emoji: string = "📍") => {
    if (typeof window === "undefined") return null;
    
    const L = require("leaflet");
    
    // Create a custom HTML icon with emoji and color
    const iconHtml = `
      <div style="
        background-color: ${getColorValue(color)};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
          line-height: 1;
        ">${emoji}</span>
      </div>
    `;
    
    return new L.DivIcon({
      html: iconHtml,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
      className: 'custom-marker-icon'
    });
  };

  const getColorValue = (color: string) => {
    const colors: { [key: string]: string } = {
      'red': '#ef4444',
      'green': '#22c55e', 
      'blue': '#3b82f6',
      'yellow': '#eab308',
      'orange': '#f97316',
      'purple': '#a855f7'
    };
    return colors[color] || colors['red'];
  };

  // Create current location icon with pulsing circle like Google Maps
  const createCurrentLocationIcon = () => {
    const iconHtml = `
      <div style="
        width: 20px;
        height: 20px;
        background: #1e40af;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -10px;
          left: -10px;
          width: 40px;
          height: 40px;
          border: 2px solid #1e40af;
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.7; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.7; }
        }
      </style>
    `;
    
    return new L.DivIcon({
      html: iconHtml,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
      className: 'current-location-icon'
    });
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">جاري تحميل بيانات التتبع...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <MapPin className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!mapLoaded || typeof window === "undefined") {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <Navigation className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  const mapCenter = getMapCenter();
  console.log('TrackingMap mapCenter:', mapCenter);
  console.log('TrackingMap routeData:', routeData);
  console.log('TrackingMap trackingData.points:', trackingData.points.length);
  
  // Adjust zoom based on available data
  let zoom = 6; // Default zoom for Saudi Arabia
  if (routeData && routeData.startPoint) {
    zoom = 8; // Medium zoom when we have route data
  }
  if (trackingData.points.length > 2) {
    zoom = 10; // Close zoom when we have tracking points
  }
  
  console.log('TrackingMap zoom:', zoom);

  return (
    <div className="space-y-4">
      {/* Real Map Container */}
      <div 
        className="relative rounded-lg overflow-hidden border"
        style={{ height }}
      >
        <MapContainer
          center={mapCenter as [number, number]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          ref={mapRef as any}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Only render current location from regular tracking points */}
          {trackingData.points.length > 0 && (() => {
            // Show only the latest tracking point (current location)
            const latestPoint = trackingData.points[trackingData.points.length - 1];
            const icon = createCurrentLocationIcon();
            
            return (
              <Marker
                key={`current-location-${latestPoint.id}-${latestPoint.latitude}-${latestPoint.longitude}`}
                position={[latestPoint.latitude, latestPoint.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-red-600">الموقع الحالي للسائق</div>
                    <div>📍 {latestPoint.latitude.toFixed(6)}, {latestPoint.longitude.toFixed(6)}</div>
                    <div>🕒 {formatTime(latestPoint.timestamp)}</div>
                    {latestPoint.speed && (
                      <div>🚗 {Math.round(latestPoint.speed * 3.6)} كم/س</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })()}
          
          {/* Draw route lines for each trip */}
          {trackingData.trips.map((trip) => {
            if (trip.trackingLogs.length < 2) return null;
            
            const routePoints = trip.trackingLogs.map(log => [log.latitude, log.longitude] as [number, number]);
            
            return (
              <Polyline
                key={`trip-route-${trip.id}`}
                positions={routePoints}
                color={trip.status === "IN_PROGRESS" ? "#22c55e" : "#3b82f6"}
                weight={3}
                opacity={0.7}
              />
            );
          })}
          
          {/* Route Start and End Points */}
          {routeData && (
            <>
              {/* Start Point */}
              {routeData.startPoint && (
                <Marker
                  position={[routeData.startPoint.latitude, routeData.startPoint.longitude]}
                  icon={createCustomIcon("green", "🚀")}
                >
                  <Popup>
                    <div className="text-center">
                      <div className="font-bold text-green-600">🚀 نقطة البداية</div>
                      <div className="font-medium">{routeData.startPoint.name}</div>
                      <div className="text-sm text-gray-600">
                        📍 {routeData.startPoint.latitude.toFixed(4)}, {routeData.startPoint.longitude.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* End Point */}
              {routeData.endPoint && (
                <Marker
                  position={[routeData.endPoint.latitude, routeData.endPoint.longitude]}
                  icon={createCustomIcon("red", "🏁")}
                >
                  <Popup>
                    <div className="text-center">
                      <div className="font-bold text-red-600">🏁 نقطة النهاية</div>
                      <div className="font-medium">{routeData.endPoint.name}</div>
                      <div className="text-sm text-gray-600">
                        📍 {routeData.endPoint.latitude.toFixed(4)}, {routeData.endPoint.longitude.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Route Tracking Points - Show only important points */}
              {routeData.trackingPoints && (() => {
                // Filter to show only start, end, and current location
                const importantPoints = routeData.trackingPoints.filter((point, index) => {
                  const pointType = (point as any).type;
                  // Show start, end, current, and every 3rd tracking point to reduce clutter
                  return pointType === 'start' || pointType === 'end' || pointType === 'current' || index % 3 === 0;
                });
                
                return importantPoints.map((point, index) => (
                  <Marker
                    key={`route-point-${point.id || index}-${point.latitude}-${point.longitude}`}
                    position={[point.latitude, point.longitude]}
                    icon={(point as any).type === 'current' ? 
                      createCurrentLocationIcon() : 
                      createCustomIcon('blue', '🔵')
                    }
                  >
                    <Popup>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">
                          {(point as any).type === 'current' ? '📍 الموقع الحالي' : '🔵 نقطة تتبع'}
                        </div>
                        <div className="text-sm text-gray-600">
                          📍 {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </div>
                        {point.timestamp && (
                          <div className="text-xs text-gray-500">
                            🕒 {formatTime(point.timestamp)}
                          </div>
                        )}
                        {point.speed && (
                          <div className="text-xs text-blue-600">
                            🚗 {Math.round(point.speed * 3.6)} كم/س
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ));
              })()}
              
              {/* Route Path - Only historical tracking points, not current location */}
              {routeData.startPoint && routeData.endPoint && (() => {
                // Filter out current location from route path - it should be a separate pin
                const historicalPoints = (routeData.trackingPoints || []).filter(point => 
                  (point as any).type !== 'current'
                );
                
                return (
                  <Polyline
                    positions={[
                      [routeData.startPoint!.latitude, routeData.startPoint!.longitude],
                      ...historicalPoints.map(point => [point.latitude, point.longitude] as [number, number]),
                      [routeData.endPoint!.latitude, routeData.endPoint!.longitude]
                    ]}
                    color="#3b82f6"
                    weight={4}
                    opacity={0.8}
                    dashArray="10, 5"
                  />
                );
              })()}
            </>
          )}
        </MapContainer>
      </div>

      {/* Trip Info Cards */}
      {trackingData.trips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trackingData.trips.slice(0, 3).map((trip, index) => {
            const lastPoint = trip.trackingLogs[trip.trackingLogs.length - 1];
            
            return (
              <Card key={`trip-card-${trip.id}-${index}`}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{trip.tripNumber}</span>
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status === "IN_PROGRESS" ? "قيد التنفيذ" : 
                         trip.status === "PENDING" ? "في الانتظار" :
                         trip.status === "DELIVERED" ? "تم التسليم" : trip.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {typeof trip.fromCity === 'object' ? (trip.fromCity as any)?.name || 'Unknown' : trip.fromCity} → {typeof trip.toCity === 'object' ? (trip.toCity as any)?.name || 'Unknown' : trip.toCity}
                    </div>
                    
                    {lastPoint && (
                      <div className="text-xs text-muted-foreground">
                        آخر تحديث: {formatTime(lastPoint.timestamp)}
                      </div>
                    )}
                    
                    <div className="text-xs text-blue-600">
                      {trip.trackingLogs.length} نقطة تتبع
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No trips message */}
      {trackingData.trips.length === 0 && (
        <div className="text-center py-8">
          <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد رحلات للتتبع
          </h3>
          <p className="text-gray-500">
            لا توجد رحلات نشطة حالياً للعرض على الخريطة
          </p>
        </div>
      )}

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
          {autoRefresh && (
            <span className="text-green-600">• تحديث تلقائي مفعل</span>
          )}
        </div>
      )}
    </div>
  );
}
