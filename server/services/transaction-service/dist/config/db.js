import { PrismaClient } from '../generated/prisma';
class Database {
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new PrismaClient({
                log: ['error'],
            });
        }
        return Database.instance;
    }
    static async connect() {
        try {
            const prisma = Database.getInstance();
            await prisma.$connect();
            console.log('✅ PostgreSQL connected (Transaction Service)');
        }
        catch (error) {
            console.error('❌ PostgreSQL connection error:', error);
            process.exit(1);
        }
    }
    static async disconnect() {
        const prisma = Database.getInstance();
        await prisma.$disconnect();
        console.log('✅ PostgreSQL disconnected');
    }
}
export default Database;
export const prisma = Database.getInstance();
//# sourceMappingURL=db.js.map