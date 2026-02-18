import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
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

// Load environment variables FIRST
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5012;
const GRPC_PORT = process.env.GRPC_PORT || 50060;

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.USER_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use('/api', generalLimiter);

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      readPreference: 'secondaryPreferred' as const,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB Connected: Connection Service');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

  } catch (error: any) {
    logger.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Health check
app.get('/health', (_req: Request, res: Response) => {
  const health = {
    success: true,
    service: 'connection-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisCache.isReady() ? 'connected' : 'disconnected',
  };

  const statusCode = health.mongodb === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// API Routes
app.use('/api/connection-profile', profileRoutes);
app.use('/api/connection-purpose', purposeRoutes);
app.use('/api/connection-request', requestRoutes);
app.use('/api/connection-match', matchRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Connection Service HTTP running on port ${PORT}`);
    });

    // Start gRPC server
    startGRPCServer(Number(GRPC_PORT));
    logger.info(`🚀 Connection Service gRPC running on port ${GRPC_PORT}`);
    
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received: starting graceful shutdown`);
  
  try {
    await mongoose.connection.close();
    await redisCache.close();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
