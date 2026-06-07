import { listenQueue } from './consumer.js';
import { getUserData, getUser, getFollowersData } from '../services/auth.service.js';
export const listenForUserRequests = async () => {
  // LISTEN FOR: ticket-service, user-service
  // Gets logged-in user's OWN data
  await listenQueue('get-user', async (payload) => {
    const startTime = Date.now();
    try {
      const userId = payload.userId || payload;
      const userData = await getUserData({ userId });
      return userData;
    } catch (error) {
      console.error('❌ Error in get-user handler:', error);
      return { error: error.message };
    }
  });
  // LISTEN FOR: chat-service
  // Handles BOTH: get single user AND search users
  await listenQueue('auth-get-user', async (payload) => {
    const startTime = Date.now();
    try {      
      const result = await getUser(payload);
      return result;
    } catch (error) {
      console.error('❌ Error in auth-get-user handler:', error);
      return { error: error.message };
    }
  });

  // LISTEN FOR: chat-service followers
  await listenQueue('auth-get-followers', async (payload) => {
    const startTime = Date.now();
    try {
      const followersData = await getFollowersData(payload);
      return followersData;
    } catch (error) {
      console.error('❌ Error in auth-get-followers handler:', error);
      return { error: error.message };
    }
  });
};
