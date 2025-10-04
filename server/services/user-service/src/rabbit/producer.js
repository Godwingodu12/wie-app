import { getChannel, isChannelAvailable } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

export const sendRPC = async (queue, payload, timeout = 10000) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel is not available. Please check connection.');
  }

  const channel = getChannel();
  const correlationId = uuidv4();
  
  try {
    const replyQueue = await channel.assertQueue('', { exclusive: true });
    
    return new Promise((resolve, reject) => {
      let consumerTag = null;
      let timeoutId = null;
      let isResolved = false;

      // Cleanup function
      const cleanup = async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (consumerTag && channel) {
          try {
            await channel.cancel(consumerTag);
          } catch (err) {
            console.error('Error canceling consumer:', err.message);
          }
        }
      };

      // Set up timeout
      timeoutId = setTimeout(async () => {
        if (!isResolved) {
          isResolved = true;
          await cleanup();
          console.error(`❌ RPC timeout for queue '${queue}' - No consumer responding!`);
          console.error(`   Check if auth-service is running and consuming queue '${queue}'`);
          reject(new Error(`RPC timeout: No response from queue '${queue}' after ${timeout}ms. Check if auth-service is running and consuming this queue.`));
        }
      }, timeout);

      // Consume response
      channel.consume(
        replyQueue.queue,
        async (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            if (!isResolved) {
              isResolved = true;
              await cleanup();
              
              try {
                const response = JSON.parse(msg.content.toString());
                resolve(response);
              } catch (err) {
                reject(new Error('Failed to parse RPC response: ' + err.message));
              }
            }
          }
        },
        { noAck: true }
      ).then((result) => {
        consumerTag = result.consumerTag;
      }).catch((err) => {
        reject(new Error('Failed to set up consumer: ' + err.message));
      });

      // Send request
      try {
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
          correlationId,
          replyTo: replyQueue.queue,
          persistent: false,
        });
        
        console.log(`📤 RPC request sent to queue '${queue}' with correlationId: ${correlationId}`);
      } catch (err) {
        cleanup();
        reject(new Error('Failed to send RPC request: ' + err.message));
      }
    });
  } catch (err) {
    throw new Error(`RPC setup failed for queue '${queue}': ${err.message}`);
  }
};
