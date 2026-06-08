import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import "dotenv/config";
import express from 'express';
import cors from 'cors';
import Database from './config/db';
import { connectRabbitMQ } from './rabbit/connection';
import { startConsumers } from './rabbit/index';
import { startGrpcServer, startRefundWorker } from './server';

// Import routes
import bookingRoutes from './routes/bookingRoutes';
import interactionRoutes from './routes/interactionRoutes';
import adminRoutes from './routes/adminRoutes';
import webhookRoutes from './routes/webhookRoutes';

// Load environment variables

const app = express();
const PORT = process.env.PORT || 5007;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

// Webhook route - MUST be before express.json() to get raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Transaction Service is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to PostgreSQL
        await Database.connect();
        
        // Connect to RabbitMQ
        await connectRabbitMQ();
        console.log('✅ RabbitMQ connected');
        
        // Start RabbitMQ consumers
        await startConsumers();
        console.log('✅ RabbitMQ consumers started');

        // Start gRPC Server
        await startGrpcServer();
        console.log('✅ gRPC Server started');

        // Start Refund Worker
        await startRefundWorker();
        console.log('✅ Refund Worker started');

        // Start Express server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Transaction Service HTTP running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('⚠️ SIGTERM received, shutting down gracefully...');
    await Database.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('⚠️ SIGINT received, shutting down gracefully...');
    await Database.disconnect();
    process.exit(0);
});

// Start the server
startServer();
