import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  plainPassword: string, 
  hashedPassword: string | null | undefined
): Promise<boolean> => {
  // If no hashed password exists (OAuth users), return false
  if (!hashedPassword) {
    return false;
  }
  
  return bcrypt.compare(plainPassword, hashedPassword);
};

// Type guard to check if user has local authentication
export const isLocalAuthUser = (password: string | null | undefined): password is string => {
  return typeof password === 'string' && password.length > 0;
};