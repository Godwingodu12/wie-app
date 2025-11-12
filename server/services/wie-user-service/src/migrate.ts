import fs from 'fs';
import path from 'path';
import db from './config/db';
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    // Connect to database
    await db.connect();
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'src', 'migrations', '001_init.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📝 Executing migration file...');
    // Execute the entire SQL file at once
    try {
      await db.query(migrationSQL);
      console.log('✅ Migration executed successfully!');
    } catch (error: any) {
      console.error('❌ Migration error:', error.message);
      throw error;
    }
    // Verify tables
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables in database:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    // Check row counts
    const tables = result.rows.map(r => r.table_name);
    console.log('\n📊 Table row counts:');
    for (const table of tables) {
      try {
        const countResult = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${countResult.rows[0].count} rows`);
      } catch (err) {
        console.log(`  ${table}: (unable to count)`);
      }
    }
    console.log('\n✅ Migration completed successfully!');
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await db.close();
    process.exit(1);
  }
}
runMigrations();