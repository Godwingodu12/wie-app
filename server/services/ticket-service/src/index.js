import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ticketRoutes from './routes/ticket.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { connectRabbitMQ, isChannelAvailable } from './rabbit/connection.js';
import { startConsumers } from './rabbit/index.js';
import { startEventStatusScheduler } from './jobs/eventStatusScheduler.js';

// 👇 Needed for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Config
dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// CORS configuration
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
const uploadsPath = path.join(__dirname, 'uploads');
// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsPath));
// List files in uploads directory for debugging
try {
  const files = fs.readdirSync(uploadsPath);
  const imageFiles = files.filter(file => 
    file.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov)$/i)
  );
    
  if (imageFiles.length > 0) {
    const sampleFile = imageFiles[0];
  }
} catch (err) {
  console.error('❌ Error reading uploads directory:', err.message);
}

// Add a test endpoint to verify static file serving
app.get('/test-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsPath);
    const mediaFiles = files.filter(file => 
      file.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov)$/i)
    );
    
    const sampleUrls = mediaFiles.slice(0, 3).map(file => ({
      filename: file,
      url: `http://localhost:5003/uploads/${file}`,
      exists: fs.existsSync(path.join(uploadsPath, file))
    }));
    
    res.json({
      success: true,
      uploadsPath,
      totalFiles: files.length,
      mediaFiles: mediaFiles.length,
      sampleUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      uploadsPath
    });
  }
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
      
      // Only start consumers if RabbitMQ connection is successful
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
    
    // Start HTTP server (regardless of RabbitMQ status)
    app.listen(PORT, () => {
      console.log(`✅ Ticket service running on port ${PORT}`);
    });
    
  } catch (err) {
    console.error('❌ Fatal error starting server:', err);
    process.exit(1);
  }
};

startServer();
