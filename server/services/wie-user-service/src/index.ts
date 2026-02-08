import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db';
import redisClient from './config/redis';
import userRoutes from './routes/user.routes';
import ticketRoutes from './routes/ticket.routes';
import otpService from './reposetory/otp';
import { startGrpcServer } from './grpc/server';
import { cleanupStaleOnlineUsers } from './services/wie-user.service';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5005;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50053;
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${PORT}`;

const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:5173', // Admin app
    'http://127.0.0.1:3000', // User app
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Set-Cookie', 'X-Instance-ID'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add instance ID to response headers for debugging
app.use((req, res, next) => {
  res.setHeader('X-Instance-ID', INSTANCE_ID);
  next();
});

app.use('/api/user', userRoutes);
app.use('/api/tickets', ticketRoutes);

// ✅ FIXED: Make cleanup interval conditional on DB connection
let cleanupInterval: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(async () => {
    if (db.isConnected) {
      try {
        await cleanupStaleOnlineUsers();
      } catch (error) {
        console.error('❌ Cleanup error:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, 30000); // Every 30 seconds
};

app.get('/health', async (req, res) => {
  try {
    const dbStatus = db.isConnected ? 'connected' : 'disconnected';
    let redisStatus = 'disconnected';
    
    try {
      redisStatus = await redisClient.healthCheck() ? 'connected' : 'disconnected';
    } catch {
      redisStatus = 'disconnected';
    }

    const isHealthy = db.isConnected;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: 'WIE User Service',
      instance: INSTANCE_ID,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        grpc: 'running',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      instance: INSTANCE_ID,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Readiness probe (for Kubernetes/Docker)
app.get('/ready', async (req, res) => {
  const isReady = db.isConnected;
  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    instance: INSTANCE_ID,
  });
});

// Liveness probe
app.get('/live', (req, res) => {
  res.status(200).json({
    alive: true,
    instance: INSTANCE_ID,
  });
});

async function startServer() {
  try {
    // ✅ FIXED: Don't throw error if database fails, just warn
    try {
      await db.connect();
      console.log('✅ Database connected');
      startCleanupInterval(); // Start cleanup only if DB is connected
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.warn('⚠️  Server will start without database connection');
      console.warn('   Please start PostgreSQL and restart the service');
      // Don't throw - let server start without DB
    }

    // Connect to Redis (optional - service will work without it)
    try {
      await redisClient.connect();
      console.log('✅ Redis connected - using distributed state');
    } catch (error) {
      console.warn('⚠️  Redis connection failed - using in-memory state');
      console.warn('   Load balancing will work but rate limiting will be per-instance');
    }

    // ✅ FIXED: Initialize OTP service only if DB is connected
    try {
      if (db.isConnected) {
        await otpService.initialize();
      } else {
        console.warn('⚠️  OTP service not initialized - database not connected');
      }
    } catch (error) {
      console.error('❌ OTP service initialization failed:', error);
      console.warn('⚠️  Continuing without OTP service');
      // Don't throw - continue without OTP
    }

    // Start gRPC server
    try {
      startGrpcServer(GRPC_PORT);
      console.log(`✅ gRPC server running on port ${GRPC_PORT}`);
    } catch (error) {
      console.error('❌ gRPC server failed to start:', error);
      console.warn('⚠️  Continuing without gRPC server');
      // Continue without gRPC if it fails
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      if (!db.isConnected) {
        console.log('\n⚠️  WARNING: Database not connected!');
        console.log('   Start PostgreSQL with: pg_ctl start -D "C:\\Program Files\\PostgreSQL\\16\\data"');
        console.log('   Or check your DATABASE_URL in .env\n');
      }
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error(`   Please change PORT in .env or stop the process using:`);
        console.error(`   netstat -ano | findstr :${PORT}`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      
      // Stop accepting new connections
      server.close(async () => {
        
        // Stop cleanup interval
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
        }
        
        // Cleanup services
        try {
          if (otpService) {
            otpService.cleanup();
          }
          
          await redisClient.disconnect();
          
          if (db.isConnected) {
            await db.close();
            console.log('✅ Database disconnected');
          }
          
          console.log('✅ All connections closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('⏰ Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ✅ FIXED: Better error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit immediately, just log it
  if (error.message?.includes('database') || error.message?.includes('Prisma')) {
    console.warn('⚠️  Database-related error, continuing...');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, just log it
  if (reason && typeof reason === 'object' && 'code' in reason && reason.code === 'P1001') {
    console.warn('⚠️  Database connection error, continuing...');
  } else {
    process.exit(1);
  }
});

startServer();

export default app;
