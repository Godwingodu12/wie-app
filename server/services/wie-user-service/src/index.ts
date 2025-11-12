import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db';
import userRoutes from './routes/user.routes';
import otpService from './reposetory/otp';
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
    credentials: true,
  })
);

// Routes
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WIE User Service' });
});

// Start function
const PORT = process.env.PORT || 5005;

const startServer = async () => {
  try {
    await db.connect();
    app.listen(PORT, () => {
      console.log(`✅ WIE User Service running on port ${PORT}`);
      console.log(`📍 API Base: http://localhost:${PORT}/api/user`);
    });
  } catch (err) {
    console.error('❌ Failed to start user service:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  otpService.cleanup();
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  otpService.cleanup();
  await db.close();
  process.exit(0);
});

startServer();