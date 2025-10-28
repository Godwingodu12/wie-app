import { listenQueue, publishToQueue } from './consumer.js';

export const listenForUserRequests = async () => {
  await listenQueue('get-user', async (userId) => {
    try {
      // This should actually publish a request to auth-service
      // and wait for response, not directly import User model
      const response = await publishToQueue('auth-get-user', { userId });
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  });
};

// Helper function to get user from auth-service
export const getUserFromAuthService = async (userId) => {
  try {
    // Publish request to auth-service
    const user = await publishToQueue('auth-get-user', { userId });
    return user;
  } catch (error) {
    console.error('Error communicating with auth-service:', error);
    throw error;
  }
};