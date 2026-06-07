import { PrismaClient } from "../generated/prisma";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set — check your .env file");
    process.exit(1);
  }

  let safeUrl = dbUrl;
  try {
    const url = new URL(dbUrl);
    // PgBouncer transaction mode (port 6543) — keep pool small
    url.searchParams.set("statement_cache_size", "0");
    url.searchParams.set("connection_limit", "3"); // ← was 10, matches pooler
    url.searchParams.set("pool_timeout", "15"); // ← was 20
    url.searchParams.set("connect_timeout", "10"); // ← was 15
    safeUrl = url.toString();
    console.log(
      `🔌 Prisma → ${url.hostname}:${url.port} (pool=3, no prepared statements)`,
    );
  } catch {
    // URL parse failed — use as-is
  }

  return new PrismaClient({
    log: ["error"],
    datasources: { db: { url: safeUrl } },
  });
}

const prisma = global.__prisma ?? createPrismaClient();
global.__prisma = prisma;

export { prisma };
export default prisma;
