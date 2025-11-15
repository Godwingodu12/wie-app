import { connectRabbitMQ, isChannelAvailable } from './connection.js';

export const startConsumers = async () => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }

  console.log('✅ Ticket service acts as RPC client only - no consumers needed');
};

export { connectRabbitMQ };