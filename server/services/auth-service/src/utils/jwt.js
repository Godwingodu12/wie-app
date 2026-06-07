import jwt from 'jsonwebtoken';
export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, isBlocked: user.isBlocked },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};
export const verifyResetToken = (token) => {
  try {
    console.log('Verifying token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Token decoded successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};