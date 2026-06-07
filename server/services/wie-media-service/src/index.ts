import "dotenv/config";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './config/db';
import redisClient from './config/redis';
import fluxRoutes from './routes/flux.routes';
import postRoutes from './routes/post.routes';
import diaryRoutes from './routes/diary.routes';
import musicRoutes from './routes/music.routes';
import locationRoutes from './routes/location.routes';
import { archiveExpiredFluxes } from './services/flux.service';
import { initRabbit } from './rabbit';

// Final trigger for fresh env vars and CORS fixes...
const app = express();
const PORT = Number(process.env.PORT) || 5010;


const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").filter(Boolean)
  : ["http://localhost:3000"];

app.use(helmet());
app.use(
  cors({
    origin: configuredOrigins,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes 
app.use('/api/flux', fluxRoutes);
app.use('/api/post', postRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/location', locationRoutes);
app.get('/health', async (_req, res) => {
  const redisOk = await redisClient.healthCheck().catch(() => false);
  res.json({
    status: 'ok',
    service: 'wie-media-service',
    redis: redisOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Bootstrap ──────────────────────────────────────────────

const bootstrap = async () => {
  try {
    await connectDB();
    await redisClient.connect();
    await initRabbit();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ wie-media-service running on port ${PORT}`);
    });

    // Archive expired fluxes every hour
    setInterval(
      async () => {
        const count = await archiveExpiredFluxes().catch(() => 0);
        if (count > 0) console.log(`📦 Archived ${count} expired fluxes`);
      },
      60 * 60 * 1000
    );
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
};

bootstrap();