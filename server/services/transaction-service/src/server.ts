import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import Database from './config/db';
import { connectRabbitMQ, isChannelAvailable } from './rabbit/connection';
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

app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Transaction Service is running',
    rabbitmq: isChannelAvailable() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
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

const startServer = async () => {
  try {
    await Database.connect();

    try {
      await connectRabbitMQ();
      if (isChannelAvailable()) {
        await startConsumers();
      }
    } catch (rabbitError) {
      //
    }

    app.listen(PORT, () => {
      //
    });
  } catch (error) {
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await Database.disconnect();
  process.exit(0);
});

startServer();
