import { WieUser } from '../models/wieuser.model';
export interface TokenPayload {
    id: string;
    email?: string | null;
    contact_no?: string | null;
    name?: string | null;
    role: string;
}
export declare const generateToken: (user: WieUser) => string;
export declare const verifyToken: (token: string) => TokenPayload;
export declare const decodeToken: (token: string) => TokenPayload | null;
//# sourceMappingURL=jwt.d.ts.map