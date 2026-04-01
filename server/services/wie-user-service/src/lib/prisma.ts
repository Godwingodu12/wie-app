import { PrismaClient } from "../generated/prisma";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}
const safeUrl = (() => {
  try {
    const url = new URL(dbUrl);
    // Remove any bad connection_limit and set a safe one
    url.searchParams.delete("connection_limit");
    url.searchParams.delete("pgbouncer");
    url.searchParams.set("connection_limit", "10");
    url.searchParams.set("pool_timeout", "20");
    url.searchParams.set("connect_timeout", "15");
    console.log(`🔌 Prisma → ${url.hostname}:${url.port} (limit=10)`);
    return url.toString();
  } catch {
    return dbUrl;
  }
})();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url: safeUrl },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
