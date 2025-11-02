import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import session from 'express-session';
import passport from './config/passport.config.js';
import { connectRabbitMQ } from './rabbit/connection.js';
import { startConsumers } from './rabbit/index.js';
dotenv.config();
const app = express();
// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    cloudinary: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected');

    // Try to connect to RabbitMQ (non-blocking)
    try {
      await connectRabbitMQ();
      await startConsumers();
      console.log('✅ RabbitMQ connected');
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ connection failed:', rabbitError.message);
      console.log('💡 Server will continue without RabbitMQ');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Auth service running on port ${PORT}`);
      console.log(`✅ Using Cloudinary for image storage`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

startServer();
