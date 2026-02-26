import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import Database from './config/db';
import bookingRoutes from './routes/bookingRoutes';
import interactionRoutes from './routes/interactionRoutes';
import adminRoutes from './routes/adminRoutes';
import { startGrpcServer,startRefundWorker } from './grpc/server';
import webhookRoutes from './routes/webhookRoutes';
import { connectRabbitMQ } from './rabbit';
import { startConsumers } from './rabbit/index';
import { startSettlementWorker } from './workers/settlementWorker';

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});
app.use('/api/bookings', bookingRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await Database.connect();
    startGrpcServer();
    startRefundWorker().catch(console.error);
    console.log('✅ gRPC server started');
    
    // Optionally connect to RabbitMQ (if RABBITMQ_URL is provided)
    if (process.env.RABBITMQ_URL) {
      try {
        await connectRabbitMQ();
        await startConsumers();
        await startSettlementWorker().catch(console.error);
        console.log('✅ RabbitMQ connected and consumers started');
      } catch (rabbitError: any) {
        console.warn('⚠️ RabbitMQ connection failed, but server will continue running');
        console.warn('⚠️ Features requiring RabbitMQ (notifications, queue consumers) will not work');
        console.warn('⚠️ RabbitMQ will attempt to reconnect automatically...');
      }
    } else {
      console.warn('⚠️ RABBITMQ_URL not set, skipping RabbitMQ initialization');
      console.warn('⚠️ Features requiring RabbitMQ (notifications, queue consumers) will not work');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Transaction Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  try {
    await Database.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, log and continue
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
