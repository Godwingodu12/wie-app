import pkg from "pg";
import prisma from "../lib/prisma";

const { Pool } = pkg;

class Database {
  private pool: pkg.Pool | null = null;
  public isConnected = false;

  async connect(): Promise<void> {
    try {
      const connectionString =
        process.env.DIRECT_URL || process.env.DATABASE_URL!;
      const cleanUrl = connectionString.split("?")[0];
      this.pool = new Pool({
        connectionString: cleanUrl,
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
      });

      this.pool.on("error", (err) => {
        // Silent degraded state — don't crash on pool errors
        this.isConnected = false;
      });

      // Test pg connection
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("✅ pg Pool connected");

      await prisma.$connect();
      console.log("✅ Prisma connected");

      this.isConnected = true;
    } catch (err) {
      console.error("❌ DB connection error:", err);
      this.isConnected = false;
      throw err;
    }
  }

  getPool(): pkg.Pool {
    if (!this.pool)
      throw new Error("Database not connected. Call connect() first.");
    return this.pool;
  }

  getPrisma() {
    return prisma;
  }

  async query(text: string, params?: any[]) {
    if (!this.pool) throw new Error("Database not connected");
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    try {
      await prisma.$disconnect();
      if (this.pool) await this.pool.end();
      this.isConnected = false;
    } catch (error) {
      console.error("❌ Error closing DB connections:", error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      const result = await this.pool.query("SELECT 1");
      const ok = result.rowCount === 1;
      this.isConnected = ok;
      return ok;
    } catch {
      this.isConnected = false;
      return false;
    }
  }
}

export default new Database();
export { prisma };
