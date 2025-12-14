import { getChannel, isChannelAvailable } from './connection';
import { v4 as uuidv4 } from 'uuid';
import * as amqp from 'amqplib';

export const sendRPC = async <T = any>(
  queue: string,
  payload: any,
  timeout: number = 10000
): Promise<T> => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ channel not available');
  }

  const channel: amqp.Channel = getChannel();
  const correlationId: string = uuidv4();

  let timeoutId: NodeJS.Timeout;
  let consumerTag: string | undefined;
  let resolved = false;

  return new Promise<T>(async (resolve, reject) => {
    try {
      // Assert queue exists
      await channel.assertQueue(queue, { durable: true });

      // Create reply queue
      const replyQueue = await channel.assertQueue('', {
        exclusive: true,
        autoDelete: true,
      });

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        // Cancel consumer safely
        if (consumerTag) {
          channel.cancel(consumerTag).catch((err: Error) => {
            console.warn('⚠️ Error canceling consumer:', err.message);
          });
        }

        reject(new Error(`Timeout: No response from queue "${queue}"`));
      }, timeout);

      // Set up consumer for response
      const consumeResult = await channel.consume(
        replyQueue.queue,
        (msg: amqp.ConsumeMessage | null) => {
          if (!msg) return;

          if (msg.properties.correlationId === correlationId) {
            if (resolved) return;
            resolved = true;

            clearTimeout(timeoutId);

            try {
              const response = JSON.parse(msg.content.toString());
              // Check for error in response
              if (response && response.error) {
                reject(new Error(response.error));
              } else {
                resolve(response as T);
              }

              channel.ack(msg);

              // Cancel consumer
              if (consumerTag) {
                channel.cancel(consumerTag).catch((err: Error) => {
                  console.warn('⚠️ Error canceling consumer:', err.message);
                });
              }
            } catch (error: any) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          }
        },
        { noAck: false }
      );

      // Save consumer tag
      consumerTag = consumeResult.consumerTag;
      // Send the request
      console.log(`📤 Sending RPC to queue "${queue}":`, payload);
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
        correlationId,
        replyTo: replyQueue.queue,
        persistent: true,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId!);
        console.error(`❌ Error in sendRPC to queue "${queue}":`, error);
        reject(error);
      }
    }
  });
};