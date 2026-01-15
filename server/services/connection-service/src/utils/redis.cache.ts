import Redis from 'ioredis';
import logger from './logger';

class RedisCache {
  private client: Redis | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const redisUrl = process.env.REDIS_URL;

      if (!redisUrl) {
        logger.warn('Redis URL not configured. Caching disabled.');
        return;
      }

      // Parse Redis URL to support database selection
      // Format: redis://localhost:6379/1
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: false,
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected successfully');
        this.isEnabled = true;
      });

      this.client.on('error', (err) => {
        logger.error('❌ Redis connection error:', err);
        this.isEnabled = false;
      });

      this.client.on('close', () => {
        logger.warn('⚠️ Redis connection closed');
        this.isEnabled = false;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.isEnabled = false;
    }
  }

  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.debug('Redis not available, skipping cache set');
      return;
    }

    try {
      await this.client.setex(key, ttl, JSON.stringify(data));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Failed to set cache for key ${key}:`, error);
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.isEnabled || !this.client) {
      logger.debug('Redis not available, skipping cache get');
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(data);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete cache for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug(`Cache deleted pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error(`Failed to delete cache pattern ${pattern}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check cache existence for key ${key}:`, error);
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }

  isReady(): boolean {
    return this.isEnabled && this.client !== null;
  }
}

// Export singleton instance
export const redisCache = new RedisCache();
export default redisCache;