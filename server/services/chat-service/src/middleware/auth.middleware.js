import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
        
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET not found in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('❌ Token verification failed:', err.message);
        return res.status(403).json({
          success: false,
          message: 'Invalid token',
          error: err.message
        });
      }      
      // Normalize user data - support both userId and id fields
      req.user = {
        userId: decoded.userId || decoded.id,
        id: decoded.id || decoded.userId,
        email: decoded.email,
        role: decoded.role,
        ...decoded
      };
      next();
    });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};
