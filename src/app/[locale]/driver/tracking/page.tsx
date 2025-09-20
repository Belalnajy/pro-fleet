"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrackingMap } from "@/components/maps/tracking-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Navigation, 
  Clock,
  Route,
  Play,
  Pause,
  Square,
  RefreshCw,
  Truck,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface DriverTrip {
  id: string;
  tripNumber: string;
  status: string;
  fromCity: {
    name: string;
  };
  toCity: {
    name: string;
  };
  vehicle: {
    capacity: string;
    vehicleType: {
      name: string;
      nameAr: string;
    };
  };
  scheduledDate: string;
  actualStartDate?: string;
  customer: {
    name: string;
    phone?: string;
  };
  temperature?: {
    option: string;
    value: number;
    unit: string;
  };
  price: number;
  trackingLogs?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  }>;
}

interface LocationData {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

export default function DriverTrackingPage({ params }: { params: { locale: string } }) {
  const { locale } = params
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
      // Auto-start tracking for active trips
      setTimeout(() => {
        startTracking();
      }, 1000); // Small delay to ensure UI is ready
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
        // Find the specific trip by ID
        selectedTrip = Array.isArray(data) 
          ? data.find((trip: DriverTrip) => trip.id === tripId)
          : (data.id === tripId ? data : null);
      } else {
        // Find the active trip for this driver
        selectedTrip = Array.isArray(data) 
          ? data.find((trip: DriverTrip) => trip.status === "IN_PROGRESS")
          : data;
      }
      
      setCurrentTrip(selectedTrip || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setLocationError(null);
    setIsTracking(true);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const successCallback = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
      };

      setCurrentLocation(locationData);
      setLastUpdateTime(new Date());
      
      // Send location to server
      sendLocationUpdate(locationData);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = "خطأ غير معروف في الموقع";
      let errorDetails = "";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "تم رفض الوصول للموقع الجغرافي";
          errorDetails = "يرجى السماح للتطبيق بالوصول للموقع من إعدادات المتصفح";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "الموقع الجغرافي غير متاح";
          errorDetails = "تأكد من تفعيل GPS أو خدمات الموقع على جهازك";
          break;
        case error.TIMEOUT:
          errorMessage = "انتهت مهلة طلب الموقع";
          errorDetails = "تأكد من اتصالك بالإنترنت وحاول مرة أخرى";
          break;
      }
      
      setLocationError(`${errorMessage}. ${errorDetails}`);
      setIsTracking(false);
      
      // Show toast with detailed instructions
      toast({
        title: "❌ خطأ في التتبع",
        description: errorMessage,
        variant: "destructive",
      });
    };

    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setLocationError(null);
  };

  const sendLocationUpdate = async (locationData: LocationData) => {
    if (!currentTrip) return;

    try {
      const response = await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: currentTrip.id,
          ...locationData,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send location update");
      }
    } catch (err) {
      console.error("Error sending location update:", err);
    }
  };

  const updateTripStatus = async (newStatus: string) => {
    if (!currentTrip) return;

    try {
      const response = await fetch(`/api/trips/${currentTrip.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update trip status");
      }

      // Refresh trip data
      await fetchCurrentTrip();
      
      // Show success toast
      toast({
        title: "✅ تم تحديث حالة الرحلة",
        description: `تم تغيير حالة الرحلة إلى ${getStatusText(newStatus)}`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
      toast({
        variant: "destructive",
        title: "❌ خطأ في تحديث الحالة",
        description: err instanceof Error ? err.message : "Failed to update status"
      });
    }
  };

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "قيد التنفيذ";
      case "PENDING":
        return "في الانتظار";
      case "DELIVERED":
        return "تم التسليم";
      case "CANCELLED":
        return "ملغية";
      default:
        return status;
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

  const canStartTrip = currentTrip?.status === "PENDING";
  const canCompleteTrip = currentTrip?.status === "IN_PROGRESS";

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">تتبع الرحلة</h1>
            <p className="text-muted-foreground">
              إدارة وتتبع رحلتك الحالية
            </p>
          </div>
          <Button onClick={fetchCurrentTrip} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Error Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {locationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-medium">خطأ في الوصول للموقع الجغرافي</div>
              <div className="text-sm">{locationError}</div>
              <div className="mt-3 space-y-2">
                <div className="text-sm font-medium">خطوات الحل:</div>
                <div className="text-xs space-y-1">
                  <div>• اضغط على أيقونة القفل 🔒 في شريط العنوان</div>
                  <div>• اختر "السماح" للموقع الجغرافي</div>
                  <div>• أعد تحميل الصفحة وحاول مرة أخرى</div>
                  <div>• تأكد من تفعيل GPS على جهازك</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setLocationError(null);
                    startTracking();
                  }}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  إعادة المحاولة
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Trip */}
        {currentTrip ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trip Details and Controls */}
            <div className="lg:col-span-1 space-y-4">
              {/* Trip Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {currentTrip.tripNumber}
                  </CardTitle>
                  <CardDescription>
                    رحلتك الحالية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(currentTrip.status)}>
                        {getStatusText(currentTrip.status)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">المسار</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      <span className="font-medium">
                        {currentTrip.fromCity?.name} → {currentTrip.toCity?.name}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">المركبة</label>
                    <div className="mt-1">
                      {currentTrip.vehicle?.vehicleType?.name || currentTrip.vehicle?.vehicleType?.nameAr} - {currentTrip.vehicle?.capacity}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">تاريخ الجدولة</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {formatDate(currentTrip.scheduledDate)}
                    </div>
                  </div>

                  {currentTrip.actualStartDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">تاريخ البداية الفعلي</label>
                      <div className="mt-1">{formatDate(currentTrip.actualStartDate)}</div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">العميل</label>
                    <div className="mt-1">
                      <div className="font-medium">{currentTrip.customer.name}</div>
                      {currentTrip.customer.phone && (
                        <a 
                          href={`tel:${currentTrip.customer.phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {currentTrip.customer.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    التتبع اللحظي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">حالة التتبع</span>
                    <div className="flex items-center gap-2">
                      {isTracking ? (
                        <Badge variant="default" className="bg-green-600">
                          <Navigation className="h-3 w-3 mr-1" />
                          مفعل
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Pause className="h-3 w-3 mr-1" />
                          معطل
                        </Badge>
                      )}
                      <Switch
                        checked={isTracking}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            startTracking();
                          } else {
                            stopTracking();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {currentTrip?.status === "IN_PROGRESS" && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 التتبع مفعل تلقائياً للرحلات النشطة
                    </div>
                  )}

                  {currentLocation && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </span>
                      </div>
                      
                      {currentLocation.speed && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>{Math.round(currentLocation.speed * 3.6)} كم/س</span>
                        </div>
                      )}
                      
                      {lastUpdateTime && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-SA')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isTracking && !currentLocation && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      جاري الحصول على الموقع تلقائياً...
                    </div>
                  )}

                  {!isTracking && currentTrip?.status === "IN_PROGRESS" && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ التتبع معطل مؤقتاً - فعل التتبع لبدء إرسال موقعك
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trip Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>إجراءات الرحلة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canStartTrip && (
                    <Button 
                      onClick={() => updateTripStatus("IN_PROGRESS")}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      بدء الرحلة
                    </Button>
                  )}

                  {canCompleteTrip && (
                    <Button 
                      onClick={() => updateTripStatus("DELIVERED")}
                      className="w-full"
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      إكمال الرحلة
                    </Button>
                  )}

                  <Button 
                    onClick={() => updateTripStatus("CANCELLED")}
                    className="w-full"
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    إلغاء الرحلة
                  </Button>
                </CardContent>
              </Card>
              
              {/* Route Information */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات المسار</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">نقطة البداية</div>
                      <div className="font-medium">{currentTrip.fromCity?.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">نقطة النهاية</div>
                      <div className="font-medium">{currentTrip.toCity?.name}</div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground mb-1">تفاصيل المسار</div>
                    <div className="text-xs text-blue-600">
                      🗺️ يتم عرض المسار على الخريطة
                    </div>
                    <div className="text-xs text-gray-500">
                      📍 نقاط التتبع محاكية للعرض
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>خريطة الرحلة</CardTitle>
                  <CardDescription>
                    عرض مسار الرحلة والموقع الحالي
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TrackingMap 
                    tripId={currentTrip.id}
                    height="500px"
                    autoRefresh={true}
                    refreshInterval={15000}
                    showRoute={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* No Current Trip */
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
                {tripId && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const currentLang = window.location.pathname.split('/')[1] || 'en';
                      router.push(`/${currentLang}/driver/trips`);
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    العودة إلى الرحلات
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
