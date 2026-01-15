import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import logger from '../utils/logger';

// Create Redis client for rate limiting
let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (err) => {
    logger.error('Rate limiter Redis error:', err);
  });
}

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/user to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore - Redis client type mismatch
      client: redisClient,
      prefix: 'rl:general:',
    }),
  }),
});

// Strict limiter for sensitive operations (create, update, delete)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for this operation, please try again later.',
  },
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:strict:',
    }),
  }),
});

// Upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit to 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many uploads, please try again later.',
  },
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:upload:',
    }),
  }),
});

// Connection request limiter
export const connectionRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit to 50 connection requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many connection requests, please try again later.',
  },
  ...(redisClient && {
    store: new RedisStore({
      // @ts-ignore
      client: redisClient,
      prefix: 'rl:connection:',
    }),
  }),
});