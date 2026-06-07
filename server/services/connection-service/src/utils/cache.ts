interface CacheItem {
  data: any;
  expiresAt: number;
}

class InMemoryCache {
  private cache: Map<string, CacheItem> = new Map();

  set(key: string, data: any, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries periodically
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new InMemoryCache();

// Clean expired cache every 10 minutes
setInterval(() => {
  cache.cleanExpired();
}, 10 * 60 * 1000);