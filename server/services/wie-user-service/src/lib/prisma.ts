import { PrismaClient } from '../generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// ✅ FIX: Use DIRECT_URL to bypass PgBouncer for deleteMany/transactions
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
