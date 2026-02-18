import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import { connectRabbitMQ, startConsumers } from './rabbit/index.js';
import { initializeSocket, getIO } from './socket/socket.js';
import notificationRoutes from './routes/notification.routes.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please check your .env file');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5006;

// CORS Configuration
// Combine both CORS_ORIGIN and USER_CORS_ORIGIN from .env
const allowedOrigins = [
  ...(process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : []),
  ...(process.env.USER_CORS_ORIGIN
    ? process.env.USER_CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : [])
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow all localhost ports for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  let socketStatus = 'not initialized';
  try {
    const io = getIO();
    socketStatus = io ? 'initialized' : 'not initialized';
  } catch (error) {
    socketStatus = 'not initialized';
  }
  
  const healthStatus = {
    status: 'OK',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    socket: socketStatus
  };
  
  const isHealthy = healthStatus.database === 'connected';
  res.status(isHealthy ? 200 : 503).json(healthStatus);
});

// API Routes
app.use('/api/notification', notificationRoutes);

// 404 handler - using middleware instead of app.all('*')
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handling middleware - MUST be last
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';
  
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      // Close Socket.IO connections
      try {
        const io = getIO();
        if (io) {
          io.close(() => {
            console.log('✅ Socket.IO closed');
          });
        }
      } catch (socketError) {
        console.log('ℹ️ Socket.IO not initialized or already closed');
      }
      
      // Close MongoDB connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      }
      
      // Note: RabbitMQ connections are typically handled by the library
      // If there's a disconnect method, it should be called here
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle graceful shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

// Initialize services
const startServer = async () => {
  try {
    console.log('🚀 Starting Notification Service...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Socket.IO
    initializeSocket(server);
    
    // Start Express server
    server.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });

    // Connect to RabbitMQ (non-blocking - service continues if RabbitMQ fails)
    try {
      await connectRabbitMQ();
      await startConsumers();
      console.log('✅ RabbitMQ connected and consumers started');
    } catch (rabbitError) {
      console.error('⚠️ RabbitMQ connection failed, but server will continue running');
      console.error('⚠️ Notification features requiring auth-service communication will not work');
      console.log('⚠️ RabbitMQ will attempt to reconnect automatically...');
    }
    
    console.log('✅ Notification Service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing purposes
export { app, server };
export default app;
