import { Request, Response, NextFunction } from 'express';
interface JwtPayload {
    id: string;
    email?: string;
    role?: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const isAdmin: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=auth.d.ts.map