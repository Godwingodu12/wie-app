import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from './config/db';
import { connectRabbitMQ } from './rabbit/connection';
import { startConsumers } from './rabbit/index';
// Import routes
import bookingRoutes from './routes/bookingRoutes';
import interactionRoutes from './routes/interactionRoutes';
import adminRoutes from './routes/adminRoutes';
import webhookRoutes from './routes/webhookRoutes';
// Load environment variables
dotenv.config();
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
app.use('/api/webhooks', webhookRoutes);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});
// Error handler
app.use((err, req, res, next) => {
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
        console.log('✅ Database connected');
        // Connect to RabbitMQ
        await connectRabbitMQ();
        console.log('✅ RabbitMQ connected');
        // Start RabbitMQ consumers
        await startConsumers();
        console.log('✅ RabbitMQ consumers started');
        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Transaction Service running on port ${PORT}`);
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
//# sourceMappingURL=server.js.map