import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import cors from "cors";
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

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
];

// Determine the effective CORS origins
let effectiveCorsOrigins: string[] | boolean;

const configuredCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").filter(Boolean)
  : []; // If CORS_ORIGIN is not set, or empty, start with an empty array

if (process.env.NODE_ENV === "production") {
  if (configuredCorsOrigins.length > 0) {
    effectiveCorsOrigins = configuredCorsOrigins;
  } else {
    // In production, if CORS_ORIGIN is not explicitly set or is empty, disallow all origins
    console.warn(
      "⚠️  CORS_ORIGIN is not set or is empty in production. Disallowing all cross-origin requests.",
    );
    effectiveCorsOrigins = false; // Disallow all origins
  }
} else {
  // In development or other environments, use configured origins or development defaults
  effectiveCorsOrigins =
    configuredCorsOrigins.length > 0
      ? configuredCorsOrigins
      : developmentOrigins;
}

const corsOptions = {
  origin: effectiveCorsOrigins,
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add instance ID header
app.use((req, res, next) => {
  res.setHeader("X-Instance-ID", INSTANCE_ID);
  next();
});

app.use("/api/user", userRoutes);
app.use("/api/tickets", ticketRoutes);

// Cleanup logic (unchanged)
let cleanupInterval: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (cleanupInterval) clearInterval(cleanupInterval);

  cleanupInterval = setInterval(async () => {
    // Double-check with a live ping before running any cleanup queries
    const healthy = await db.healthCheck();
    if (!healthy) {
      db.isConnected = false; // keep flag in sync
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
        console.error(
          `❌ DB connection attempt ${attempt}/${maxAttempts} failed: ${msg}`,
        );
        if (attempt < maxAttempts) {
          // Exponential backoff: 2s, 4s, 6s, 8s
          const delay = attempt * 2000;
          console.log(`⏳ Retrying in ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!dbConnected) {
      console.error("❌ Could not connect to database after all attempts");
      process.exit(1);
    }

    startCleanupInterval();
    // Redis (optional)
    try {
      await redisClient.connect();
      console.log("✅ Redis connected");
    } catch {
      console.warn("⚠️ Redis not connected (continuing)");
    }

    // OTP service
    await otpService.initialize();

    // gRPC
    startGrpcServer(GRPC_PORT);
    console.log(`✅ gRPC server running on ${GRPC_PORT}`);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ HTTP server running on port ${PORT}`);
    });

    // Graceful shutdown
    let isShuttingDown = false;
    let listenersRegistered = false;
    const shutdown = async (signal: string) => {
      if (isShuttingDown) {
        console.log(
          `⚠️ Shutdown already in progress. Ignoring signal: ${signal}`,
        );
        return;
      }
      isShuttingDown = true;
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      try {
        // Stop cleanup interval
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
          console.log("✅ Cleanup interval stopped");
        }

        // Disconnect Redis
        try {
          await redisClient.disconnect();
          console.log("✅ Redis disconnected");
        } catch (error) {
          console.warn("⚠️ Redis disconnect warning:", error);
        }

        // Close database (now includes Prisma + pg Pool)
        await db.close();
        console.log("✅ Database connections closed");

        // Close HTTP server
        server.close(() => {
          console.log("✅ HTTP server closed");
          process.exit(0);
        });

        setTimeout(() => {
          console.error("⚠️ Forceful shutdown after timeout");
          process.exit(1);
        }, 10000);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    if (!listenersRegistered) {
      process.on("SIGINT", () => shutdown("SIGINT"));
      process.on("SIGTERM", () => shutdown("SIGTERM"));
      listenersRegistered = true;
    }

    // Handle unhandled errors
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown("UNCAUGHT_EXCEPTION");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
