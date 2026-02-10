import dotenv from 'dotenv';
dotenv.config();
import express, { Application } from 'express';
import cors from 'cors';
import db from './config/db';
import redisClient from './config/redis';
import userRoutes from './routes/user.routes';
import ticketRoutes from './routes/ticket.routes';
import otpService from './reposetory/otp';
import { startGrpcServer } from './grpc/server';
import { cleanupStaleOnlineUsers } from './services/wie-user.service';

const app: Application = express();
const PORT = Number(process.env.PORT) || 5005;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50053;
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${PORT}`;

// ✅ SUPABASE SAFETY CHECK (NEW)
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie', 'X-Instance-ID'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add instance ID header
app.use((req, res, next) => {
  res.setHeader('X-Instance-ID', INSTANCE_ID);
  next();
});

app.use('/api/user', userRoutes);
app.use('/api/tickets', ticketRoutes);

// Cleanup logic (unchanged)
let cleanupInterval: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (cleanupInterval) clearInterval(cleanupInterval);

  cleanupInterval = setInterval(async () => {
    if (db.isConnected) {
      try {
        await cleanupStaleOnlineUsers();
      } catch (error) {
        console.error('❌ Cleanup error:', error);
      }
    }
  }, 30000);
};

async function startServer() {
  try {
    // ✅ SUPABASE DB SHOULD BE MANDATORY IN PROD
    await db.connect();
    console.log('✅ Supabase database connected');
    startCleanupInterval();

    // Redis (optional)
    try {
      await redisClient.connect();
      console.log('✅ Redis connected');
    } catch {
      console.warn('⚠️ Redis not connected (continuing)');
    }

    // OTP service
    await otpService.initialize();

    // gRPC
    startGrpcServer(GRPC_PORT);
    console.log(`✅ gRPC server running on ${GRPC_PORT}`);

    const server = app.listen(PORT, () => {
      console.log(`✅ HTTP server running on port ${PORT}`);
    });

    // Graceful shutdown (unchanged)
    const shutdown = async () => {
      if (cleanupInterval) clearInterval(cleanupInterval);
      await redisClient.disconnect();
      await db.close();
      server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
