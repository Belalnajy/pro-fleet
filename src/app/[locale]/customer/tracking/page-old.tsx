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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MapPin, 
  Truck, 
  Clock,
  Navigation,
  Search,
  RefreshCw,
  Package,
  Route,
  Calendar,
  Phone,
  User,
  Activity,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowLeft
} from "lucide-react";

interface CustomerTrip {
  trip: {
    id: string;
    tripNumber: string;
    status: string;
    fromCity: {
      id: string;
      name: string;
      nameAr: string;
      latitude?: number;
      longitude?: number;
    };
    toCity: {
      id: string;
      name: string;
      nameAr: string;
      latitude?: number;
      longitude?: number;
    };
    vehicle: {
      capacity: string;
      vehicleType: {
        id: string;
        name: string;
        nameAr: string;
      };
    } | null;
    temperature: {
      id: string;
      name: string;
      nameAr: string;
      value: number;
    } | null;
    scheduledDate: string;
    actualStartDate?: string;
    deliveredDate?: string;
    price: number;
    notes?: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
    driver: {
      id: string;
      name: string;
      phone?: string;
      trackingEnabled: boolean;
    } | null;
  };
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  } | null;
  trackingHistory: Array<{
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  }>;
  trackingStats: {
    totalPoints: number;
    lastUpdate: string | null;
    isActive: boolean;
    driverTrackingEnabled: boolean;
  };
}

export default function CustomerTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [trips, setTrips] = useState<CustomerTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [searchTripNumber, setSearchTripNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get tripId from URL params if provided
  const urlTripId = searchParams.get('tripId');

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "CUSTOMER") {
      router.push("/auth/signin");
      return;
    }
    checkTrackingSettings();
    fetchTrackingData();
    
    // Set selected trip from URL if provided
    if (urlTripId) {
      setSelectedTripId(urlTripId);
    }
  }, [session, status, router, urlTripId]);

  // Auto-refresh every 30 seconds for active trips
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTripId) {
        refreshTrackingData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTripId]);

  const checkTrackingSettings = async () => {
    try {
      setTrackingLoading(true);
      const response = await fetch("/api/settings/tracking");
      
      if (response.ok) {
        const data = await response.json();
        setTrackingEnabled(data.trackingEnabled);
      } else {
        // Default to enabled if API fails
        setTrackingEnabled(true);
      }
    } catch (error) {
      console.error("Error checking tracking settings:", error);
      // Default to enabled on error
      setTrackingEnabled(true);
    } finally {
      setTrackingLoading(false);
    }
  };

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/customer/tracking");
      
      if (!response.ok) {
        throw new Error("Failed to fetch tracking data");
      }
      
      const result = await response.json();
      setTrips(result.data || []);
      
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setError("فشل في تحميل بيانات التتبع");
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التتبع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshTrackingData = async () => {
    try {
      setRefreshing(true);
      await fetchTrackingData();
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات التتبع بنجاح",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const searchTrip = async () => {
    if (!searchTripNumber.trim()) {
      fetchTrackingData();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tracking?tripNumber=${encodeURIComponent(searchTripNumber)}`);
      
      if (!response.ok) {
        throw new Error("Trip not found");
      }

      const data = await response.json();
      setTrips(Array.isArray(data) ? data : [data]);
      
      if (data.length > 0) {
        setSelectedTripId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trip not found");
      setTrips([]);
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS": return <Truck className="h-4 w-4" />;
      case "DELIVERED": return <CheckCircle className="h-4 w-4" />;
      case "CANCELLED": return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
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

  const filteredTrips = trips.filter(tripData => 
    tripData.trip.tripNumber.toLowerCase().includes(searchTripNumber.toLowerCase()) ||
    tripData.trip.fromCity.nameAr.includes(searchTripNumber) ||
    tripData.trip.toCity.nameAr.includes(searchTripNumber)
  );

  const selectedTrip = trips.find(t => t.trip.id === selectedTripId);
  const activeTrips = trips.filter(t => t.trip.status === "IN_PROGRESS");
  const totalTrips = trips.length;

  if (status === "loading" || loading || trackingLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // If tracking is disabled by admin, show message
  if (!trackingEnabled) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">تتبع شحناتي</h1>
              <p className="text-muted-foreground">
                تابع موقع شحناتك في الوقت الفعلي
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <MapPin className="h-5 w-5" />
                التتبع غير متاح حالياً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">خدمة التتبع معطلة مؤقتاً</h3>
                <p className="text-muted-foreground mb-4">
                  عذراً، خدمة التتبع المباشر للشحنات غير متاحة في الوقت الحالي.
                  يرجى المحاولة لاحقاً أو التواصل مع خدمة العملاء.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => router.push('/customer')}>
                    <Package className="h-4 w-4 mr-2" />
                    العودة للوحة التحكم
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/customer/my-trips')}>
                    <Truck className="h-4 w-4 mr-2" />
                    عرض رحلاتي
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">تتبع شحناتي</h1>
            <p className="text-muted-foreground">
              تابع موقع شحناتك في الوقت الفعلي
            </p>
          </div>
          <Button onClick={fetchMyTrips} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              البحث عن رحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="أدخل رقم الرحلة..."
                value={searchTripNumber}
                onChange={(e) => setSearchTripNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchTrip()}
                className="flex-1"
              />
              <Button onClick={searchTrip} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الرحلات</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trips.length}</div>
              <p className="text-xs text-muted-foreground">
                رحلة مسجلة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرحلات النشطة</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeTrips.length}</div>
              <p className="text-xs text-muted-foreground">
                رحلة قيد التنفيذ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التتبع متاح</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{trackableTrips.length}</div>
              <p className="text-xs text-muted-foreground">
                رحلة قابلة للتتبع
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>رحلاتي</CardTitle>
                <CardDescription>
                  اختر رحلة لعرضها على الخريطة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trips.map((trip) => {
                  const lastLocation = getLastLocation(trip);
                  const isSelected = selectedTripId === trip.id;
                  
                  return (
                    <div
                      key={trip.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedTripId(trip.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{trip.tripNumber}</span>
                          <Badge className={getStatusColor(trip.status)}>
                            {getStatusText(trip.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Route className="h-4 w-4" />
                          {trip.fromCity} → {trip.toCity}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(trip.scheduledDate)}
                        </div>

                        {trip.driver && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {trip.driver.name}
                            {trip.driver.phone && (
                              <a 
                                href={`tel:${trip.driver.phone}`}
                                className="text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}

                        {lastLocation && trip.trackingEnabled && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <MapPin className="h-4 w-4" />
                            آخر تحديث: {new Date(lastLocation.timestamp).toLocaleTimeString('ar-SA')}
                          </div>
                        )}

                        {!trip.trackingEnabled && (
                          <div className="text-sm text-muted-foreground">
                            التتبع غير متاح لهذه الرحلة
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {trips.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد رحلات
                    </h3>
                    <p className="text-gray-500">
                      لم يتم العثور على أي رحلات مسجلة
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTrip ? (
              <>
                {/* Trip Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="h-5 w-5" />
                      تفاصيل الرحلة {selectedTrip.tripNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">الحالة</label>
                          <div className="mt-1">
                            <Badge className={getStatusColor(selectedTrip.status)}>
                              {getStatusText(selectedTrip.status)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">المسار</label>
                          <div className="mt-1 font-medium">
                            {selectedTrip.fromCity} → {selectedTrip.toCity}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">المركبة</label>
                          <div className="mt-1">{selectedTrip.vehicle}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">تاريخ الجدولة</label>
                          <div className="mt-1">{formatDate(selectedTrip.scheduledDate)}</div>
                        </div>
                        
                        {selectedTrip.actualStartDate && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">تاريخ البداية الفعلي</label>
                            <div className="mt-1">{formatDate(selectedTrip.actualStartDate)}</div>
                          </div>
                        )}
                        
                        {selectedTrip.estimatedArrival && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">الوصول المتوقع</label>
                            <div className="mt-1">{formatDate(selectedTrip.estimatedArrival)}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTrip.driver && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="text-sm font-medium text-muted-foreground">معلومات السائق</label>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="font-medium">{selectedTrip.driver.name}</span>
                          {selectedTrip.driver.phone && (
                            <a 
                              href={`tel:${selectedTrip.driver.phone}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Phone className="h-4 w-4" />
                              {selectedTrip.driver.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Map */}
                {selectedTrip.trackingEnabled ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>موقع الشحنة الحالي</CardTitle>
                      <CardDescription>
                        تتبع لحظي عبر Socket.IO + عرض المسار
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const logs = selectedTrip.trackingLogs || [];
                        const driverId = selectedTrip.driver?.id;
                        if (!driverId || logs.length === 0) {
                          // Fallback to existing polling map when we can't do live
                          return (
                            <TrackingMap 
                              tripId={selectedTrip.id}
                              height="400px"
                              autoRefresh={true}
                              refreshInterval={30000}
                            />
                          );
                        }
                        const routePoints = logs.map((l) => ({ lat: l.latitude, lng: l.longitude }));
                        const first = logs[0];
                        const last = logs[logs.length - 1] || first;
                        const start = { lat: first.latitude, lng: first.longitude };
                        const dest = { lat: last.latitude, lng: last.longitude };
                        return (
                          <LiveTrackingMap
                            driverId={driverId}
                            height="400px"
                            start={start}
                            destination={dest}
                            routePoints={routePoints}
                          />
                        );
                      })()}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        التتبع غير متاح
                      </h3>
                      <p className="text-gray-500">
                        التتبع اللحظي غير مفعل لهذه الرحلة
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Navigation className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    اختر رحلة للتتبع
                  </h3>
                  <p className="text-gray-500">
                    اختر رحلة من القائمة لعرض موقعها على الخريطة
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
