import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ticketRoutes from './routes/ticket.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { startGrpcServer } from './grpc/server.js';
import internalRoutes from './routes/internal.routes.js';
import { startEventStatusScheduler, checkExpiredConfirmedEvents } from './jobs/eventStatusScheduler.js';
dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ticket service is running',
    cloudinary: 'enabled',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/ticket', ticketRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/internal', internalRoutes);
const PORT = process.env.PORT || 5003;
const GRPC_PORT = process.env.GRPC_PORT || 50052;

const startServer = async () => {
  try {
    await connectDB();

    startGrpcServer(GRPC_PORT);

    startEventStatusScheduler();
    checkExpiredConfirmedEvents();

    app.listen(PORT, () => {
      //
    });
  } catch (err) {
    process.exit(1);
  }
};
startServer();
