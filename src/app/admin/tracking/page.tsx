"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('@/components/maps/tracking-map').then(mod => mod.TrackingMap), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg"><p>جارٍ تحميل الخريطة...</p></div>
});

const LiveTrackingMap = dynamic(() => import('@/components/maps/live-tracking-map'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center w-full h-full bg-muted rounded-lg"><p>جارٍ تحميل الخريطة الحية...</p></div>
});
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Truck, 
  Users, 
  Activity, 
  Eye, 
  EyeOff,
  RefreshCw,
  Navigation,
  Clock
} from "lucide-react";

interface ActiveTrip {
  trip: {
    id: string;
    tripNumber: string;
    status: string;
    fromCity: string;
    toCity: string;
    vehicle: string;
    scheduledDate: string;
    actualStartDate?: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    trackingEnabled: boolean;
    isAvailable: boolean;
  };
  lastLocation?: {
    id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  };
  trackingEnabled: boolean;
}

export default function AdminTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [updatingTracking, setUpdatingTracking] = useState<string | null>(null);
  const [routeView, setRouteView] = useState<{
    tripId: string;
    driverId?: string;
    start: { lat: number; lng: number };
    dest: { lat: number; lng: number };
    routePoints: { lat: number; lng: number }[];
  } | null>(null);
  const [previewRoute, setPreviewRoute] = useState<{
    start: { lat: number; lng: number };
    dest: { lat: number; lng: number };
    routePoints: { lat: number; lng: number }[];
  } | null>(null);

  // Fetch tracking logs and prepare a route between oldest and newest points
  const showTripPath = async (tripId: string, driverId?: string) => {
    try {
      const res = await fetch(`/api/tracking?tripId=${tripId}&limit=200`);
      if (!res.ok) throw new Error("Failed to load tracking logs");
      const logs: Array<{ latitude: number; longitude: number; timestamp: string }> = await res.json();
      console.log("[RouteViewer] fetched logs:", logs.length, { tripId });
      if (!logs || logs.length === 0) {
        setError("لا توجد نقاط مسار متاحة لهذه الرحلة");
        return;
      }
      // API returns desc by timestamp; reverse to chronological
      const ordered = [...logs].reverse();
      const points = ordered.map((l) => ({ lat: l.latitude, lng: l.longitude }));
      const start = points[0];
      const dest = points[points.length - 1];
      setRouteView({ tripId, driverId, start, dest, routePoints: points });
      console.log("[RouteViewer] route points prepared:", points.length, { start, dest });
      setMapCenter([start.lat, start.lng]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل المسار");
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    fetchActiveTrips();
  }, [session, status, router]);

  // Prefetch logs for the first active, trackable trip to power the preview map
  useEffect(() => {
    const t = activeTrips.find(
      (t) => !!t.driver?.id && !!t.lastLocation && t.trackingEnabled
    );
    if (!t) {
      setPreviewRoute(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/tracking?tripId=${t.trip.id}&limit=200`);
        if (!res.ok) throw new Error("Failed to load tracking logs");
        const logs: Array<{ latitude: number; longitude: number; timestamp: string }> = await res.json();
        console.log("[Preview] fetched logs:", logs.length, { tripId: t.trip.id });
        if (!logs || logs.length < 2) {
          setPreviewRoute(null);
          return;
        }
        const ordered = [...logs].reverse();
        const points = ordered.map((l) => ({ lat: l.latitude, lng: l.longitude }));
        setPreviewRoute({ start: points[0], dest: points[points.length - 1], routePoints: points });
        console.log("[Preview] route points prepared:", points.length);
      } catch {
        setPreviewRoute(null);
      }
    })();
  }, [activeTrips]);

  const fetchActiveTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/tracking?activeOnly=true");
      
      if (!response.ok) {
        throw new Error("Failed to fetch tracking data");
      }

      const data = await response.json();
      setActiveTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDriverTracking = async (driverId: string, enabled: boolean) => {
    try {
      setUpdatingTracking(driverId);
      
      const response = await fetch("/api/admin/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          trackingEnabled: enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tracking settings");
      }

      // Refresh data
      await fetchActiveTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tracking");
    } finally {
      setUpdatingTracking(null);
    }
  };

  const toggleCustomerTracking = async (customerId: string, enabled: boolean) => {
    try {
      setUpdatingTracking(customerId);
      
      const response = await fetch("/api/admin/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          trackingEnabled: enabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer tracking visibility");
      }

      // Refresh data
      await fetchActiveTrips();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tracking visibility");
    } finally {
      setUpdatingTracking(null);
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

  const formatLastUpdate = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "الآن";
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    return updateTime.toLocaleDateString('ar-SA');
  };

  const activeTripsCount = activeTrips.filter(trip => trip.trip.status === "IN_PROGRESS").length;
  const trackingEnabledCount = activeTrips.filter(trip => trip.trackingEnabled).length;
  const driversOnlineCount = activeTrips.filter(trip => trip.driver?.isAvailable).length;

  if (status === "loading" || isLoading) {
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
            <h1 className="text-3xl font-bold tracking-tight">تتبع الرحلات اللحظي</h1>
            <p className="text-muted-foreground">
              مراقبة وإدارة جميع الرحلات النشطة في الوقت الفعلي
            </p>
          </div>
          <Button onClick={fetchActiveTrips} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرحلات النشطة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeTripsCount}</div>
              <p className="text-xs text-muted-foreground">
                من أصل {activeTrips.length} رحلة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">التتبع مفعل</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{trackingEnabledCount}</div>
              <p className="text-xs text-muted-foreground">
                رحلة يتم تتبعها
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">السائقين المتاحين</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{driversOnlineCount}</div>
              <p className="text-xs text-muted-foreground">
                سائق متاح حالياً
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {new Set(activeTrips.map(trip => trip.customer.id)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                عميل لديه رحلات نشطة
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
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              الخريطة
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              قائمة الرحلات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            {/* Map View */}
            <div className="col-span-1 lg:col-span-3 h-[600px] bg-muted rounded-lg">
              <TrackingMap 
                showAllActiveTrips={true}
                center={mapCenter}
              />
            </div>

            {/* On-demand route viewer */}
            {routeView && (
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle>مسار الرحلة</CardTitle>
                    <CardDescription>
                      إظهار المسار بين نقطة البداية والوجهة
                      {routeView && (
                        <span className="ml-2 text-xs text-muted-foreground">عدد نقاط المسار: {routeView.routePoints.length}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" onClick={() => setRouteView(null)}>إغلاق</Button>
                </CardHeader>
                <CardContent>
                  <LiveTrackingMap
                    driverId={routeView.driverId || routeView.tripId}
                    start={routeView.start}
                    destination={routeView.dest}
                    routePoints={routeView.routePoints}
                    height="360px"
                  />
                </CardContent>
              </Card>
            )}

            {/* Live Driver Preview (first available) */}
            {(() => {
              const t = activeTrips.find(
                (t) => !!t.driver?.id && !!t.lastLocation && t.trackingEnabled
              );
              if (!t || !t.driver || !t.lastLocation) return null;
              const start = previewRoute?.start || { lat: t.lastLocation.latitude, lng: t.lastLocation.longitude };
              const dest = previewRoute?.dest || start;
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>تتبع لحظي (معاينة) — {t.trip.tripNumber}</CardTitle>
                    <CardDescription>
                      خريطة لحظية للسائق: {t.driver.name}
                      {previewRoute && (
                        <span className="ml-2 text-xs text-muted-foreground">عدد نقاط المسار: {previewRoute.routePoints.length}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LiveTrackingMap
                      driverId={t.driver.id}
                      start={start}
                      destination={dest}
                      routePoints={previewRoute?.routePoints}
                      height="360px"
                    />
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            {/* Trips Table */}
            <Card>
              <CardHeader>
                <CardTitle>الرحلات النشطة</CardTitle>
                <CardDescription>
                  إدارة تتبع الرحلات وصلاحيات العرض للعملاء
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الرحلة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المسار</TableHead>
                      <TableHead>السائق</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>آخر موقع</TableHead>
                      <TableHead>التتبع</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeTrips.map((tripData, index) => (
                      <TableRow 
                        key={`${tripData.trip.id}-${index}`}
                        onClick={() => tripData.lastLocation && setMapCenter([tripData.lastLocation.latitude, tripData.lastLocation.longitude])}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          {tripData.trip.tripNumber}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(tripData.trip.status)}>
                            {getStatusText(tripData.trip.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {typeof tripData.trip.fromCity === 'object' ? (tripData.trip.fromCity as any)?.name || 'Unknown' : tripData.trip.fromCity} → {typeof tripData.trip.toCity === 'object' ? (tripData.trip.toCity as any)?.name || 'Unknown' : tripData.trip.toCity}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tripData.driver ? (
                            <div className="space-y-1">
                              <div className="font-medium">{tripData.driver.name}</div>
                              <div className="flex items-center gap-2">
                                <Badge variant={tripData.driver.isAvailable ? "default" : "secondary"}>
                                  {tripData.driver.isAvailable ? "متاح" : "غير متاح"}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">غير محدد</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{tripData.customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {tripData.customer.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tripData.lastLocation ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                📍 {tripData.lastLocation.latitude.toFixed(4)}, {tripData.lastLocation.longitude.toFixed(4)}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatLastUpdate(tripData.lastLocation.timestamp)}
                              </div>
                              {tripData.lastLocation.speed && (
                                <div className="text-xs text-blue-600">
                                  🚗 {tripData.lastLocation.speed} كم/س
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">لا يوجد موقع</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={tripData.trackingEnabled}
                              onCheckedChange={(checked) => {
                                if (tripData.driver) {
                                  toggleDriverTracking(tripData.driver.id, checked);
                                }
                              }}
                              disabled={!tripData.driver || updatingTracking === tripData.driver?.id}
                            />
                            <span className="text-sm">
                              {tripData.trackingEnabled ? "مفعل" : "معطل"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => tripData.lastLocation && setMapCenter([
                                tripData.lastLocation.latitude,
                                tripData.lastLocation.longitude,
                              ])}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showTripPath(tripData.trip.id, tripData.driver?.id)}
                              title="عرض المسار"
                            >
                              <Navigation className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCustomerTracking(tripData.customer.id, !tripData.trackingEnabled)}
                              disabled={updatingTracking === tripData.customer.id}
                            >
                              {tripData.trackingEnabled ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {activeTrips.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      لا توجد رحلات نشطة
                    </h3>
                    <p className="text-gray-500">
                      لا توجد رحلات نشطة حالياً للعرض على الخريطة
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
