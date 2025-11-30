import pkg from 'pg';
const { Pool } = pkg;
class Database {
    constructor() {
        this.pool = null;
    }
    async connect() {
        try {
            const config = {
                host: 'localhost',
                port: 5432,
                database: process.env.DB_NAME || 'wie-user-auth',
                user: 'postgres',
                password: process.env.DB_PASSWORD || 'WIE123',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            };
            this.pool = new Pool(config);
            // Test connection
            const client = await this.pool.connect();
            console.log('✅ PostgreSQL connected (WIE User Service)');
            client.release();
            // Only connect - don't create tables here
            // Tables should be created via migrations
        }
        catch (err) {
            console.error('❌ PostgreSQL connection error:', err);
            process.exit(1);
        }
    }
    getPool() {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        return this.pool;
    }
    async query(text, params) {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        return this.pool.query(text, params);
    }
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Database connection closed');
        }
    }
}
export default new Database();
//# sourceMappingURL=db.js.map