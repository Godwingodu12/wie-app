import jwt from 'jsonwebtoken';
import { WieUser } from '../models/wieuser.model';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  name?: string | null;
  role: string;
}

export const generateToken = (user: WieUser): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    contact_no: user.contact_no,
    name: user.name,
    role: user.role,
  };

  // @ts-ignore - Ignore TypeScript error for expiresIn
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    // @ts-ignore
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};