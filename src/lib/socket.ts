import { Server } from 'socket.io';

type DriverJoinPayload = { driverId: string };
type DriverLocationPayload = {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  ts?: string;
};

const DRIVER_ROOM = (id: string) => `driver:${id}`;

export const setupSocket = (io: Server) => {
  // Optional simple mock emitters registry (driverId -> intervalId)
  const mockIntervals = new Map<string, NodeJS.Timeout>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Generic echo example (kept for reference)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Rooms: driver live tracking
    socket.on('driver:join', (payload: DriverJoinPayload) => {
      if (!payload?.driverId) return;
      socket.join(DRIVER_ROOM(payload.driverId));
      console.log(`Socket ${socket.id} joined room ${DRIVER_ROOM(payload.driverId)}`);
    });

    socket.on('driver:leave', (payload: DriverJoinPayload) => {
      if (!payload?.driverId) return;
      socket.leave(DRIVER_ROOM(payload.driverId));
      console.log(`Socket ${socket.id} left room ${DRIVER_ROOM(payload.driverId)}`);
    });

    // Server can receive driver location (e.g., from driver app) and broadcast to room
    socket.on('driver:location:update', (payload: DriverLocationPayload) => {
      if (!payload?.driverId) return;
      io.to(DRIVER_ROOM(payload.driverId)).emit('driver:location', {
        ...payload,
        ts: payload.ts || new Date().toISOString(),
      });
    });

    // Dev-only simple mock: start emitting synthetic positions when asked
    socket.on('mock:driver:start', (payload: { driverId: string; start: {lat:number; lng:number}; dest: {lat:number; lng:number}; intervalMs?: number }) => {
      if (process.env.NODE_ENV === 'production') return;
      const { driverId, start, dest, intervalMs = 1500 } = payload || {} as any;
      if (!driverId || !start || !dest) return;

      // Stop existing
      const existing = mockIntervals.get(driverId);
      if (existing) clearInterval(existing);

      let t = 0; // 0..1
      const step = 0.02; // progress per tick
      const intervalId = setInterval(() => {
        t += step;
        if (t > 1) t = 0;
        const lat = start.lat + (dest.lat - start.lat) * t;
        const lng = start.lng + (dest.lng - start.lng) * t;
        const payloadOut: DriverLocationPayload = {
          driverId,
          lat,
          lng,
          speed: 50 + Math.random() * 20,
          heading: Math.random() * 360,
          ts: new Date().toISOString(),
        };
        io.to(DRIVER_ROOM(driverId)).emit('driver:location', payloadOut);
      }, intervalMs);
      mockIntervals.set(driverId, intervalId);
      console.log(`Mock emitter started for ${driverId}`);
    });

    socket.on('mock:driver:stop', (payload: { driverId: string }) => {
      if (process.env.NODE_ENV === 'production') return;
      const driverId = payload?.driverId;
      if (!driverId) return;
      const existing = mockIntervals.get(driverId);
      if (existing) {
        clearInterval(existing);
        mockIntervals.delete(driverId);
        console.log(`Mock emitter stopped for ${driverId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Optional welcome
    socket.emit('message', {
      text: 'Welcome to PRO FLEET Socket.IO server',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};