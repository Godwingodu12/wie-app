import { connectRabbitMQ, isChannelAvailable } from './connection.js';
import { listenForNotificationRequests } from './consumerConnections.js';
export const startConsumers = async () => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }
  try {
    console.log('🎯 Starting RabbitMQ consumers for notification-service...');
    
    await listenForNotificationRequests();
    
    console.log('✅ All RabbitMQ consumers started successfully');
  } catch (error) {
    console.error('❌ Error starting consumers:', error);
  }
};
export { connectRabbitMQ };