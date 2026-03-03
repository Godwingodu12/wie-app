import pkg from 'pg';
import prisma from '../lib/prisma';

const { Pool } = pkg;

class Database {
  private pool: pkg.Pool | null = null;
  public isConnected = false;

  async connect(): Promise<void> {
    try {
      // ── pg Pool uses DIRECT_URL (no pgbouncer) ──
      // DATABASE_URL has pgbouncer=true which breaks raw pg connections
      const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

      if (!connectionString) {
        throw new Error('DIRECT_URL or DATABASE_URL is not defined');
      }

      // Strip pgbouncer params that break raw pg
      const cleanUrl = connectionString
        .replace(/[?&]pgbouncer=true/g, '')
        .replace(/[?&]connection_limit=\d+/g, '')
        .replace(/[?&]pool_timeout=\d+/g, '')
        .replace(/\?&/, '?')
        .replace(/&&/g, '&')
        .replace(/[?&]$/, '');

      this.pool = new Pool({
        connectionString: cleanUrl,
        ssl: { rejectUnauthorized: false },
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });

      this.pool.on('error', (err) => {
        console.error('❌ Unexpected pg pool error:', err);
        this.isConnected = false;
      });

      // Test pg connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ pg Pool connected');

      // Connect Prisma separately (uses DATABASE_URL with pgbouncer)
      await prisma.$connect();
      console.log('✅ Prisma connected');

      console.log('✅ Supabase PostgreSQL connected (WIE User Service - Prisma + pg Pool)');
      this.isConnected = true;

    } catch (err) {
      console.error('❌ Supabase DB connection error:', err);
      this.isConnected = false;
      throw err;
    }
  }

  getPool(): pkg.Pool {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  getPrisma() {
    return prisma;
  }

  async query(text: string, params?: any[]) {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    try {
      await prisma.$disconnect();
      console.log('✅ Prisma disconnected');

      if (this.pool) {
        await this.pool.end();
        console.log('✅ pg Pool closed');
      }

      this.isConnected = false;
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      const [pgResult] = await Promise.all([
        this.pool.query('SELECT 1'),
        prisma.$queryRaw`SELECT 1`,
      ]);
      return pgResult.rowCount === 1;
    } catch {
      return false;
    }
  }
}

export default new Database();
export { prisma };
