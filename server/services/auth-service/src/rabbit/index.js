import { connectRabbitMQ } from './connection.js';
import { listenForUserRequests } from './consumerConnections.js';

// Start all RabbitMQ consumers for auth-service
export const startConsumers = async () => {
  try {    
    // Listen for all user-related requests
    await listenForUserRequests();
    console.log('✅ All RabbitMQ consumers started successfully');
  } catch (error) {
    console.error('❌ Error starting RabbitMQ consumers:', error);
    throw error;
  }
};
export { connectRabbitMQ };
