import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import profileRoutes from './routes/profile.routes';
import purposeRoutes from './routes/purpose.routes';
import requestRoutes from './routes/request.routes';
import matchRoutes from './routes/match.routes';
import { startGRPCServer } from './grpc/connectionServer';
import logger from './utils/logger';
import redisCache from './utils/redis.cache';
import { metricsMiddleware, metricsEndpoint } from './utils/metrics';
import { generalLimiter } from './middleware/rateLimiter.middleware';
dotenv.config();

const app: Express   = express();
const PORT           = process.env.PORT      || 5012;
const GRPC_PORT      = process.env.GRPC_PORT || 50060;

// ── Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin:      process.env.USER_CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(metricsMiddleware);
app.use('/api', generalLimiter);

// ── MongoDB ───────────────────────────────────────────────────────
const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, {
    maxPoolSize:              10,
    serverSelectionTimeoutMS: 10000,   // 10s — enough for Atlas cold start
    socketTimeoutMS:          45000,
    family:                   4,
  });

  // Log immediately after connect() resolves — not inside event
  console.log(`✅ MongoDB Connected — db: ${mongoose.connection.name}`);

  mongoose.connection.on('error',        (err) => console.error('❌ MongoDB error:', err.message));
  mongoose.connection.on('disconnected', ()    => console.warn('⚠️  MongoDB disconnected'));
};

// ── Health ────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  const health = {
    success:   true,
    service:   'connection-service',
    status:    'healthy',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    mongodb:   mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis:     redisCache.isReady() ? 'connected' : 'disconnected',
  };
  res.status(health.mongodb === 'connected' ? 200 : 503).json(health);
});

app.get('/metrics', metricsEndpoint);

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/connection-profile', profileRoutes);
app.use('/api/connection-purpose', purposeRoutes);
app.use('/api/connection-request', requestRoutes);
app.use('/api/connection-match',   matchRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: any, _req: Request, res: Response, _next: any) => {
  logger.error('Unhandled error: ' + err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Connection Service HTTP  → http://localhost:${PORT}`);
    });

    startGRPCServer(Number(GRPC_PORT));
    console.log(`🚀 Connection Service gRPC  → port ${GRPC_PORT}`);

  } catch (error: any) {
    console.error('❌ SERVER FAILED TO START:', error.message);
    process.exit(1);
  }
};

startServer();

// ── Graceful shutdown ─────────────────────────────────────────────
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} — shutting down…`);
  try {
    await mongoose.connection.close();
    await redisCache.close();
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Shutdown error:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
