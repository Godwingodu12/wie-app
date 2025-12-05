import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import Database from './config/db';
import { connectRabbitMQ } from './rabbit/connection';
import { startConsumers } from './rabbit/index';
import bookingRoutes from './routes/bookingRoutes';
import interactionRoutes from './routes/interactionRoutes';
import adminRoutes from './routes/adminRoutes';
import webhookRoutes from './routes/webhookRoutes';
const app = express();
const PORT = process.env.PORT || 5007;
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Transaction Service is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);
// 404 handler
app.use((req: Request, res: Response) => {
  console.log('❌ Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});
// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to PostgreSQL
    await Database.connect();
    console.log('✅ Database connected');
    // Connect to RabbitMQ
    await connectRabbitMQ();
    console.log('✅ RabbitMQ connected');
    // Start RabbitMQ consumers
    await startConsumers();
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀ransaction Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️ SIGINT received, shutting down gracefully...');
  await Database.disconnect();
  process.exit(0);
});
// Start the server
startServer();
