// ============================================================================
// FILE 1: D:\DEVELOP\wie\server\services\wie-follow-service\src\config\redis.ts
// ============================================================================
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

class RedisClient {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<Redis> {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      this.client = new Redis(redisConfig);

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('⚠️ Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      // Test connection
      await this.client.ping();
      console.log('✅ Redis ping successful');
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected. Call connect() first.');
    }
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('✅ Redis disconnected');
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      console.warn('Redis not ready, skipping get operation');
      return null;
    }
    try {
      return await this.client!.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Set a value in Redis with optional expiration
   */
  async set(key: string, value: string, expirySeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Redis not ready, skipping set operation');
      return false;
    }
    try {
      if (expirySeconds) {
        await this.client!.set(key, value, 'EX', expirySeconds);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Redis not ready, skipping del operation');
      return false;
    }
    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('Redis not ready, skipping exists operation');
      return false;
    }
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Get TTL (time to live) of a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isReady()) {
      console.warn('Redis not ready, skipping ttl operation');
      return -1;
    }
    try {
      return await this.client!.ttl(key);
    } catch (error) {
      console.error('Redis TTL error:', error);
      return -1;
    }
  }
}

export default new RedisClient();