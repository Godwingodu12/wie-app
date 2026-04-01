import { PrismaClient } from "../generated/prisma";
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set — check your .env file");
    process.exit(1);
  }

  // Force-disable prepared statements regardless of URL params
  // This is required for PgBouncer transaction mode (port 6543)
  let safeUrl = dbUrl;
  try {
    const url = new URL(dbUrl);
    url.searchParams.set("statement_cache_size", "0");
    url.searchParams.set("connection_limit", "10");
    url.searchParams.set("pool_timeout", "20");
    url.searchParams.set("connect_timeout", "15");
    safeUrl = url.toString();
    console.log(
      `🔌 Prisma → ${url.hostname}:${url.port} (pool=10, no prepared statements)`,
    );
  } catch {
    // URL parse failed — use as-is
  }

  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url: safeUrl },
    },
  });
}

// Module-level singleton — survives hot reload via global
const prisma = global.__prisma ?? createPrismaClient();
global.__prisma = prisma;

export { prisma };
export default prisma;
