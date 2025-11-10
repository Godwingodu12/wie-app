import { getChannel } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

export const sendRPC = async (queue, payload) => {
  const channel = getChannel();
  
  if (!channel) {
    throw new Error('RabbitMQ channel not available');
  }

  const correlationId = uuidv4();
  const replyQueue = await channel.assertQueue('', { exclusive: true });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      channel.cancel(consumer.consumerTag);
      reject(new Error(`Timeout: No response from queue "${queue}"`));
    }, 10000); // 10 second timeout

    const consumer = channel.consume(
      replyQueue.queue,
      (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          clearTimeout(timeout);
          try {
            const response = JSON.parse(msg.content.toString());
            resolve(response);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        }
      },
      { noAck: true }
    );

    console.log(`📤 Sending RPC to queue "${queue}":`, payload);
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      correlationId,
      replyTo: replyQueue.queue,
    });
  });
};
