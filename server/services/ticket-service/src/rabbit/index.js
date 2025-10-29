import { connectRabbitMQ, isChannelAvailable } from './connection.js';
import { listenForUserRequests } from './consumerConnections.js';

export const startConsumers = async () => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }

  try {
    await listenForUserRequests();
    console.log('✅ All RabbitMQ consumers started');
  } catch (error) {
    console.error('❌ Error starting consumers:', error);
  }
};

export { connectRabbitMQ };
