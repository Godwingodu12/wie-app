import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { connectDB } from './config/database.js';
import { connectRabbitMQ, startConsumers } from './rabbit/index.js';
import { initializeSocket } from './socket/socket.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server

const PORT = process.env.PORT || 5006;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
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
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Initialize services
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize Socket.IO
    initializeSocket(server);
    
    // Start Express server
    server.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
    });

    try {
      await connectRabbitMQ();
      await startConsumers();
      console.log('✅ RabbitMQ connected and consumers started');
    } catch (rabbitError) {
      console.error('⚠️ RabbitMQ connection failed, but server will continue running');
      console.error('⚠️ Notification features requiring auth-service communication will not work');
      console.log('⚠️ RabbitMQ will attempt to reconnect automatically...');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();

export default app;