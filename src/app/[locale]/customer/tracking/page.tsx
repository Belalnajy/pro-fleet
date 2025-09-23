"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomerTrackingMap } from "@/components/maps/customer-tracking-map";
import { useLanguage } from "@/components/providers/language-provider";
import { translations } from "@/lib/translations";
import {
  Package,
  MapPin,
  User,
  Truck,
  Phone,
  Calendar,
  Route,
  Navigation,
  Activity,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Loader
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

export default function CustomerTrackingPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params);
  const { t, language } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Create a specific translation function for customer translations to avoid conflicts
  const translate = (key: string): string => {
    const customerTranslations = translations[language as keyof typeof translations];
    // Try to get from customer-specific translations first
    if (customerTranslations && typeof customerTranslations === 'object') {
      const translation = (customerTranslations as any)[key];
      if (translation && typeof translation === 'string') {
        return translation;
      }
    }
    // Fallback to the generic t function
    return t(key as any) || key;
  };
  
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
      router.push(`/${locale}/auth/signin`);
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
        setTrackingEnabled(true);
      }
    } catch (error) {
      console.error("Error checking tracking settings:", error);
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
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch tracking data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("API Response:", result);
      setTrips(result.data || []);
      
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setError(translate('error'));
      toast({
        title: translate('error'),
        description: translate('error'),
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
        title: translate('updated'),
        description: translate('trackingDataUpdated'),
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
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
      case "PENDING": return translate('pending');
      case "IN_PROGRESS": return translate('inProgress');
      case "DELIVERED": return translate('delivered');
      case "CANCELLED": return translate('cancelled');
      default: return status;
    }
  };

  const filteredTrips = trips.filter(tripData => 
    tripData.trip.tripNumber.toLowerCase().includes(searchTripNumber.toLowerCase()) ||
    tripData.trip.fromCity.nameAr.includes(searchTripNumber) ||
    tripData.trip.toCity.nameAr.includes(searchTripNumber)
  );

  const selectedTrip = trips.find(t => t.trip.id === selectedTripId);
  const activeTrips = trips.filter(t => t.trip.status === "IN_PROGRESS");
  const totalTrips = trips.length;

  if (trackingLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!trackingEnabled) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle>{translate('trackingServiceUnavailable')}</CardTitle>
              <CardDescription>
                {translate('trackingServiceUnavailableDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Button 
                onClick={() => router.push(`/${locale}/customer`)}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                {translate('backToDashboard')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/${locale}/customer/my-trips`)}
                className="w-full"
              >
                <Package className="h-4 w-4 ml-2" />
                {translate('viewMyTrips')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{translate('tripTracking')}</h1>
          <p className="text-gray-600">{translate('trackTripsRealTime')}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate('totalTrips')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTrips}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate('activeTrips')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeTrips.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translate('lastUpdate')}</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {selectedTrip?.trackingStats.lastUpdate 
                  ? new Date(selectedTrip.trackingStats.lastUpdate).toLocaleString('ar-SA')
                  : translate('noData')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshTrackingData}
                disabled={refreshing}
                className="mt-2"
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 ml-2" />
                )}
                {translate('refresh')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trips List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 ml-2" />
                  {translate('myTrips')}
                </CardTitle>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={translate('searchTripNumberCity')}
                    value={searchTripNumber}
                    onChange={(e) => setSearchTripNumber(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : filteredTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">{translate('noTripsFound')}</p>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/${locale}/customer/book-trip`)}
                      className="mt-4"
                    >
                      {translate('bookNewTrip')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredTrips.map((tripData) => (
                      <div
                        key={tripData.trip.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTripId === tripData.trip.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedTripId(tripData.trip.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {tripData.trip.tripNumber}
                          </span>
                          <Badge className={`${getStatusColor(tripData.trip.status)} text-xs`}>
                            {getStatusIcon(tripData.trip.status)}
                            <span className="mr-1">{getStatusText(tripData.trip.status)}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center mb-1">
                            <MapPin className="h-3 w-3 text-green-500 ml-1" />
                            {tripData.trip.fromCity.nameAr}
                          </div>
                          <div className="flex items-center mb-1">
                            <MapPin className="h-3 w-3 text-red-500 ml-1" />
                            {tripData.trip.toCity.nameAr}
                          </div>
                          {tripData.trip.driver && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 text-blue-500 ml-1" />
                              {tripData.trip.driver.name}
                            </div>
                          )}
                        </div>
                        {tripData.trackingStats.isActive && (
                          <div className="mt-2 text-xs text-green-600 flex items-center">
                            <Activity className="h-3 w-3 ml-1" />
                            {translate('active')} - {tripData.trackingStats.totalPoints} {translate('trackingPoints')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map and Details */}
          <div className="lg:col-span-2">
            {selectedTrip ? (
              <div className="space-y-6">
                {/* Trip Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Route className="h-5 w-5 ml-2" />
                        {translate('tripDetails')} {selectedTrip.trip.tripNumber}
                      </div>
                      <Badge className={getStatusColor(selectedTrip.trip.status)}>
                        {getStatusIcon(selectedTrip.trip.status)}
                        <span className="mr-1">{getStatusText(selectedTrip.trip.status)}</span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">{translate('routeInfo')}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-green-500 ml-2" />
                            <span>{translate('from')}: {selectedTrip.trip.fromCity.nameAr}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-red-500 ml-2" />
                            <span>{translate('to')}: {selectedTrip.trip.toCity.nameAr}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-blue-500 ml-2" />
                            <span>{translate('tripDate')}: {new Date(selectedTrip.trip.scheduledDate).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">{translate('driverVehicleInfo')}</h4>
                        <div className="space-y-2 text-sm">
                          {selectedTrip.trip.driver ? (
                            <>
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-blue-500 ml-2" />
                                <span>{translate('driver')}: {selectedTrip.trip.driver.name}</span>
                              </div>
                              {selectedTrip.trip.driver.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 text-green-500 ml-2" />
                                  <span>{selectedTrip.trip.driver.phone}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-gray-500">{translate('noDriverAssigned')}</div>
                          )}
                          
                          {selectedTrip.trip.vehicle && (
                            <div className="flex items-center">
                              <Truck className="h-4 w-4 text-purple-500 ml-2" />
                              <span>{selectedTrip.trip.vehicle.vehicleType.nameAr} - {selectedTrip.trip.vehicle.capacity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tracking Status */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">{translate('trackingStatus')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">{translate('trackingPoints')}:</span>
                          <div className="font-medium">{selectedTrip.trackingStats.totalPoints}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">{translate('lastUpdate')}:</span>
                          <div className="font-medium">
                            {selectedTrip.trackingStats.lastUpdate 
                              ? new Date(selectedTrip.trackingStats.lastUpdate).toLocaleTimeString('ar-SA')
                              : translate('noData')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">{translate('status')}:</span>
                          <div className={`font-medium ${selectedTrip.trackingStats.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                            {selectedTrip.trackingStats.isActive ? translate('active') : translate('inactive')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">{translate('driverTracking')}:</span>
                          <div className={`font-medium ${selectedTrip.trackingStats.driverTrackingEnabled ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedTrip.trackingStats.driverTrackingEnabled ? translate('enabled') : translate('disabled')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Map */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Navigation className="h-5 w-5 ml-2" />
                      {translate('trackingMap')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomerTrackingMap
                      tripId={selectedTrip.trip.id}
                      height="500px"
                      autoRefresh={selectedTrip.trackingStats.isActive}
                      refreshInterval={30000}
                    />
                  </CardContent>
                </Card>

                {/* Current Location Info */}
                {selectedTrip.currentLocation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 ml-2" />
                        {translate('currentLocation')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">{translate('latitude')}:</span>
                          <div className="font-medium">{selectedTrip.currentLocation.latitude.toFixed(6)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">{translate('longitude')}:</span>
                          <div className="font-medium">{selectedTrip.currentLocation.longitude.toFixed(6)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">{translate('speed')}:</span>
                          <div className="font-medium">
                            {selectedTrip.currentLocation.speed ? `${selectedTrip.currentLocation.speed} ${translate('kmh')}` : translate('unavailable')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">{translate('time')}:</span>
                          <div className="font-medium">
                            {new Date(selectedTrip.currentLocation.timestamp).toLocaleTimeString('ar-SA')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{translate('selectTripToTrack')}</h3>
                    <p className="text-gray-500">{translate('selectTripFromList')}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
