import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db';
import followRoutes from './routes/follow.routes';
import { startGrpcServer } from './grpc/server';
dotenv.config();
const app: Application = express();
const PORT = Number(process.env.PORT) || 5009;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50058;

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes - IMPORTANT: Use /api prefix
app.use('/api', followRoutes);

app.get('/health', async (req, res) => {
  try {
    const dbStatus = db.isConnected ? 'connected' : 'disconnected';
    const isHealthy = db.isConnected;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: 'WIE Follow Service',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        grpc: 'running',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

async function startServer() {
  try {
    console.log('🚀 Starting Follow Service...');

    // Connect to MongoDB
    await db.connect();

    // Start gRPC server
    startGrpcServer(GRPC_PORT);

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Follow Service running on port ${PORT}`);
      console.log(`📍 HTTP: http://localhost:${PORT}`);
      console.log(`📍 gRPC: localhost:${GRPC_PORT}`);
      console.log(`📍 Health: http://localhost:${PORT}/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 ${signal} received, shutting down...`);
      await db.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
