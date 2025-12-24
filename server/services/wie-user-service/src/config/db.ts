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
  public isConnected: boolean = false; // Add this property

  async connect(): Promise<void> {
    try {
      const config: PoolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'wie-user-auth',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'WIE123',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };

      this.pool = new Pool(config);

      // Add error handler
      this.pool.on('error', (err) => {
        console.error('❌ Unexpected database error:', err);
        this.isConnected = false;
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL connected (WIE User Service)');
      this.isConnected = true;
      client.release();

    } catch (err) {
      console.error('❌ PostgreSQL connection error:', err);
      this.isConnected = false;
      throw err; // Don't exit process, let the caller handle it
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
      this.isConnected = false;
      console.log('✅ Database connection closed');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      const result = await this.pool.query('SELECT 1');
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }
}

export default new Database();