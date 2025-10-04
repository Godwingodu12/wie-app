import { getChannel } from './connection.js';
import User from '../models/User.js'; // Adjust path to your User model

export const startConsumers = async () => {
  const channel = getChannel();
  await channel.assertQueue('get-user', { durable: false });
  console.log('👂 Waiting for RPC requests on queue: get-user');
  channel.consume('get-user', async (msg) => {
    if (msg) {
      try {
        const payload = JSON.parse(msg.content.toString());
        console.log('📥 Received RPC request:', payload);
        const user = await User.findById(payload.userId).select('-password');
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify(user)),
          {
            correlationId: msg.properties.correlationId,
          }
        );
        channel.ack(msg);
        console.log('✅ RPC response sent');
      } catch (err) {
        console.error('❌ Error processing RPC request:', err);
        channel.sendToQueue(
          msg.properties.replyTo,
          Buffer.from(JSON.stringify({ error: err.message })),
          {
            correlationId: msg.properties.correlationId,
          }
        );
        channel.ack(msg);
      }
    }
  });
};

// Add more consumers as needed
export const startAllConsumers = async () => {
  try {
    await startConsumers();
    console.log('✅ All RabbitMQ consumers started');
  } catch (err) {
    console.error('❌ Failed to start consumers:', err);
    throw err;
  }
};