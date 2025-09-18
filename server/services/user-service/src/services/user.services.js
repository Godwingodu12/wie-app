
import { sendRPC } from '../rabbit/producer.js';

export const getProfile = async (req, res) => {
  try {
    const user = await sendRPC('get-user', req.user.id);
    res.status(200).json(user);
  } catch (err) {
    console.error('RPC error:', err);
    res.status(500).json({ message: 'Could not fetch user profile' });
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

