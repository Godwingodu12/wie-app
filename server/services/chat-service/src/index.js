import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { connectDB } from './config/database.js';
import { connectRabbitMQ, startConsumers } from './rabbit/index.js';
import { initializeSocket } from './socket/socket.js';
import { initializeWieSocket } from './socket/wieSocket.js';
import chatRoutes from './routes/chat.routes.js';
import wieChatRoutes from './routes/wiechat.routes.js';
import blockRoutes from './routes/block.routes.js';
import reportRoutes from './routes/report.routes.js';
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5004;

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  process.env.USER_CORS_ORIGIN || 'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'chat-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/wie-chat', wieChatRoutes);
app.use('/api/chat-block', blockRoutes);
app.use('/api/chat-report', reportRoutes);
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected');

    // Initialize both socket servers
    initializeSocket(server);    
    initializeWieSocket(server);
    server.listen(PORT, () => {
      console.log(`✅ Chat Service running on port ${PORT}`);
      console.log(`📍 HTTP: http://localhost:${PORT}`);
      console.log(`📍 Admin Socket: /socket.io`);
      console.log(`📍 WIE Socket: /wie-socket.io`);
    });

    try {
      await connectRabbitMQ();
      await startConsumers();
      console.log('✅ RabbitMQ connected');
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ not available, continuing without it');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});
startServer();
export default app;
