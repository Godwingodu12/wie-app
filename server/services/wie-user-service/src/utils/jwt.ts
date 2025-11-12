import jwt from 'jsonwebtoken';
import { WieUser } from '../models/wieuser.model.js';

interface TokenPayload {
  id: string;
  role: string;
  isBlocked: boolean;
}

export const generateToken = (user: WieUser): string => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      isBlocked: user.is_blocked 
    },
    process.env.JWT_SECRET || 'supersecretkey',
    { expiresIn: '1d' }
  );
};

export const verifyResetToken = (token: string): TokenPayload => {
  try {
    console.log('Verifying token:', token);
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'supersecretkey'
    ) as TokenPayload;
    console.log('Token decoded successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};