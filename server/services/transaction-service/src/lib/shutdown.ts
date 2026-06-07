import prisma from './prisma';

export async function gracefulShutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);