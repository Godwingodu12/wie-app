import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }

      // Support multiple token formats
      req.user = {
        _id: decoded.id || decoded.userId || decoded._id,
        id: decoded.id || decoded.userId || decoded._id,
        email: decoded.email,
        role: decoded.role
      };

      next();
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};