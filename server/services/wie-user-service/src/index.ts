import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db';
import userRoutes from './routes/user.routes';
import ticketRoutes from './routes/ticket.routes';
import otpService from './reposetory/otp';
import { connectRabbitMQ, isChannelAvailable, closeConnection } from './rabbit/connection'; // ADD THIS

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5005;

// CORS Configuration - MUST BE BEFORE OTHER MIDDLEWARE
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

// Routes
app.use('/api/user', userRoutes);
app.use('/api/tickets', ticketRoutes); // ADD THIS - Public ticket routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WIE User Service is running',
    rabbitmq: isChannelAvailable() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();
    
    // Initialize OTP service
    await otpService.initialize();

    // Connect to RabbitMQ (non-blocking)
    try {
      await connectRabbitMQ();
      
      if (isChannelAvailable()) {
        console.log('✅ RabbitMQ connected - Ticket service integration enabled');
      } else {
        console.warn('⚠️ RabbitMQ not available - Ticket features will be limited');
      }
    } catch (rabbitError: any) {
      console.warn('⚠️ RabbitMQ initialization failed:', rabbitError.message);
      console.log('💡 Server will continue without RabbitMQ. Ticket features will be unavailable.');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ WIE User Service running on port ${PORT}`);
      console.log(`📍 API Base: http://localhost:${PORT}/api/user`);
      console.log(`🎫 Ticket API: http://localhost:${PORT}/api/tickets`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  otpService.cleanup();
  await closeConnection(); // ADD THIS
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  otpService.cleanup();
  await closeConnection(); // ADD THIS
  await db.close();
  process.exit(0);
});
startServer();
export default app;
