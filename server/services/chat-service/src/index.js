import express from 'express';
import bodyParser from 'body-parser';
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
import { startChatGrpcServer } from './grpc/server.js';
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5004;

const allowedOrigins = [
  process.env.CORS_ORIGIN      || 'http://localhost:5173',
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// ── Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'chat-service',
    timestamp: new Date().toISOString()
  });
});

// ── Routes
app.use('/api/chat',       chatRoutes);
app.use('/api/wie-chat',   wieChatRoutes);
app.use('/api/chat-block', blockRoutes);
app.use('/api/chat-report', reportRoutes);
startChatGrpcServer(process.env.GRPC || 50056);

// ── Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Multer errors (file size / type)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large' });
  }
  if (err.message?.includes('Only') || err.message?.includes('File type')) {
    return res.status(415).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connected');

    initializeSocket(server);
    initializeWieSocket(server);

    server.listen(PORT, () => {
      console.log(`✅ Chat Service running on port ${PORT}`);
      console.log(`📍 HTTP:         http://localhost:${PORT}`);
      console.log(`📍 Admin Socket: /socket.io`);
      console.log(`📍 WIE Socket:   /wie-socket.io`);
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

process.on('SIGINT',  async () => { console.log('\n🛑 Shutting down gracefully...'); process.exit(0); });
process.on('SIGTERM', async () => { console.log('\n🛑 Shutting down gracefully...'); process.exit(0); });

startServer();
export default app;
