import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env before other imports that might use process.env
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import session from 'express-session';
import passport from './config/passport.config.js';
import { startGrpcServer } from './grpc/server.js';
import otpService from './reposetory/otp.js';
import { connectRabbitMQ, isChannelAvailable } from './rabbit/connection.js';
import { startConsumers } from './rabbit/index.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    grpc: 'enabled',
    rabbitmq: isChannelAvailable() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

const startServer = async () => {
  try {
    // Start listening early
    app.listen(PORT, '0.0.0.0', () => {
       console.log(`✅ Auth Service running on port ${PORT}`);
    });

    await connectDB();
    otpService.startPeriodicCleanup();

    startGrpcServer(GRPC_PORT);

    try {
      await connectRabbitMQ();
      if (isChannelAvailable()) {
        await startConsumers();
        console.log('✅ RabbitMQ connected (Auth Service)');
      }
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ not available (Auth Service)');
    }

  } catch (err) {
    console.error('❌ Failed to start Auth Service:', err);
    // process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION (Auth Service):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

startServer();
