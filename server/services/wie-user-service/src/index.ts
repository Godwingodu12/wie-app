import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db';
import userRoutes from './routes/user.routes';
import otpService from './reposetory/otp';
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/user', userRoutes);

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await db.connect();
    console.log('✅ PostgreSQL connected (WIE User Service)');

    // Initialize OTP service
    await otpService.initialize();

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ WIE User Service running on port ${PORT}`);
      console.log(`📍 API Base: http://localhost:${PORT}/api/user`);
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
export default app;
