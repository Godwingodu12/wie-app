import pkg from 'pg';
declare class Database {
    private pool;
    connect(): Promise<void>;
    getPool(): pkg.Pool;
    query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
    close(): Promise<void>;
}
declare const _default: Database;
export default _default;
//# sourceMappingURL=db.d.ts.map