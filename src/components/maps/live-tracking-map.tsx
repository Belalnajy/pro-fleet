"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import io, { Socket } from "socket.io-client";

// Dynamic imports to avoid SSR issues with react-leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export type LatLng = { lat: number; lng: number };

export interface LiveTrackingMapProps {
  // Driver/socket identification
  driverId: string; // used as room or filter key for socket events
  socketUrl?: string; // default will use window.location.origin
  eventName?: string; // default: "driver:location"

  // Trip route
  start: LatLng;
  destination: LatLng;
  // Optional precomputed route points; if omitted we draw straight line start->destination
  routePoints?: LatLng[];

  // UI/Map options
  height?: string; // e.g. "400px", default "400px"
  initialZoom?: number; // default 12
  showPathTrail?: boolean; // show the breadcrumb of received points; default true
  // Dev helper: ask server to simulate driver movement between start and destination
  mockSimulation?: boolean;
  // UI helper: show a button to recenter the map to the track/driver
  showRecenterButton?: boolean;
}

// Leaflet is dynamically imported on client to avoid SSR "window is not defined"
// We initialize icons after Leaflet loads
let defaultIconRef: any = null;
let driverIconRef: any = null;

export default function LiveTrackingMap({
  driverId,
  socketUrl,
  eventName = "driver:location",
  start,
  destination,
  routePoints,
  height = "400px",
  initialZoom = 12,
  showPathTrail = true,
  mockSimulation = false,
  showRecenterButton = true,
}: LiveTrackingMapProps) {
  const [driverPos, setDriverPos] = useState<LatLng | null>(null);
  const [trail, setTrail] = useState<LatLng[]>([]);
  const mapRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const [LRef, setLRef] = useState<any>(null);

  // Prepare route polyline points
  const routePolyline = useMemo<[number, number][]>(() => {
    if (routePoints && routePoints.length > 1) {
      return routePoints.map((p) => [p.lat, p.lng]);
    }
    return [start, destination].map((p) => [p.lat, p.lng]);
  }, [routePoints, start, destination]);

  // Decide initial center
  const initialCenter = useMemo<[number, number]>(() => {
    if (driverPos) return [driverPos.lat, driverPos.lng];
    return [start.lat, start.lng];
  }, [driverPos, start]);

  // Setup socket connection
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Dynamically load Leaflet on client only
    if (!LRef) {
      import("leaflet").then((mod) => {
        const L = mod.default ?? (mod as any);
        setLRef(L);
        if (!defaultIconRef) {
          defaultIconRef = new L.Icon({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
        }
        if (!driverIconRef) {
          driverIconRef = new L.DivIcon({
            className:
              "bg-red-500 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center",
            html: '<div style="width: 16px; height: 16px; border-radius: 9999px; background: #ef4444; border: 2px solid #fff;"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
        }
      });
    }

    const url = socketUrl || window.location.origin;
    const socket = io(url, {
      path: "/api/socketio",
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Join room or register interest by driverId
    socket.emit("driver:join", { driverId });

    // Dev: ask server to start mock simulation if requested
    if (mockSimulation) {
      socket.emit("mock:driver:start", {
        driverId,
        start,
        dest: destination,
        intervalMs: 1500,
      });
    }

    // Expect payload shape: { driverId, lat, lng, speed?, heading?, ts? }
    const onLocation = (payload: any) => {
      if (!payload) return;
      if (payload.driverId && payload.driverId !== driverId) return;
      if (typeof payload.lat !== "number" || typeof payload.lng !== "number") return;

      const pos = { lat: payload.lat, lng: payload.lng } as LatLng;
      setDriverPos(pos);
      setTrail((prev) => (showPathTrail ? [...prev, pos] : prev));

      // Smooth recenter
      if (mapRef.current) {
        try {
          const currentZoom = mapRef.current.getZoom();
          mapRef.current.flyTo([pos.lat, pos.lng], currentZoom, { duration: 0.5 });
        } catch {}
      }
    };

    socket.on(eventName, onLocation);

    return () => {
      socket.off(eventName, onLocation);
      if (mockSimulation) {
        socket.emit("mock:driver:stop", { driverId });
      }
      socket.emit("driver:leave", { driverId });
      socket.disconnect();
    };
  }, [driverId, eventName, socketUrl, showPathTrail, mockSimulation, start, destination]);

  // Whenever start changes, center the map there (initial mount handled by MapContainer props)
  useEffect(() => {
    if (mapRef.current && !driverPos) {
      try { mapRef.current.setView([start.lat, start.lng], initialZoom); } catch {}
    }
  }, [start, driverPos, initialZoom]);

  // Fit bounds to the provided route if there are multiple points
  useEffect(() => {
    if (!mapRef.current || !LRef) return;
    if (routePolyline.length > 1) {
      try {
        const bounds = LRef.latLngBounds(routePolyline as any);
        mapRef.current.fitBounds(bounds, { padding: [30, 30] });
      } catch {}
    }
  }, [routePolyline]);

  const recenter = () => {
    if (!mapRef.current) return;
    try {
      const currentZoom = mapRef.current.getZoom();
      if (driverPos) {
        mapRef.current.flyTo([driverPos.lat, driverPos.lng], currentZoom, { duration: 0.5 });
        return;
      }
      if (routePolyline.length > 1 && LRef) {
        const bounds = LRef.latLngBounds(routePolyline as any);
        mapRef.current.fitBounds(bounds, { padding: [30, 30] });
        return;
      }
      mapRef.current.setView([start.lat, start.lng], initialZoom);
    } catch {}
  };

  return (
    <div className="w-full rounded-lg border overflow-hidden">
      <div className="relative" style={{ height }}>
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          ref={mapRef as any}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Trip route polyline */}
          <Polyline positions={routePolyline as any} color="#3b82f6" weight={4} opacity={0.6} />

          {/* Start and destination markers */}
          {LRef && defaultIconRef && (
          <Marker position={[start.lat, start.lng]} icon={defaultIconRef}>
            <Popup>نقطة البداية</Popup>
          </Marker>
          )}
          {LRef && defaultIconRef && (
          <Marker position={[destination.lat, destination.lng]} icon={defaultIconRef}>
            <Popup>الوجهة</Popup>
          </Marker>
          )}
          {showRecenterButton && (
          <button
            type="button"
            onClick={recenter}
            className="absolute top-3 right-3 z-[10000] rounded-md bg-white text-gray-900 px-3 py-1.5 text-xs shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-[0.98] pointer-events-auto"
            title="الرجوع للمسار"
            aria-label="الرجوع للمسار"
          >
            الرجوع للمسار
          </button>
        )}
          {/* Driver live marker */}
          {driverPos && LRef && driverIconRef && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIconRef}>
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">موقع السائق</div>
                  <div className="text-muted-foreground">{driverPos.lat.toFixed(6)}, {driverPos.lng.toFixed(6)}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Breadcrumb trail */}
          {showPathTrail && trail.length > 1 && (
            <Polyline
              positions={trail.map((p) => [p.lat, p.lng]) as any}
              color="#ef4444"
              weight={3}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground bg-muted/30">
        <div>سائق: <span className="font-medium">{driverId}</span></div>
        <div>تحديث مباشر عبر Socket.IO</div>
      </div>
    </div>
  );
}
