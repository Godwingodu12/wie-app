import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ticketRoutes from './routes/ticket.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { connectRabbitMQ, isChannelAvailable } from './rabbit/connection.js';
import { startConsumers } from './rabbit/index.js';
import { startEventStatusScheduler, checkExpiredConfirmedEvents } from './jobs/eventStatusScheduler.js';

// Config
dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ticket service is running',
    cloudinary: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/ticket', ticketRoutes);
app.use('/api/notification', notificationRoutes);

// Start server and services
const PORT = process.env.PORT || 5003;
const startServer = async () => {
  try {
    // Connect to MongoDB (critical - must succeed)
    await connectDB();
    
    // Try to connect to RabbitMQ (non-blocking)
    try {
      await connectRabbitMQ();
      
      if (isChannelAvailable()) {
        await startConsumers();
        console.log('✅ RabbitMQ services initialized');
      } else {
        console.warn('⚠️ RabbitMQ channel not available, skipping consumer initialization');
      }
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ initialization failed:', rabbitError.message);
      console.log('💡 Server will continue without RabbitMQ. Inter-service communication will be unavailable.');
      console.log('💡 To fix: Check your RABBITMQ_URL in .env file');
    }
    
    // Start event status scheduler (independent of RabbitMQ)
    startEventStatusScheduler();
    checkExpiredConfirmedEvents();
    // Start HTTP server (regardless of RabbitMQ status)
    app.listen(PORT, () => {
      console.log(`✅ Ticket service running on port ${PORT}`);
      console.log(`✅ Using Cloudinary for media storage`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (err) {
    console.error('❌ Fatal error starting server:', err);
    process.exit(1);
  }
};
startServer();
