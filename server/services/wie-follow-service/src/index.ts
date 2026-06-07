import express, { Application } from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import db from "./config/db";
import redisClient from "./config/redis";
import followRoutes from "./routes/follow.routes";
import { startGrpcServer } from "./grpc/server";
import { initRabbit } from "./rabbit/index";

const app: Application = express();
const PORT = Number(process.env.PORT) || 5009;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50058;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/api", followRoutes);

app.get("/health", async (req, res) => {
  try {
    const dbStatus = db.isConnected ? "connected" : "disconnected";
    const redisStatus = redisClient.isReady() ? "connected" : "disconnected";
    const isHealthy = db.isConnected && redisClient.isReady();

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: "WIE Follow Service",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        grpc: "running",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

async function startServer() {
  try {
    // Connect to MongoDB
    await db.connect();

    // Connect to Redis
    try {
      await redisClient.connect();
      console.log("✅ Redis initialized successfully");
    } catch (redisError) {
      console.error("⚠️ Redis initialization failed:", redisError);
      console.warn("⚠️ Notification cooldown will not work properly");
    }

    // Start gRPC server
    startGrpcServer(GRPC_PORT);

    // Initialize RabbitMQ
    try {
      await initRabbit();
      console.log("✅ RabbitMQ initialized successfully");
    } catch (rabbitError) {
      console.error("⚠️ RabbitMQ initialization failed:", rabbitError);
      console.warn("⚠️ Notifications will not work, but service will continue");
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`📍 HTTP: http://localhost:${PORT}`);
      console.log(`📍 gRPC: localhost:${GRPC_PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 ${signal} received, shutting down...`);
      await db.disconnect();
      await redisClient.disconnect();
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;
