import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db';
import userRoutes from './routes/user.routes';
import ticketRoutes from './routes/ticket.routes';
import otpService from './reposetory/otp';
import { startGrpcServer } from './grpc/server';
dotenv.config();
const app: Application = express();
const PORT = Number(process.env.PORT) || 5005;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50053;
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', userRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WIE User Service is running',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    await db.connect();
    await otpService.initialize();

    startGrpcServer(GRPC_PORT);

    const server = app.listen(PORT, () => {
      console.log(`✅ WIE User Service running on port ${PORT}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please free the port or change PORT in your .env file.`);
        console.error(`   You can find the process using: netstat -ano | findstr :${PORT}`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  otpService.cleanup();
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  otpService.cleanup();
  await db.close();
  process.exit(0);
});

startServer();

export default app;
