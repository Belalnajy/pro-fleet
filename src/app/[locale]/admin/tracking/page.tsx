"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrackingMap } from "@/components/maps/tracking-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Truck, 
  Users, 
  Activity, 
  RefreshCw,
  Navigation,
  Clock,
  Route,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface AdminTrip {
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
  deliveredDate?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  driver?: {
    id: string;
    carPlateNumber?: string;
    trackingEnabled?: boolean;
    isAvailable?: boolean;
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
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

export default function AdminTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTrips, setActiveTrips] = useState<AdminTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<AdminTrip | null>(null);
  const [updatingTracking, setUpdatingTracking] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    fetchActiveTrips();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActiveTrips, 30000);
    return () => clearInterval(interval);
  }, [session, status, router]);

  const fetchActiveTrips = async () => {
    try {
      setError(null);
      if (!refreshing) setIsLoading(true);
      
      const response = await fetch("/api/admin/trips");
      
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }

      const data = await response.json();
      
      // Filter for active trips (IN_PROGRESS) and trips with drivers
      const activeTripsData = Array.isArray(data) 
        ? data.filter((trip: AdminTrip) => 
            trip.status === "IN_PROGRESS" && trip.driver
          )
        : [];
      
      setActiveTrips(activeTripsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات التتبع",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActiveTrips();
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
      case "PENDING": return <Clock className="w-4 h-4" />;
      case "IN_PROGRESS": return <Truck className="w-4 h-4" />;
      case "DELIVERED": return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED": return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
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

  const toggleDriverTracking = async (driverId: string, currentStatus: boolean) => {
    try {
      setUpdatingTracking(driverId);
      
      const response = await fetch("/api/admin/tracking", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          driverId,
          trackingEnabled: !currentStatus
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update tracking status");
      }

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إيقاف'} التتبع للسائق`
      });

      // Refresh data
      fetchActiveTrips();
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة التتبع",
        variant: "destructive"
      });
    } finally {
      setUpdatingTracking(null);
    }
  };

  // Get city coordinates for mapping
  const getCityCoordinates = (cityName: string): [number, number] => {
    const cityCoordinates: { [key: string]: [number, number] } = {
      'الرياض': [24.7136, 46.6753],
      'جدة': [21.3891, 39.8579],
      'مكة': [21.4225, 39.8262],
      'المدينة': [24.5247, 39.5692],
      'الدمام': [26.4207, 50.0888],
      'تبوك': [28.3998, 36.5700],
      'Riyadh': [24.7136, 46.6753],
      'Jeddah': [21.3891, 39.8579],
      'Mecca': [21.4225, 39.8262],
      'Medina': [24.5247, 39.5692],
      'Dammam': [26.4207, 50.0888],
      'Tabuk': [28.3998, 36.5700]
    };

    return cityCoordinates[cityName] || [24.7136, 46.6753]; // Default to Riyadh
  };

  // Get real tracking data with start/end points
  const getRealTrackingData = (trip: AdminTrip) => {
    const startPoint = getCityCoordinates(trip.fromCity.name);
    const endPoint = getCityCoordinates(trip.toCity.name);
    
    return {
      startPoint: {
        id: `start-${trip.id}`,
        latitude: startPoint[0],
        longitude: startPoint[1],
        timestamp: trip.scheduledDate,
        type: 'start' as const,
        name: trip.fromCity.name
      },
      endPoint: {
        id: `end-${trip.id}`,
        latitude: endPoint[0],
        longitude: endPoint[1],
        timestamp: trip.scheduledDate,
        type: 'end' as const,
        name: trip.toCity.name
      },
      currentLocation: trip.trackingLogs && trip.trackingLogs.length > 0 
        ? trip.trackingLogs[0] // Most recent tracking point
        : null,
      trackingLogs: trip.trackingLogs || [],
      hasRealTracking: trip.trackingLogs && trip.trackingLogs.length > 0
    };
  };

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>جارٍ تحميل بيانات التتبع...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">تتبع الرحلات</h1>
            <p className="text-muted-foreground">
              مراقبة الرحلات النشطة وتتبع مواقع السائقين في الوقت الفعلي
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
              </p>
            )}
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرحلات النشطة</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTrips.length}</div>
              <p className="text-xs text-muted-foreground">
                رحلات قيد التنفيذ حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">السائقون المتصلون</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeTrips.filter(trip => trip.driver?.trackingEnabled).length}
              </div>
              <p className="text-xs text-muted-foreground">
                سائق متاح للتتبع
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نقاط التتبع</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeTrips.reduce((total, trip) => {
                  const realData = getRealTrackingData(trip);
                  return total + realData.trackingLogs.length;
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                نقطة تتبع حقيقية
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل التحديث</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30</div>
              <p className="text-xs text-muted-foreground">
                ثانية بين التحديثات
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>الرحلات النشطة</CardTitle>
            <CardDescription>
              قائمة بجميع الرحلات قيد التنفيذ مع معلومات التتبع
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">لا توجد رحلات نشطة</p>
                <p className="text-muted-foreground">
                  لا توجد رحلات قيد التنفيذ في الوقت الحالي
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الرحلة</TableHead>
                      <TableHead>المسار</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>السائق</TableHead>
                      <TableHead>المركبة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التتبع</TableHead>
                      <TableHead>آخر موقع</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">
                          {trip.tripNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{trip.fromCity.name}</span>
                            <Navigation className="w-4 h-4 text-muted-foreground" />
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="text-sm">{trip.toCity.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trip.customer.name}</p>
                            <p className="text-sm text-muted-foreground">{trip.customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.driver ? (
                            <div>
                              <p className="font-medium">{trip.driver.user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {trip.driver.carPlateNumber || 'غير محدد'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير مُعيّن</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trip.vehicle.vehicleType.nameAr}</p>
                            <p className="text-sm text-muted-foreground">{trip.vehicle.capacity}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(trip.status)}
                              {getStatusText(trip.status)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trip.driver && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={trip.driver.trackingEnabled || false}
                                onCheckedChange={() => 
                                  toggleDriverTracking(
                                    trip.driver!.id, 
                                    trip.driver!.trackingEnabled || false
                                  )
                                }
                                disabled={updatingTracking === trip.driver.id}
                              />
                              <span className="text-sm">
                                {trip.driver.trackingEnabled ? 'مُفعّل' : 'مُعطّل'}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const realData = getRealTrackingData(trip);
                            if (realData.currentLocation) {
                              return (
                                <div className="text-sm">
                                  <p>📍 {realData.currentLocation.latitude.toFixed(4)}, {realData.currentLocation.longitude.toFixed(4)}</p>
                                  <p className="text-muted-foreground">
                                    {new Date(realData.currentLocation.timestamp).toLocaleTimeString('ar-SA')}
                                  </p>
                                  <span className="text-xs text-green-600">موقع حقيقي</span>
                                </div>
                              );
                            }
                            return (
                              <div className="text-sm text-muted-foreground">
                                <p>لا يوجد موقع حالي</p>
                                <span className="text-xs">لم يبدأ التتبع</span>
                              </div>
                            );
                          })()
                        }</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTrip(trip)}
                            >
                              <Route className="w-4 h-4 mr-1" />
                              عرض المسار
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map View */}
        {selectedTrip && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>خريطة التتبع - {selectedTrip.tripNumber}</CardTitle>
                  <CardDescription>
                    {selectedTrip.fromCity.name} → {selectedTrip.toCity.name}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTrip(null)}
                >
                  إغلاق الخريطة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trip Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">نقطة البداية</p>
                      <p className="text-sm text-muted-foreground">{selectedTrip.fromCity.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">نقطة النهاية</p>
                      <p className="text-sm text-muted-foreground">{selectedTrip.toCity.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">السائق</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTrip.driver?.user.name || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="space-y-2">
                  <h4 className="font-medium">معلومات السائق</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الاسم:</span>
                      <span className="font-medium">{selectedTrip.driver?.user?.name || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">رقم الهاتف:</span>
                      <span className="font-medium">{selectedTrip.driver?.user?.phone || 'غير متاح'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">حالة التتبع:</span>
                      <Badge variant={selectedTrip.driver?.trackingEnabled ? "default" : "secondary"}>
                        {selectedTrip.driver?.trackingEnabled ? 'مفعل' : 'غير مفعل'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">عدد نقاط التتبع:</span>
                      <Badge variant={selectedTrip.trackingLogs && selectedTrip.trackingLogs.length > 0 ? "default" : "outline"}>
                        {(() => {
                          const realData = getRealTrackingData(selectedTrip);
                          return realData.hasRealTracking 
                            ? `${realData.trackingLogs.length} نقطة حقيقية`
                            : 'لا يوجد تتبع';
                        })()
                        }
                      </Badge>
                    </div>
                    {(() => {
                      const realData = getRealTrackingData(selectedTrip);
                      if (realData.currentLocation) {
                        return (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">آخر تحديث:</span>
                            <span className="font-medium text-green-600">
                              {new Date(realData.currentLocation.timestamp).toLocaleString('ar-SA')}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Route and Tracking Information */}
                {(() => {
                  const realData = getRealTrackingData(selectedTrip);
                  
                  return (
                    <div className="space-y-4">
                      {/* Route Points */}
                      <div className="space-y-2">
                        <h4 className="font-medium">نقاط المسار</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Start Point */}
                          <div className="flex items-center justify-between text-sm p-3 bg-green-50 rounded border border-green-200">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">نقطة البداية</p>
                                <p className="text-green-600">{realData.startPoint.name}</p>
                              </div>
                            </div>
                            <div className="text-xs text-green-600">
                              {realData.startPoint.latitude.toFixed(4)}, {realData.startPoint.longitude.toFixed(4)}
                            </div>
                          </div>
                          
                          {/* End Point */}
                          <div className="flex items-center justify-between text-sm p-3 bg-red-50 rounded border border-red-200">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-600" />
                              <div>
                                <p className="font-medium text-red-800">نقطة النهاية</p>
                                <p className="text-red-600">{realData.endPoint.name}</p>
                              </div>
                            </div>
                            <div className="text-xs text-red-600">
                              {realData.endPoint.latitude.toFixed(4)}, {realData.endPoint.longitude.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current Location */}
                      {realData.currentLocation ? (
                        <div className="space-y-2">
                          <h4 className="font-medium">الموقع الحالي</h4>
                          <div className="flex items-center justify-between text-sm p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="font-medium text-blue-800">موقع السائق</p>
                                <p className="text-blue-600">📍 {realData.currentLocation.latitude.toFixed(6)}, {realData.currentLocation.longitude.toFixed(6)}</p>
                              </div>
                            </div>
                            <div className="text-xs text-blue-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(realData.currentLocation.timestamp).toLocaleTimeString('ar-SA')}
                              </div>
                              {realData.currentLocation.speed && (
                                <div className="mt-1">السرعة: {realData.currentLocation.speed} كم/س</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            لا يوجد موقع حالي للسائق. قد يكون التتبع غير مفعل أو لم يبدأ السائق الرحلة بعد.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Tracking History */}
                      {realData.trackingLogs.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">تاريخ التتبع ({realData.trackingLogs.length} نقطة)</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {realData.trackingLogs.slice(0, 5).map((log, index) => (
                              <div key={log.id} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-blue-500" />
                                  <span>📍 {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
                                </div>
                              </div>
                            ))}
                            {realData.trackingLogs.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                ... و {realData.trackingLogs.length - 5} نقطة أخرى
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Map Container */}
                <div className="h-96 rounded-lg overflow-hidden border">
                  {(() => {
                    const realData = getRealTrackingData(selectedTrip);
                    // Use current location if available, otherwise use start point
                    const centerPoint = realData.currentLocation 
                      ? [realData.currentLocation.latitude, realData.currentLocation.longitude]
                      : [realData.startPoint.latitude, realData.startPoint.longitude];
                    
                    return (
                      <TrackingMap
                        tripId={selectedTrip.id}
                        showRoute={true}
                        center={centerPoint as [number, number]}
                        adminMode={true}
                        height="384px"
                        autoRefresh={true}
                        refreshInterval={30000}
                      />
                    );
                    return (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-lg font-medium mb-2">لا توجد بيانات خريطة</p>
                          <p className="text-muted-foreground">
                            لا يمكن عرض الخريطة في الوقت الحالي
                          </p>
                        </div>
                      </div>
                    );
                  })()
                }</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
