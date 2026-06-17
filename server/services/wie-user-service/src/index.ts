import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import cors from "cors";
import { createProxyMiddleware } from 'http-proxy-middleware';
import db from "./config/db";
import redisClient from "./config/redis";
import userRoutes from "./routes/user.routes";
import ticketRoutes from "./routes/ticket.routes";
import otpService from "./reposetory/otp";
import { startGrpcServer } from "./grpc/server";
import { cleanupStaleOnlineUsers } from "./services/wie-user.service";

const app: Application = express();
const PORT = Number(process.env.PORT) || 5005;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50053;
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${PORT}`;

// ✅ SUPABASE SAFETY CHECK (NEW)
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Set-Cookie", "X-Instance-ID"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ✅ Proxy for Media Service to bypass port 5010/5002 firewall
// This MUST come before express.json() to handle multipart/form-data correctly
app.use('/api/media', createProxyMiddleware({
  target: 'http://127.0.0.1:5002',
  changeOrigin: true,
  pathRewrite: {
    '^/': '/api/', 
  },
  timeout: 600000, 
  proxyTimeout: 600000,
  on: {
    proxyReq: (proxyReq, req, res) => {
       console.log(`[Media Proxy] Forwarding ${req.method} ${req.url} -> ${proxyReq.path}`);
    },
    error: (err, req, res) => {
       console.error('[Media Proxy] Error:', err.message);
    }
  }
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Add instance ID header
app.use((req, res, next) => {
  res.setHeader("X-Instance-ID", INSTANCE_ID);
  next();
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "WIE User Service is running",
    instanceId: INSTANCE_ID,
    database: db.isConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/user", userRoutes);
app.use("/api/tickets", ticketRoutes);

// Cleanup logic
let cleanupInterval: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (cleanupInterval) clearInterval(cleanupInterval);

  cleanupInterval = setInterval(async () => {
    const healthy = await db.healthCheck();
    if (!healthy) {
      db.isConnected = false;
      return;
    }
    try {
      await cleanupStaleOnlineUsers();
    } catch (error) {
      console.error("❌ Cleanup error:", error);
    }
  }, 30000);
};

async function startServer() {
  try {
    let dbConnected = false;
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await db.connect();
        console.log("✅ Supabase database connected");
        dbConnected = true;
        break;
      } catch (err) {
        const msg = (err as Error).message;
        console.error(`❌ DB connection attempt ${attempt}/${maxAttempts} failed: ${msg}`);
        if (attempt < maxAttempts) {
          const delay = attempt * 2000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!dbConnected) {
      console.error("❌ Could not connect to database after all attempts");
      process.exit(1);
    }

    startCleanupInterval();
    try {
      await redisClient.connect();
      console.log("✅ Redis connected");
    } catch {
      console.warn("⚠️ Redis not connected (continuing)");
    }

    await otpService.initialize();
    startGrpcServer(GRPC_PORT);
    console.log(`✅ gRPC server running on ${GRPC_PORT}`);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ HTTP server running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      try {
        if (cleanupInterval) clearInterval(cleanupInterval);
        try { await redisClient.disconnect(); } catch {}
        await db.close();
        server.close(() => {
          process.exit(0);
        });
      } catch (error) {
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
