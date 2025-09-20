"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Truck, 
  Phone,
  User,
  Store,
  Package,
  Route as RouteIcon
} from "lucide-react";

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
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

interface CustomerTrackingData {
  trip: {
    id: string;
    tripNumber: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
    fromCity: { name: string; latitude?: number; longitude?: number };
    toCity: { name: string; latitude?: number; longitude?: number };
    scheduledDate: string;
    actualStartDate?: string;
    estimatedDeliveryTime?: string;
  };
  store: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  customer: {
    name: string;
    latitude: number;
    longitude: number;
    address?: string;
    phone?: string;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: string;
      speed?: number;
    };
    vehicle?: {
      type: string;
      plateNumber?: string;
    };
  };
  route?: {
    points: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
    }>;
    estimatedDuration: number; // in minutes
    distance: number; // in kilometers
  };
}

interface CustomerTrackingMapProps {
  tripId: string;
  height?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function CustomerTrackingMap({
  tripId,
  height = "500px",
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: CustomerTrackingMapProps) {
  const [trackingData, setTrackingData] = useState<CustomerTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  // Fetch tracking data
  const fetchTrackingData = async () => {
    try {
      setError(null);
      
      const response = await fetch(`/api/customer/trips/${tripId}/route`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Customer tracking data:', data);
      console.log('Data structure check:', {
        hasRoute: !!data.route,
        routeKeys: data.route ? Object.keys(data.route) : [],
        tripId: data.tripId,
        status: data.status
      });
      
      if (data.route) {
        // Transform API data to CustomerTrackingData format
        const transformedData: CustomerTrackingData = {
          trip: {
            id: data.tripId,
            tripNumber: data.tripNumber,
            status: data.status,
            fromCity: { 
              name: data.route.start?.name || 'نقطة البداية',
              latitude: data.route.start?.coordinates?.lat,
              longitude: data.route.start?.coordinates?.lng
            },
            toCity: { 
              name: data.route.end?.name || 'نقطة النهاية',
              latitude: data.route.end?.coordinates?.lat,
              longitude: data.route.end?.coordinates?.lng
            },
            scheduledDate: data.dates?.scheduled,
            actualStartDate: data.dates?.actualStart,
            estimatedDeliveryTime: calculateETA(data.route.estimatedDuration)
          },
          store: {
            name: `متجر ${data.route.start?.nameAr || data.route.start?.name || 'البداية'}`,
            latitude: data.route.start?.coordinates?.lat || 24.7136,
            longitude: data.route.start?.coordinates?.lng || 46.6753,
            address: data.route.start?.nameAr || data.route.start?.name
          },
          customer: {
            name: 'العميل',
            latitude: data.route.end?.coordinates?.lat || 21.3891,
            longitude: data.route.end?.coordinates?.lng || 39.8579,
            address: data.route.end?.nameAr || data.route.end?.name,
            phone: undefined
          },
          driver: data.driver ? {
            id: data.driver.id,
            name: data.driver.name || 'السائق',
            phone: data.driver.phone,
            currentLocation: data.route.points?.length > 0 ? (() => {
              const latestPoint = data.route.points[data.route.points.length - 1];
              return {
                latitude: latestPoint.latitude,
                longitude: latestPoint.longitude,
                timestamp: latestPoint.timestamp,
                speed: latestPoint.speed
              };
            })() : undefined,
            vehicle: data.vehicle ? {
              type: data.vehicle.type || 'مركبة',
              plateNumber: data.vehicle.capacity
            } : undefined
          } : undefined,
          route: {
            points: data.route.points || [],
            estimatedDuration: data.route.estimatedDuration || 0,
            distance: data.route.distance || 0
          }
        };
        
        setTrackingData(transformedData);
        setLastUpdate(new Date());
      } else {
        console.error('No route data in response:', data);
        throw new Error(`Invalid response format - missing route data. Available keys: ${Object.keys(data).join(', ')}`);
      }
      
    } catch (error) {
      console.error('Error fetching customer tracking data:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ في جلب بيانات التتبع');
    } finally {
      setLoading(false);
    }
  };

  // Calculate ETA
  const calculateETA = (durationInMinutes: number): string => {
    if (!durationInMinutes) return 'غير محدد';
    
    const now = new Date();
    const eta = new Date(now.getTime() + (durationInMinutes * 60 * 1000));
    
    return eta.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get trip status in Arabic
  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'يتم التجهيز',
      'IN_PROGRESS': 'في الطريق',
      'DELIVERED': 'تم التسليم',
      'CANCELLED': 'ملغي'
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Create custom icons
  const createStoreIcon = () => {
    const iconHtml = `
      <div style="
        width: 40px;
        height: 40px;
        background: #10b981;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 20px;
      ">🏪</div>
    `;
    
    return new L.DivIcon({
      html: iconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: 'store-icon'
    });
  };

  const createCustomerIcon = () => {
    const iconHtml = `
      <div style="
        width: 40px;
        height: 40px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 20px;
      ">🏠</div>
    `;
    
    return new L.DivIcon({
      html: iconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20],
      className: 'customer-icon'
    });
  };

  const createDriverIcon = () => {
    const iconHtml = `
      <div style="
        width: 35px;
        height: 35px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 18px;
        position: relative;
      ">
        🚚
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 50px;
          height: 50px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          opacity: 0.4;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
      </style>
    `;
    
    return new L.DivIcon({
      html: iconHtml,
      iconSize: [35, 35],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
      className: 'driver-icon'
    });
  };

  // Calculate map center
  const getMapCenter = (): [number, number] => {
    if (!trackingData) return [24.7136, 46.6753]; // Default to Riyadh
    
    if (trackingData.driver?.currentLocation) {
      return [trackingData.driver.currentLocation.latitude, trackingData.driver.currentLocation.longitude];
    }
    
    // Center between store and customer
    const storeLat = trackingData.store.latitude;
    const storeLng = trackingData.store.longitude;
    const customerLat = trackingData.customer.latitude;
    const customerLng = trackingData.customer.longitude;
    
    return [(storeLat + customerLat) / 2, (storeLng + customerLng) / 2];
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchTrackingData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchTrackingData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tripId, autoRefresh, refreshInterval]);

  // Handle map load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMapLoaded(true);
    }
  }, []);

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
      <Alert className="m-4">
        <AlertDescription>
          خطأ في تحميل بيانات التتبع: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!trackingData) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          لا توجد بيانات تتبع متاحة لهذه الرحلة
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trip Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">رحلة #{trackingData.trip.tripNumber}</CardTitle>
              <p className="text-sm text-muted-foreground">
                من {trackingData.store.name} إلى {trackingData.customer.address}
              </p>
            </div>
            <Badge className={getStatusColor(trackingData.trip.status)}>
              {getStatusText(trackingData.trip.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">الوقت المتوقع</p>
                <p className="text-muted-foreground">{trackingData.trip.estimatedDeliveryTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">المسافة</p>
                <p className="text-muted-foreground">{trackingData.route?.distance.toFixed(1)} كم</p>
              </div>
            </div>
            {trackingData.driver && (
              <>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">السائق</p>
                    <p className="text-muted-foreground">{trackingData.driver.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">المركبة</p>
                    <p className="text-muted-foreground">{trackingData.driver.vehicle?.type}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height }} className="relative">
            {mapLoaded && (
              <MapContainer
                ref={mapRef}
                center={getMapCenter()}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                className="rounded-lg"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Store Marker */}
                <Marker
                  position={[trackingData.store.latitude, trackingData.store.longitude]}
                  icon={createStoreIcon()}
                >
                  <Popup>
                    <div className="text-center">
                      <div className="font-bold text-green-600 mb-2">🏪 نقطة البداية</div>
                      <div className="font-medium">{trackingData.store.name}</div>
                      <div className="text-sm text-gray-600">{trackingData.store.address}</div>
                    </div>
                  </Popup>
                </Marker>

                {/* Customer Marker */}
                <Marker
                  position={[trackingData.customer.latitude, trackingData.customer.longitude]}
                  icon={createCustomerIcon()}
                >
                  <Popup>
                    <div className="text-center">
                      <div className="font-bold text-blue-600 mb-2">🏠 وجهة التسليم</div>
                      <div className="font-medium">{trackingData.customer.name}</div>
                      <div className="text-sm text-gray-600">{trackingData.customer.address}</div>
                      {trackingData.customer.phone && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.open(`tel:${trackingData.customer.phone}`)}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          اتصال
                        </Button>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {/* Driver Marker */}
                {trackingData.driver?.currentLocation && (
                  <Marker
                    position={[
                      trackingData.driver.currentLocation.latitude,
                      trackingData.driver.currentLocation.longitude
                    ]}
                    icon={createDriverIcon()}
                  >
                    <Popup>
                      <div className="text-center">
                        <div className="font-bold text-red-600 mb-2">🚚 موقع السائق</div>
                        <div className="font-medium">{trackingData.driver.name}</div>
                        {trackingData.driver.currentLocation.speed && (
                          <div className="text-sm text-gray-600">
                            السرعة: {Math.round(trackingData.driver.currentLocation.speed * 3.6)} كم/س
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          آخر تحديث: {new Date(trackingData.driver.currentLocation.timestamp).toLocaleTimeString('ar-SA')}
                        </div>
                        {trackingData.driver?.phone && (
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => window.open(`tel:${trackingData.driver?.phone}`)}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            اتصال بالسائق
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Route Path */}
                {trackingData.route && trackingData.route.points.length > 0 && (
                  <Polyline
                    positions={[
                      [trackingData.store.latitude, trackingData.store.longitude],
                      ...trackingData.route.points.map(point => [point.latitude, point.longitude] as [number, number]),
                      [trackingData.customer.latitude, trackingData.customer.longitude]
                    ]}
                    color="#3b82f6"
                    weight={4}
                    opacity={0.7}
                    dashArray="10, 5"
                  />
                )}

                {/* Delivery Area Circle */}
                {trackingData.driver?.currentLocation && (
                  <Circle
                    center={[trackingData.customer.latitude, trackingData.customer.longitude]}
                    radius={500} // 500 meters
                    color="#22c55e"
                    fillColor="#22c55e"
                    fillOpacity={0.1}
                    weight={2}
                    dashArray="5, 5"
                  />
                )}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Driver Contact Card */}
      {trackingData.driver && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">{trackingData.driver.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {trackingData.driver.vehicle?.type} • {trackingData.driver.vehicle?.plateNumber}
                  </p>
                </div>
              </div>
              {trackingData.driver?.phone && (
                <Button 
                  onClick={() => window.open(`tel:${trackingData.driver?.phone}`)}
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  اتصال بالسائق
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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
