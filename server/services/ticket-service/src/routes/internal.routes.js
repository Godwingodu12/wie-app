import express from 'express';
import { clearUserCacheById } from '../grpc/authClient.js';

const router = express.Router();

router.post('/clear-user-cache', (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId required' 
      });
    }
    
    clearUserCacheById(userId);
    
    res.json({ 
      success: true, 
      message: 'Cache cleared for user' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;