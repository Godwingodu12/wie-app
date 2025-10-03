import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ticketRoutes from './routes/ticket.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { connectRabbitMQ } from './rabbit/connection.js';
import { startConsumers } from './rabbit/index.js';

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

// Set uploads directory path
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

// Start server and services
const PORT = process.env.PORT || 5003;
const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();
    await startConsumers();
    app.listen(PORT, () => {
      console.log(`Ticket service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};
startServer();
