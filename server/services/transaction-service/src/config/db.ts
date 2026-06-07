import prisma from '../lib/prisma';

class Database {
  static getInstance() {
    return prisma;
  }

  static async connect(): Promise<void> {
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL connected (Transaction Service)');
    } catch (error) {
      console.error('❌ PostgreSQL connection error:', error);
      process.exit(1);
    }
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
    console.log('✅ PostgreSQL disconnected');
  }
}

export default Database;
export { prisma };
