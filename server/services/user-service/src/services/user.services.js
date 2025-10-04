import { sendRPC } from '../rabbit/producer.js';
import { isChannelAvailable } from '../rabbit/connection.js';

export const getProfile = async (req, res) => {
  try {
    // Check if RabbitMQ is available
    if (!isChannelAvailable()) {
      console.error('❌ RabbitMQ channel not available');
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. Please try again later.',
        error: 'RabbitMQ connection not available'
      });
    }

    console.log('🔵 Sending RPC request for user:', req.user.id);
    
    // Send RPC request with user ID - sending as object
    const user = await sendRPC('get-user', { userId: req.user.id });
    
    console.log('🟢 Received RPC response');
    
    // Check if response contains error
    if (user && user.error) {
      console.error('❌ Error from auth-service:', user.error);
      return res.status(404).json({ message: user.error });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('❌ RPC error:', err);
    
    // Provide specific error messages
    if (err.message.includes('timeout')) {
      return res.status(504).json({ 
        message: 'Request timeout. The auth service might be down or not consuming the queue.',
        error: err.message 
      });
    }
    
    if (err.message.includes('not available')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable.',
        error: err.message 
      });
    }

    res.status(500).json({ 
      message: 'Could not fetch user profile',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
export const updateProfile = async (req, res) => {
  try {
    const updatedUser = await sendRPC('get-user', { userId: req.user.id });
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('RPC error:', err);
    res.status(500).json({ message: 'Could not update user profile' });
  }
};

