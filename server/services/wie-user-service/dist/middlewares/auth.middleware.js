import { verifyToken } from '../utils/jwt';
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({ message: 'Access token required' });
            return;
        }
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Invalid or expired token' });
        return;
    }
};
//# sourceMappingURL=auth.middleware.js.map