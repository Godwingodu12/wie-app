import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import session from 'express-session';
import passport from './config/passport.config.js';
import { startGrpcServer } from './grpc/server.js';
import { connectRabbitMQ, isChannelAvailable } from './rabbit/connection.js';
import { startConsumers } from './rabbit/index.js';
dotenv.config();
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
    await connectDB();

    startGrpcServer(GRPC_PORT);

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
  } catch (err) {
    process.exit(1);
  }
};
startServer();
