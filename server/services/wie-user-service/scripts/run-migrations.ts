import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function runPrismaMigrations() {
  try {
    console.log('🚀 Starting Prisma migrations...\n');

    // Generate Prisma Client
    console.log('📦 Generating Prisma Client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma Client generated successfully\n');

    // Run migrations
    console.log('🔄 Running database migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('✅ All migrations completed successfully!\n');

    // Optional: View migration status
    console.log('📊 Migration status:');
    const { stdout: statusOutput } = await execAsync('npx prisma migrate status');
    console.log(statusOutput);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

runPrismaMigrations();