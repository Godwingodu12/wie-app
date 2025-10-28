// D:\DEVELOP\wie\server\services\ticket-service\src\rabbit\consumer.js

import { getChannel } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

export const listenQueue = async (queueName, handler) => {
  const channel = getChannel();
  await channel.assertQueue(queueName);

  channel.consume(queueName, async (msg) => {
    const content = JSON.parse(msg.content.toString());
    const response = await handler(content); // your handler returns the response

    channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
      correlationId: msg.properties.correlationId,
    });

    channel.ack(msg);
  });
  console.log(`👂 Listening on ${queueName}`);
};

// Add publishToQueue function for sending requests to other services
export const publishToQueue = async (queueName, message, timeout = 5000) => {
  return new Promise(async (resolve, reject) => {
    try {
      const channel = getChannel();
      
      // Create a temporary reply queue
      const replyQueue = await channel.assertQueue('', { exclusive: true });
      const correlationId = uuidv4();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout for queue ${queueName}`));
      }, timeout);

      // Listen for response
      channel.consume(replyQueue.queue, (msg) => {
        if (msg.properties.correlationId === correlationId) {
          clearTimeout(timeoutId);
          const response = JSON.parse(msg.content.toString());
          resolve(response);
          channel.ack(msg);
        }
      }, { noAck: false });

      // Send the request
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
        correlationId: correlationId,
        replyTo: replyQueue.queue,
      });

    } catch (error) {
      reject(error);
    }
  });
};