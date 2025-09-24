"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EnhancedLiveTrackingMap from "@/components/maps/enhanced-live-tracking-map";
import { 
  MapPin, 
  Navigation, 
  Clock,
  Play,
  Pause,
  Square,
  RefreshCw,
  Truck,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import { getCityCoordinates } from "@/lib/city-coordinates";
import { TripStatusControls } from "@/components/driver/trip-status-controls";

interface DriverTrip {
  id: string;
  tripNumber: string;
  status: string;
  fromCity: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  toCity: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  customer: {
    name: string;
    phone?: string;
  };
  scheduledDate: string;
  actualStartDate?: string;
  price: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

export default function DriverLiveTrackingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const tripId = searchParams.get('tripId');
  
  const [currentTrip, setCurrentTrip] = useState<DriverTrip | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [totalPointsSent, setTotalPointsSent] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "DRIVER") {
      router.push(`/${locale}/auth/signin`);
      return;
    }
    fetchCurrentTrip();
  }, [session, status, router, tripId]);

  // Auto-start tracking when component mounts and trip is loaded
  useEffect(() => {
    if (currentTrip && currentTrip.status === "IN_PROGRESS" && !isTracking && !locationError) {
      setTimeout(() => {
        startTracking();
      }, 2000);
    }
  }, [currentTrip, isTracking, locationError]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const fetchCurrentTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/driver/trips");
      
      if (!response.ok) {
        if (response.status === 404) {
          setCurrentTrip(null);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      let selectedTrip = null;
      
      if (tripId) {
        // البحث عن رحلة محددة بـ ID
        selectedTrip = Array.isArray(data) 
          ? data.find((trip: DriverTrip) => trip.id === tripId)
          : (data?.id === tripId ? data : null);
          
        if (!selectedTrip) {
          console.log(`Trip with ID ${tripId} not found or not accessible`);
        }
      } else {
        // البحث عن أي رحلة نشطة (ليست مُسلمة أو ملغية)
        const activeStatuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "EN_ROUTE_PICKUP", "AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "AT_DESTINATION"];
        selectedTrip = Array.isArray(data) 
          ? data.find((trip: DriverTrip) => activeStatuses.includes(trip.status))
          : (data?.status && activeStatuses.includes(data.status) ? data : null);
          
        if (!selectedTrip && Array.isArray(data) && data.length > 0) {
          console.log('No active trips found. Available trips:', data.map(t => ({ id: t.id, status: t.status })));
        }
      }
      
      setCurrentTrip(selectedTrip || null);
      
      // إظهار رسالة معلوماتية إذا لم توجد رحلة
      if (!selectedTrip) {
        toast({
          title: "ℹ️ لا توجد رحلة نشطة",
          description: tripId 
            ? "الرحلة المطلوبة غير متاحة للتتبع حالياً"
            : "لا توجد رحلات نشطة للتتبع المباشر",
          variant: "default"
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطأ غير معروف";
      setError(errorMessage);
      console.error('Error fetching current trip:', err);
      
      toast({
        variant: "destructive",
        title: "❌ خطأ في تحميل الرحلة",
        description: "تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مرة أخرى."
      });
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("خدمة تحديد الموقع غير مدعومة في هذا المتصفح");
      toast({
        variant: "destructive",
        title: "❌ خدمة الموقع غير متاحة",
        description: "متصفحك لا يدعم خدمة تحديد الموقع"
      });
      return;
    }

    setConnectionStatus('connecting');
    setLocationError(null);

    const successCallback = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
      };

      setCurrentLocation(locationData);
      setConnectionStatus('connected');
      
      // إرسال الموقع للخادم
      sendLocationUpdate(locationData);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = "خطأ غير معروف في تحديد الموقع";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "تم رفض الإذن للوصول إلى الموقع";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "معلومات الموقع غير متاحة";
          break;
        case error.TIMEOUT:
          errorMessage = "انتهت مهلة طلب تحديد الموقع";
          break;
      }
      
      setLocationError(errorMessage);
      setConnectionStatus('disconnected');
      
      toast({
        variant: "destructive",
        title: "❌ خطأ في تحديد الموقع",
        description: errorMessage
      });
    };

    // بدء تتبع الموقع مع تحديث كل 5 ثوانٍ
    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(id);
    setIsTracking(true);
    
    toast({
      title: "🚀 تم بدء التتبع",
      description: "يتم الآن إرسال موقعك للأدمن كل 5 ثوانٍ"
    });
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setConnectionStatus('disconnected');
    
    toast({
      title: "⏹️ تم إيقاف التتبع",
      description: "لن يتم إرسال موقعك بعد الآن"
    });
  };

  const sendLocationUpdate = async (locationData: LocationData) => {
    if (!currentTrip) return;

    try {
      const response = await fetch("/api/driver/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: currentTrip.id,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed || 0,
          heading: locationData.heading || 0,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("GPS location sent successfully:", result);
        setLastUpdateTime(new Date());
        setTotalPointsSent(prev => prev + 1);
        setConnectionStatus('connected');
      } else {
        console.error("Failed to send GPS location:", response.status);
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error("Error sending GPS location:", err);
      setConnectionStatus('disconnected');
    }
  };

  const updateTripStatus = async (newStatus: string) => {
    if (!currentTrip) return;

    try {
      const response = await fetch("/api/driver/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: currentTrip.id,
          status: newStatus
        })
      });

      if (response.ok) {
        setCurrentTrip(prev => prev ? { ...prev, status: newStatus } : null);
        
        if (newStatus === "DELIVERED") {
          stopTracking();
          toast({
            title: "✅ تم تسليم الرحلة",
            description: "تم تحديث حالة الرحلة إلى مُسلمة وإيقاف التتبع"
          });
        }
      }
    } catch (err) {
      console.error("Error updating trip status:", err);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (currentTrip) {
      setCurrentTrip(prev => prev ? { ...prev, status: newStatus } : null);
      fetchCurrentTrip(); // Refresh data
    }
  };

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


  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "في الانتظار";
      case "ASSIGNED": return "تم التعيين";
      case "IN_PROGRESS": return "قيد التنفيذ";
      case "EN_ROUTE_PICKUP": return "في الطريق للاستلام";
      case "AT_PICKUP": return "وصل لنقطة الاستلام";
      case "PICKED_UP": return "تم الاستلام";
      case "IN_TRANSIT": return "في الطريق للوجهة";
      case "AT_DESTINATION": return "وصل للوجهة";
      case "DELIVERED": return "تم التسليم";
      case "CANCELLED": return "ملغية";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل بيانات التتبع...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">🚚 التتبع المباشر</h1>
            <p className="text-muted-foreground">
              إرسال موقعك المباشر للأدمن والعملاء
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-4 h-4 mr-1" />
                  متصل
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  جاري الاتصال
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  غير متصل
                </>
              )}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {locationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* No Trip Available State */}
        {!currentTrip && !loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] text-center space-y-4 sm:space-y-6 px-4">
            <div className="relative">
              <Truck className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-muted-foreground/50" />
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-100 rounded-full p-1.5 sm:p-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3 max-w-sm sm:max-w-md">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">لا توجد رحلة للتتبع</h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {tripId 
                  ? "الرحلة المطلوبة غير موجودة أو تم إنهاؤها"
                  : "لا توجد رحلات نشطة للتتبع المباشر"
                }
              </p>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1 text-right">
                <p>• تأكد من وجود رحلة مُعيّنة لك</p>
                <p>• تحقق من حالة الرحلة (يجب أن تكون نشطة)</p>
                <p>• تواصل مع الإدارة في حالة وجود مشكلة</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-sm sm:max-w-md">
              <Button 
                onClick={() => router.push(`/${locale}/driver`)}
                className="flex items-center justify-center gap-2 text-sm sm:text-base h-9 sm:h-10"
              >
                <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">العودة للوحة التحكم</span>
                <span className="sm:hidden">لوحة التحكم</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  fetchCurrentTrip();
                }}
                disabled={loading}
                className="flex items-center justify-center gap-2 text-sm sm:text-base h-9 sm:h-10"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">إعادة تحميل</span>
                <span className="sm:hidden">تحديث</span>
              </Button>
            </div>
            
            {/* Quick Actions */}
            <Card className="w-full max-w-sm sm:max-w-md">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => router.push(`/${locale}/driver/trips`)}
                >
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  عرض جميع الرحلات
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => window.location.href = 'tel:+966500000000'}
                >
                  📞 اتصال بالدعم الفني
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentTrip && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Trip Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Trip Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    معلومات الرحلة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">رقم الرحلة</label>
                    <p className="font-bold text-lg">{currentTrip.tripNumber}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                    <Badge className={getStatusColor(currentTrip.status)}>
                      {getStatusText(currentTrip.status)}
                    </Badge>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">العميل</label>
                    <p className="font-medium">{currentTrip.customer.name}</p>
                    {currentTrip.customer.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open(`tel:${currentTrip.customer.phone}`)}
                      >
                        📞 اتصال بالعميل
                      </Button>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">المسار</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{currentTrip.fromCity.name}</span>
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-sm">{currentTrip.toCity.name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">موعد الرحلة</label>
                    <p className="text-sm">{formatDate(currentTrip.scheduledDate)}</p>
                  </div>
                  
                  {currentTrip.actualStartDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تاريخ البدء الفعلي</label>
                      <p className="text-sm">{formatDate(currentTrip.actualStartDate)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trip Status Controls */}
              <TripStatusControls 
                tripId={currentTrip.id}
                currentStatus={currentTrip.status}
                onStatusUpdate={handleStatusUpdate}
                currentLocation={currentLocation}
              />

              {/* Tracking Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>التحكم في التتبع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    {/* {!isTracking ? (
                      <Button 
                        onClick={startTracking}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={["DELIVERED", "CANCELLED"].includes(currentTrip.status)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        بدء التتبع المباشر
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopTracking}
                        variant="destructive"
                        className="w-full"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        إيقاف التتبع
                      </Button>
                    )}
                     */}
                    {!["DELIVERED", "CANCELLED"].includes(currentTrip.status) && (
                      <Button
                        onClick={() => updateTripStatus("DELIVERED")}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        تحديد كمُسلمة
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Auto-fit to show start, destination and current location
                        const mapComponent = document.querySelector('.enhanced-live-tracking-map');
                        if (mapComponent) {
                          const fitButton = mapComponent.querySelector('[title="عرض جميع النقاط"]');
                          if (fitButton) {
                            (fitButton as HTMLButtonElement).click();
                          }
                        }
                      }}
                      className="w-full"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      🗺️ عرض المسار الكامل
                    </Button>
                  </div>
                  
                  {lastUpdateTime && (
                    <div className="text-sm text-muted-foreground text-center">
                      آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-SA')}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات التتبع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">نقاط مُرسلة:</span>
                    <span className="font-medium">{totalPointsSent}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">حالة الاتصال:</span>
                    <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                      {connectionStatus === 'connected' ? 'متصل' : 'غير متصل'}
                    </Badge>
                  </div>
                  
                  {currentLocation && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">خط العرض:</span>
                        <span className="font-mono text-sm">{currentLocation.latitude.toFixed(6)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">خط الطول:</span>
                        <span className="font-mono text-sm">{currentLocation.longitude.toFixed(6)}</span>
                      </div>
                      
                      {currentLocation.speed !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">السرعة:</span>
                          <span className="font-medium">{Math.round(currentLocation.speed * 3.6)} كم/س</span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Live Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>الموقع الحالي على الخريطة</CardTitle>
                  <CardDescription>
                    موقعك المباشر مع مسار التتبع
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedLiveTrackingMap
                    driverId={session?.user?.id}
                    tripId={currentTrip?.id}
                    currentLocation={currentLocation ? {
                      lat: currentLocation.latitude,
                      lng: currentLocation.longitude,
                      speed: currentLocation.speed,
                      heading: currentLocation.heading
                    } : null}
                    start={currentTrip ? {
                      lat: (currentTrip as any).originLat || currentTrip.fromCity.latitude || getCityCoordinates(currentTrip.fromCity.name).lat,
                      lng: (currentTrip as any).originLng || currentTrip.fromCity.longitude || getCityCoordinates(currentTrip.fromCity.name).lng
                    } : undefined}
                    destination={currentTrip ? {
                      lat: (currentTrip as any).destinationLat || currentTrip.toCity.latitude || getCityCoordinates(currentTrip.toCity.name).lat,
                      lng: (currentTrip as any).destinationLng || currentTrip.toCity.longitude || getCityCoordinates(currentTrip.toCity.name).lng
                    } : undefined}
                    height="400px"
                    initialZoom={12}
                    showPathTrail={true}
                    showRecenterButton={true}
                    className="w-full enhanced-live-tracking-map"
                  />
                  
                  {!currentLocation && (
                    <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">لا يوجد موقع حالي</p>
                        <p className="text-muted-foreground">
                          ابدأ التتبع لعرض موقعك على الخريطة
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
