import pkg from 'pg';
import prisma from '../lib/prisma';

const { Pool } = pkg;

class Database {
  private pool: pkg.Pool | null = null;
  public isConnected = false;

  async connect(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined');
      }

      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.pool.on('error', (err) => {
        console.error('❌ Unexpected database error:', err);
        this.isConnected = false;
      });

      // Test pg connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      // Connect Prisma (now using DIRECT_URL)
      await prisma.$connect();

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
      throw new Error('Database not connected');
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
      // Disconnect Prisma first
      await prisma.$disconnect();
      
      // Then close pg Pool
      if (this.pool) {
        await this.pool.end();
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
      const result = await this.pool.query('SELECT 1');
      
      // Also check Prisma connection
      await prisma.$queryRaw`SELECT 1`;
      
      return result.rowCount === 1;
    } catch {
      return false;
    }
  }
}

export default new Database();
export { prisma };
