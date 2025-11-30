import pkg from 'pg';
const { Pool } = pkg;

interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class Database {
  private pool: pkg.Pool | null = null;

  async connect(): Promise<void> {
    try {
      const config: PoolConfig = {
        host: 'localhost',
        port: 5432,
        database: process.env.DB_NAME || 'wie-user-auth',
        user: 'postgres',
        password: process.env.DB_PASSWORD || 'WIE123',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      this.pool = new Pool(config);

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL connected (WIE User Service)');
      client.release();

      // Only connect - don't create tables here
      // Tables should be created via migrations
    } catch (err) {
      console.error('❌ PostgreSQL connection error:', err);
      process.exit(1);
    }
  }

  getPool(): pkg.Pool {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool;
  }

  async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database connection closed');
    }
  }
}

export default new Database();