"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
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
  adminMode?: boolean; // New prop to determine if using admin API
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
      if (showRoute && tripId) {
        const routeApiUrl = adminMode 
          ? `/api/admin/trips/${tripId}/route`
          : `/api/driver/trips/${tripId}/route`;
        
        const routeResponse = await fetch(routeApiUrl);
        
        if (routeResponse.ok) {
          const routeData = await routeResponse.json();
          setRouteData(routeData.route);
          
          // Also set trip data for display
          // Always include start and end points for map centering
          const allPoints = [
            routeData.route.startPoint,
            ...(routeData.route.trackingPoints || []),
            routeData.route.endPoint
          ].filter(Boolean);
          
          setTrackingData({
            trips: [{
              ...routeData.trip,
              trackingLogs: routeData.route.trackingPoints || []
            }],
            points: allPoints
          });
          
          setLastUpdate(new Date());
          return;
        }
      }
      
      // Fallback to regular tracking API
      let url = "/api/tracking";
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
      
      // Transform data for map display
      if (Array.isArray(data)) {
        const trips = data.map((item: any) => ({
          id: item.trip?.id || item.id,
          tripNumber: item.trip?.tripNumber || item.tripNumber,
          status: item.trip?.status || item.status,
          fromCity: item.trip?.fromCity || item.fromCity,
          toCity: item.trip?.toCity || item.toCity,
          vehicle: item.trip?.vehicle || item.vehicle,
          customer: item.customer,
          driver: item.driver,
          trackingLogs: item.trackingLogs || [],
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
      case "IN_PROGRESS":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-500";
      case "DELIVERED":
        return "bg-blue-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

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

  const createCustomIcon = (color: string = "red") => {
    if (typeof window === "undefined") return null;
    
    const L = require("leaflet");
    return new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
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
  // Adjust zoom based on available data
  let zoom = 6; // Default zoom for Saudi Arabia
  if (routeData && routeData.startPoint) {
    zoom = 8; // Medium zoom when we have route data
  }
  if (trackingData.points.length > 2) {
    zoom = 10; // Close zoom when we have tracking points
  }

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
          
          {/* Render tracking points */}
          {trackingData.points.map((point, index) => {
            const isLatest = index === trackingData.points.length - 1;
            const icon = createCustomIcon(isLatest ? "red" : "blue");
            
            return (
              <Marker
                key={`${point.id}-${index}`}
                position={[point.latitude, point.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{(point as any).tripNumber}</div>
                    <div>📍 {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</div>
                    <div>🕒 {formatTime(point.timestamp)}</div>
                    {point.speed && (
                      <div>🚗 {Math.round(point.speed * 3.6)} كم/س</div>
                    )}
                    {isLatest && (
                      <div className="text-green-600 font-medium">الموقع الحالي</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Draw route lines for each trip */}
          {trackingData.trips.map((trip) => {
            if (trip.trackingLogs.length < 2) return null;
            
            const routePoints = trip.trackingLogs.map(log => [log.latitude, log.longitude] as [number, number]);
            
            return (
              <Polyline
                key={trip.id}
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
                  icon={createCustomIcon("green")}
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
                  icon={createCustomIcon("red")}
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
              
              {/* Route Path */}
              {routeData.startPoint && routeData.endPoint && (
                <Polyline
                  positions={[
                    [routeData.startPoint.latitude, routeData.startPoint.longitude],
                    ...routeData.trackingPoints.map(point => [point.latitude, point.longitude] as [number, number]),
                    [routeData.endPoint.latitude, routeData.endPoint.longitude]
                  ]}
                  color="#3b82f6"
                  weight={4}
                  opacity={0.8}
                  dashArray="10, 5"
                />
              )}
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
              <Card key={`${trip.id}-card-${index}`}>
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
