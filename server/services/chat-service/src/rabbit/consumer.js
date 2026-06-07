import { getChannel, isChannelAvailable } from './connection.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
export const listenQueue = async (queueName, handler) => {
  if (!isChannelAvailable()) {
    console.warn(`⚠️ RabbitMQ channel not available, skipping queue: ${queueName}`);
    return;
  }

  try {
    const channel = getChannel();
    await channel.assertQueue(queueName, { 
      durable: true
      // Remove arguments
    });

    await channel.prefetch(1);

    channel.consume(queueName, async (msg) => {
      if (!msg) return;
      
      try {
        const content = JSON.parse(msg.content.toString());
        const response = await handler(content);

        if (msg.properties.replyTo) {
          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(response)),
            {
              correlationId: msg.properties.correlationId,
            }
          );
        }

        channel.ack(msg);
      } catch (error) {
        console.error(`❌ Error processing message from ${queueName}:`, error);
        channel.nack(msg, false, false);
      }
    });
  } catch (error) {
    console.error(`❌ Error setting up listener for ${queueName}:`, error);
  }
};

export const publishToQueue = async (queueName, message, timeout = 5000) => {
  if (!isChannelAvailable()) {
    console.error('❌ RabbitMQ channel is not available');
    throw new Error('RabbitMQ channel is not available');
  }

  return new Promise(async (resolve, reject) => {
    let timeoutId;
    let consumerTag;

    try {
      const channel = getChannel();
      const startTime = Date.now();
      
      await channel.assertQueue(queueName, { 
        durable: true
        // Remove arguments
      });
      
      const replyQueue = await channel.assertQueue('', { 
        exclusive: true,
        autoDelete: true
        // Remove arguments
      });
      
      const correlationId = uuidv4();

      timeoutId = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        console.error(`⏱️ Timeout after ${elapsedTime}ms waiting for response from ${queueName}`);
        
        if (consumerTag) {
          channel.cancel(consumerTag).catch(() => {});
        }
        
        reject(new Error(`Request timeout for queue ${queueName} after ${elapsedTime}ms`));
      }, timeout);

      const { consumerTag: tag } = await channel.consume(
        replyQueue.queue,
        (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            const elapsedTime = Date.now() - startTime;
            clearTimeout(timeoutId);
            try {
              const response = JSON.parse(msg.content.toString());              
              if (response && response.error) {
                console.error(`❌ Error in response from ${queueName}:`, response.error);
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
              
              channel.ack(msg);
              
              if (consumerTag) {
                channel.cancel(consumerTag).catch(() => {});
              }
            } catch (parseError) {
              console.error(`❌ Error parsing response from ${queueName}:`, parseError);
              reject(parseError);
            }
          }
        },
        { noAck: false }
      );
      
      consumerTag = tag;

      channel.sendToQueue(
        queueName, 
        Buffer.from(JSON.stringify(message)), 
        {
          correlationId: correlationId,
          replyTo: replyQueue.queue,
          persistent: true,
          timestamp: Date.now()
          // Remove expiration
        }
      );      
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ Error publishing to queue ${queueName}:`, error);
      reject(error);
    }
  });
};
