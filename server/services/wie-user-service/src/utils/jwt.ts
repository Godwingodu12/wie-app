import jwt from 'jsonwebtoken';
import { WieUser } from '../models/wieuser.model';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface TokenPayload {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  name?: string | null;
  role: string;
  token_version: number;
}
export const generateToken = (user: WieUser): string => {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    contact_no: user.contact_no,
    name: user.name,
    role: user.role,
    token_version: user.token_version,
  };
  // Unlimited session
  return jwt.sign(payload, JWT_SECRET);
};
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};
