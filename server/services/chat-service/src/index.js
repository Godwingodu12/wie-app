import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { connectDB } from './config/database.js';
import { connectRabbitMQ, startConsumers } from './rabbit/index.js';
import { initializeSocket } from './socket/socket.js';
import chatRoutes from './routes/chat.routes.js';
dotenv.config();
const app = express();
const server = http.createServer(app); // Create HTTP server
const PORT = process.env.PORT || 5004;
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
    service: 'chat-service',
    timestamp: new Date().toISOString()
  });
});
// Routes
app.use('/api/chat', chatRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
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
      console.log(`🚀 Chat Service running on port ${PORT}`);
    });
    try {
      await connectRabbitMQ();
      await startConsumers();
      console.log('✅ RabbitMQ connected and consumers started');
    } catch (rabbitError) {
      console.error('⚠️ RabbitMQ connection failed, but server will continue running');
      console.error('⚠️ Chat features requiring auth-service communication will not work');
      console.log('⚠️ RabbitMQ will attempt to reconnect automatically...');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};
// Handle graceful shutdown
process.on('SIGINT', async () => {
  process.exit(0);
});
process.on('SIGTERM', async () => {
  process.exit(0);
});
startServer();
export default app;
