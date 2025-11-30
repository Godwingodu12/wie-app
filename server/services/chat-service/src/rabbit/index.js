import { connectRabbitMQ, isChannelAvailable } from './connection.js';
import { listenForChatRequests } from './consumerConnections.js';
// Start all consumers
export const startConsumers = async () => {
  try {
    if (!isChannelAvailable()) {
      console.warn('⚠️ RabbitMQ channel not available, skipping consumer setup');
      return;
    }    
    await listenForChatRequests();
  } catch (error) {
    console.error('❌ Error starting RabbitMQ consumers:', error.message);
    // Don't throw - allow the service to continue running
  }
};
export { connectRabbitMQ };
