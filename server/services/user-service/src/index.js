import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { connectRabbitMQ } from './rabbit/connection.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.static('uploads'));
// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
// Start function
const PORT = process.env.PORT || 5002;
const startServer = async () => {
  try {
    // await connectDB();
    await connectRabbitMQ();
    app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start user service:', err);
    process.exit(1);
  }
};
startServer();
