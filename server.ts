// server.ts - Next.js Standalone + Socket.IO (Updated for 30min expiry)
import { setupSocket } from "@/lib/socket";
import { expireOldTripRequests } from "@/lib/auto-assign-drivers";
import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
// Get port from command line arguments or environment variable
const portArg = process.argv[2];
const currentPort = portArg
  ? Number(portArg)
  : Number(process.env.PORT) || 3000;
const hostname = "0.0.0.0";

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: "./.next" }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith("/api/socketio")) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO
    const io = new Server(server, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(
        `> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`
      );

      // Start the trip requests expiration scheduler
      startTripRequestsScheduler();
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
}

// Scheduler for expiring old trip requests
function startTripRequestsScheduler() {
  console.log("🕐 Starting trip requests expiration scheduler...");

  // Run immediately on startup
  expireOldTripRequests().catch((error) => {
    console.error("Error in initial expire check:", error);
  });

  // Then run every minute for faster response
  setInterval(async () => {
    try {
      console.log("⏰ Running scheduled trip requests expiration check...");
      const result = await expireOldTripRequests();
      if (result.expiredCount > 0) {
        console.log(`✅ Expired ${result.expiredCount} trip requests`);
      }
    } catch (error) {
      console.error("Error in scheduled expire check:", error);
    }
  }, 60 * 1000); // 1 minute
}

// Start the server
createCustomServer();
