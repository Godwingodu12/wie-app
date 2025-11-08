import { listenQueue } from './consumer.js';
import { getUserData, getFollowersData } from '../services/auth.service.js';

export const listenForUserRequests = async () => {
  // LISTEN FOR: ticket-service, user-service (old queue name)
  await listenQueue('get-user', async (payload) => {
    try {
      const userData = await getUserData(payload);
      return userData;
    } catch (error) {
      console.error('❌ Error in get-user handler:', error);
      return { error: error.message };
    }
  });

  // LISTEN FOR: chat-service (new queue name)
  await listenQueue('auth-get-user', async (payload) => {
    try {
      console.log('📦 Received auth-get-user request:', payload);
      const userData = await getUserData(payload);
      console.log('✅ Sending user data response');
      return userData;
    } catch (error) {
      console.error('❌ Error in auth-get-user handler:', error);
      return { error: error.message };
    }
  });

  // LISTEN FOR: chat-service followers
  await listenQueue('auth-get-followers', async (payload) => {
    try {
      const followersData = await getFollowersData(payload);
      return followersData;
    } catch (error) {
      console.error('❌ Error in auth-get-followers handler:', error);
      return { error: error.message };
    }
  });
  console.log('📡 Listening on: get-user, auth-get-user, auth-get-followers');
};
