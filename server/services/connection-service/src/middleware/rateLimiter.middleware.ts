import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import logger from "../utils/logger";

// ── Redis client (optional — falls back to memory if not configured) ─
let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
  redisClient.on("error", (err) => {
    logger.error("Rate limiter Redis error: " + err.message);
  });
}

// ── Helper: build store only when Redis is available
// rate-limit-redis@4 requires `sendCommand`, NOT `client`
function makeStore(prefix: string) {
  if (!redisClient) return undefined; // falls back to memory store

  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) =>
      (redisClient as Redis).call(args[0], ...args.slice(1)) as any,
  });
}

// ── General API limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:general:"),
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

// ── Strict limiter (create / update / delete) ─────────────────────
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:strict:"),
  message: {
    success: false,
    message: "Too many requests for this operation, please try again later.",
  },
});

// ── Upload limiter ────────────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:upload:"),
  message: {
    success: false,
    message: "Too many uploads, please try again later.",
  },
});

// ── Connection request limiter ────────────────────────────────────
export const connectionRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("rl:connection:"),
  message: {
    success: false,
    message: "Too many connection requests, please try again later.",
  },
});
