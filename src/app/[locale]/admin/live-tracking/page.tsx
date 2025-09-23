"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import EnhancedLiveTrackingMap from "@/components/maps/enhanced-live-tracking-map";
import { 
  MapPin, 
  Navigation, 
  Clock,
  RefreshCw,
  Truck,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Users,
  Search,
  Filter,
  Eye,
  Phone,
  Calendar,
  Package,
  TrendingUp,
  Activity
} from "lucide-react";

interface TrackingData {
  trip: {
    id: string;
    tripNumber: string;
    status: string;
    fromCity: string;
    toCity: string;
    fromCityCoords: {
      lat: number;
      lng: number;
    };
    toCityCoords: {
      lat: number;
      lng: number;
    };
    vehicle: string;
    scheduledDate: string;
    actualStartDate?: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
  };
  driver: {
    id: string;
    name: string;
    email: string;
    phone: string;
    trackingEnabled: boolean;
    isAvailable: boolean;
  } | null;
  lastLocation: {
    id: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    timestamp: string;
    driverId: string;
    tripId: string;
  } | null;
  trackingEnabled: boolean;
}

export default function AdminLiveTrackingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TrackingData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trackingFilter, setTrackingFilter] = useState("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatingTracking, setUpdatingTracking] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push(`/${locale}/auth/signin`);
      return;
    }
    fetchTrackingData();
  }, [session, status, router]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchTrackingData = async () => {
    try {
      setError(null);
      
      const response = await fetch("/api/admin/tracking?activeOnly=true");
      
      if (!response.ok) {
        throw new Error("Failed to fetch tracking data");
      }

      const data = await response.json();
      setTrackingData(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast({
        variant: "destructive",
        title: "❌ خطأ في تحميل البيانات",
        description: "فشل في تحميل بيانات التتبع"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverTracking = async (driverId: string, enabled: boolean) => {
    try {
      const response = await fetch("/api/admin/tracking", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          trackingEnabled: enabled
        })
      });

      if (response.ok) {
        await fetchTrackingData();
        toast({
          title: enabled ? "✅ تم تفعيل التتبع" : "⏹️ تم إيقاف التتبع",
          description: `تم ${enabled ? 'تفعيل' : 'إيقاف'} التتبع للسائق بنجاح`
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "❌ خطأ",
        description: "فشل في تحديث إعدادات التتبع"
      });
    }
  };

  // Filter data based on search and filters
  const filteredData = trackingData.filter(item => {
    const matchesSearch = 
      item.trip.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.driver?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.trip.status === statusFilter;
    
    const matchesTracking = 
      trackingFilter === "all" || 
      (trackingFilter === "enabled" && item.trackingEnabled) ||
      (trackingFilter === "disabled" && !item.trackingEnabled);
    
    return matchesSearch && matchesStatus && matchesTracking;
  });
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
      case "IN_PROGRESS": return "قيد التنفيذ";
      case "DELIVERED": return "تم التسليم";
      case "CANCELLED": return "ملغية";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSinceUpdate = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    return `منذ ${diffHours} ساعة`;
  };

  // Statistics
  const stats = {
    total: trackingData.length,
    active: trackingData.filter(item => {
      const activeStatuses = ["ASSIGNED", "IN_PROGRESS", "EN_ROUTE_PICKUP", "AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "AT_DESTINATION"];
      return activeStatuses.includes(item.trip.status);
    }).length,
    tracking: trackingData.filter(item => item.trackingEnabled && item.lastLocation).length,
    offline: trackingData.filter(item => !item.trackingEnabled || !item.lastLocation).length
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>جاري تحميل بيانات التتبع المباشر...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">{t("activeTripsTracking")}</h1>
            <p className="text-muted-foreground">
              {t("monitorActiveTripsRealTime")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <p className="text-sm text-muted-foreground">
                {t("lastUpdated")}: {lastUpdate.toLocaleTimeString('ar-SA')}
              </p>
            )}
            <Button 
              onClick={fetchTrackingData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t("refresh")}
            </Button>
          </div>
        </div>

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
              <CardTitle className="text-sm font-medium">{t("totalTrips")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {t("trips")} {t("tracking")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("activeTrips")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                قيد التنفيذ حالياً
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("connectedDrivers")}</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tracking}</div>
              <p className="text-xs text-muted-foreground">
                متاح للتتبع المباشر
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("updateRate")}</CardTitle>
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t("searchAndFilter")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder={`${t("search")}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">في الانتظار</SelectItem>
                  <SelectItem value="IN_PROGRESS">قيد التنفيذ</SelectItem>
                  <SelectItem value="DELIVERED">تم التسليم</SelectItem>
                  <SelectItem value="CANCELLED">ملغية</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={trackingFilter} onValueChange={setTrackingFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="حالة التتبع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع السائقين</SelectItem>
                  <SelectItem value="enabled">متتبع</SelectItem>
                  <SelectItem value="disabled">غير متتبع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("activeTrips")}</CardTitle>
            <CardDescription>
              {t("activeTripsListDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">{t("noActiveTrips")}</p>
                <p className="text-muted-foreground">
                  {t("noTripsInProgress")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("tripNumber")}</TableHead>
                      <TableHead>{t("route")}</TableHead>
                      <TableHead>{t("customer")}</TableHead>
                      <TableHead>{t("driver")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("tracking")}</TableHead>
                      <TableHead>{t("lastLocation")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.trip.id}>
                        <TableCell className="font-medium">
                          {item.trip.tripNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{item.trip.fromCity}</span>
                            <Navigation className="w-4 h-4 text-muted-foreground" />
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="text-sm">{item.trip.toCity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.customer.name}</p>
                            <p className="text-sm text-muted-foreground">{item.customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.driver ? (
                            <div>
                              <p className="font-medium">{item.driver.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.driver.phone || t("notSpecified")}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{t("notAssigned")}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.trip.status)}>
                            {getStatusText(item.trip.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.trackingEnabled && item.lastLocation ? "default" : "secondary"}>
                              {item.trackingEnabled && item.lastLocation ? (
                                <>
                                  <Wifi className="w-3 h-3 mr-1" />
                                  متصل
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-3 h-3 mr-1" />
                                  غير متصل
                                </>
                              )}
                            </Badge>
                            {item.driver && (
                              <Switch
                                checked={item.trackingEnabled}
                                onCheckedChange={(checked) => toggleDriverTracking(item.driver!.id, checked)}
                                disabled={updatingTracking === item.driver.id}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.lastLocation ? (
                            <div className="text-sm">
                              <p className="font-mono text-xs">
                                {item.lastLocation.latitude.toFixed(4)}, {item.lastLocation.longitude.toFixed(4)}
                              </p>
                              <p className="text-muted-foreground">
                                {getTimeSinceUpdate(item.lastLocation.timestamp)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">لا يوجد موقع</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTrip(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Tracking Map */}
        {selectedTrip && (
          <Card>
            <CardHeader>
              <CardTitle>خريطة التتبع المباشر</CardTitle>
              <CardDescription>
                موقع الرحلة المحددة على الخريطة
                {lastUpdate && (
                  <span className="ml-2">
                    • آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trip Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">الرحلة المحددة: {selectedTrip.trip.tripNumber}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("driver")}:</span>
                      <span className="ml-2 font-medium">{selectedTrip.driver?.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("customer")}:</span>
                      <span className="ml-2 font-medium">{selectedTrip.customer.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("route")}:</span>
                      <span className="ml-2 font-medium">{selectedTrip.trip.fromCity} → {selectedTrip.trip.toCity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("status")}:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedTrip.trip.status)}`}>
                        {getStatusText(selectedTrip.trip.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="h-96 rounded-lg overflow-hidden border">
                  <EnhancedLiveTrackingMap
                    currentLocation={selectedTrip.lastLocation ? {
                      lat: selectedTrip.lastLocation.latitude,
                      lng: selectedTrip.lastLocation.longitude,
                      speed: selectedTrip.lastLocation.speed,
                      heading: selectedTrip.lastLocation.heading
                    } : null}
                    start={selectedTrip ? {
                      lat: selectedTrip.trip.fromCityCoords.lat,
                      lng: selectedTrip.trip.fromCityCoords.lng
                    } : undefined}
                    destination={selectedTrip ? {
                      lat: selectedTrip.trip.toCityCoords.lat,
                      lng: selectedTrip.trip.toCityCoords.lng
                    } : undefined}
                    height="384px"
                    initialZoom={8}
                    showPathTrail={true}
                    showRecenterButton={true}
                    className="w-full enhanced-live-tracking-map"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
