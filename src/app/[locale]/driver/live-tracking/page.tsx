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
        throw new Error("Failed to fetch current trip");
      }

      const data = await response.json();
      
      let selectedTrip = null;
      
      if (tripId) {
        selectedTrip = Array.isArray(data) 
          ? data.find((trip: DriverTrip) => trip.id === tripId)
          : (data.id === tripId ? data : null);
      } else {
        selectedTrip = Array.isArray(data) 
          ? data.find((trip: DriverTrip) => trip.status === "IN_PROGRESS")
          : data;
      }
      
      setCurrentTrip(selectedTrip || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast({
        variant: "destructive",
        title: "❌ خطأ في تحميل الرحلة",
        description: "فشل في تحميل بيانات الرحلة الحالية"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "DELIVERED": return "bg-green-100 text-green-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "في الانتظار";
      case "IN_PROGRESS": return "قيد التنفيذ";
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

  // Get city coordinates for mapping
  const getCityCoordinates = (cityName: string): [number, number] => {
    const cityCoords: { [key: string]: [number, number] } = {
      'الرياض': [24.7136, 46.6753],
      'جدة': [21.4858, 39.1925],
      'الدمام': [26.4207, 50.0888],
      'مكة المكرمة': [21.3891, 39.8579],
      'المدينة المنورة': [24.5247, 39.5692],
      'الطائف': [21.2703, 40.4178],
      'تبوك': [28.3998, 36.5700],
      'بريدة': [26.3260, 43.9750],
      'خميس مشيط': [18.3059, 42.7278],
      'حائل': [27.5114, 41.6900],
      'الجبيل': [27.0174, 49.6251],
      'ينبع': [24.0896, 38.0618],
      'الخبر': [26.2172, 50.1971],
      'القطيف': [26.5205, 50.0089],
      'الأحساء': [25.4295, 49.5906],
      'نجران': [17.4924, 44.1277],
      'جازان': [16.9014, 42.5511],
      'عرعر': [30.9753, 41.0381],
      'سكاكا': [29.9697, 40.2064],
      'الباحة': [20.0129, 41.4687]
    };
    
    return cityCoords[cityName] || [24.7136, 46.6753]; // Default to Riyadh
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

        {currentTrip ? (
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

              {/* Tracking Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>التحكم في التتبع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3">
                    {!isTracking ? (
                      <Button 
                        onClick={startTracking}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={currentTrip.status !== "IN_PROGRESS"}
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
                    
                    {currentTrip.status === "IN_PROGRESS" && (
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
                      lat: currentTrip.fromCity.latitude || 24.7136,
                      lng: currentTrip.fromCity.longitude || 46.6753
                    } : undefined}
                    destination={currentTrip ? {
                      lat: currentTrip.toCity.latitude || 24.7136,
                      lng: currentTrip.toCity.longitude || 46.6753
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
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tripId ? "لم يتم العثور على الرحلة" : "لا توجد رحلة نشطة"}
              </h3>
              <p className="text-gray-500 mb-4">
                {tripId 
                  ? "الرحلة المطلوبة غير موجودة أو لا تنتمي إليك"
                  : "لم يتم تعيين أي رحلة لك حالياً"
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchCurrentTrip}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  تحقق من الرحلات الجديدة
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/${locale}/driver/trips`)}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  العودة إلى الرحلات
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
