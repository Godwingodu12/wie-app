import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 1,
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
    if (this.client && this.isConnected) return this.client;

    try {
      this.client = new Redis(redisConfig);

      this.client.on('connect', () => {
        console.log('✅ Redis connected (media-service)');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.warn('⚠️  Redis connection closed');
        this.isConnected = false;
      });

      await this.client.ping();
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect Redis:', error);
      throw error;
    }
  }

  getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.getClient();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return client.get(key);
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const client = this.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}

export default new RedisClient();