import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env before other imports
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

import connectDB from "./config/db";
import redisClient from "./config/redis";
import fluxRoutes from "./routes/flux.routes";
import diaryRoutes from "./routes/diary.routes";
import musicRoutes from "./routes/music.routes";
import locationRoutes from "./routes/location.routes";
import postRoutes from "./routes/post.routes";
import { archiveExpiredFluxes } from "./services/flux.service";
import { initRabbit } from "./rabbit";
import mongoose from 'mongoose';

const app = express();
const PORT = Number(process.env.PORT) || 5010;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Media Service] ${req.method} ${req.url}`);
  next();
});

const developmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  /^http:\/\/192\.168\.1\.\d+(:[0-9]+)?$/,
];

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Routes
app.use("/api/flux/music", musicRoutes);
app.use("/api/flux", fluxRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/post", postRoutes);
app.get("/api/health", async (_req, res) => {
  const redisOk = await redisClient.healthCheck().catch(() => false);
  res.json({
    status: "ok",
    service: "wie-media-service",
    redis: redisOk ? "connected" : "disconnected",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Bootstrap ──────────────────────────────────────────────

const bootstrap = async () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ wie-media-service running on port ${PORT}`);
    });

    await connectDB();
    await redisClient.connect();
    try {
      await initRabbit();
    } catch (e) {
      console.warn('⚠️ RabbitMQ not available (Media Service)');
    }

    // Archive expired fluxes every hour
    setInterval(
      async () => {
        if (mongoose.connection.readyState !== 1) return;
        const count = await archiveExpiredFluxes().catch(() => 0);
        if (count > 0) console.log(`📦 Archived ${count} expired fluxes`);
      },
      60 * 60 * 1000,
    );
  } catch (error) {
    console.error("❌ Bootstrap failed:", error);
    // process.exit(1);
  }
};

bootstrap();

process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION (Media Service):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});
