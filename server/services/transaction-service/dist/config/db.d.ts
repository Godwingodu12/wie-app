import { PrismaClient } from '../generated/prisma';
declare class Database {
    private static instance;
    static getInstance(): PrismaClient;
    static connect(): Promise<void>;
    static disconnect(): Promise<void>;
}
export default Database;
export declare const prisma: PrismaClient<import("../generated/prisma").Prisma.PrismaClientOptions, never, import("../generated/prisma/runtime/library").DefaultArgs>;
//# sourceMappingURL=db.d.ts.map