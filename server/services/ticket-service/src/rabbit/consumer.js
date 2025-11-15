// Replace the ENTIRE consumer.js file in ticket-service

import { getChannel, isChannelAvailable } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

export const listenQueue = async (queueName, handler) => {
  if (!isChannelAvailable()) {
    console.warn(`⚠️ RabbitMQ channel not available, skipping queue: ${queueName}`);
    return;
  }

  try {
    const channel = getChannel();
    await channel.assertQueue(queueName, { durable: true });

    await channel.prefetch(1); // Process one message at a time

    channel.consume(queueName, async (msg) => {
      if (!msg) return;
      
      try {
        const content = JSON.parse(msg.content.toString());
        console.log(`📥 Received message on ${queueName}:`, content);
        
        const response = await handler(content);

        if (msg.properties.replyTo) {
          channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(JSON.stringify(response)),
            {
              correlationId: msg.properties.correlationId,
            }
          );
          console.log(`📤 Sent response to ${msg.properties.replyTo}`);
        }

        channel.ack(msg);
      } catch (error) {
        console.error(`❌ Error processing message from ${queueName}:`, error);
        channel.nack(msg, false, false);
      }
    });

    console.log(`✅ Listening on queue: ${queueName}`);
  } catch (error) {
    console.error(`❌ Error setting up listener for ${queueName}:`, error);
  }
};

export const publishToQueue = async (queueName, message, timeout = 10000) => {
  if (!isChannelAvailable()) {
    console.error('❌ RabbitMQ channel is not available');
    throw new Error('RabbitMQ channel is not available');
  }

  return new Promise(async (resolve, reject) => {
    let timeoutId;
    let consumerTag;
    let resolved = false;

    try {
      const channel = getChannel();
      const startTime = Date.now();
      
      // Assert the target queue exists
      await channel.assertQueue(queueName, { durable: true });
      
      // Create exclusive reply queue
      const replyQueue = await channel.assertQueue('', { 
        exclusive: true,
        autoDelete: true 
      });
      
      const correlationId = uuidv4();

      // Set up timeout with proper cleanup
      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        
        const elapsedTime = Date.now() - startTime;
        console.error(`⏱️ Timeout after ${elapsedTime}ms waiting for response from ${queueName}`);
        console.log(`📋 Request details:`, { queueName, correlationId, message });
        
        // Cancel consumer if it exists
        if (consumerTag) {
          channel.cancel(consumerTag).catch((err) => {
            console.warn('⚠️ Error canceling consumer:', err.message);
          });
        }
        
        reject(new Error(`Request timeout for queue ${queueName} after ${elapsedTime}ms`));
      }, timeout);

      // Listen for response
      const consumeResult = await channel.consume(
        replyQueue.queue,
        (msg) => {
          if (!msg) return;
          
          if (msg.properties.correlationId === correlationId) {
            if (resolved) return;
            resolved = true;
            
            const elapsedTime = Date.now() - startTime;
            clearTimeout(timeoutId);
            
            try {
              const response = JSON.parse(msg.content.toString());
              console.log(`✅ Received response from ${queueName} in ${elapsedTime}ms`);
              
              // Check if response contains an error
              if (response && response.error) {
                console.error(`❌ Error in response from ${queueName}:`, response.error);
                reject(new Error(response.error));
              } else {
                resolve(response);
              }
              
              channel.ack(msg);
              
              // Cancel consumer after receiving response
              if (consumerTag) {
                channel.cancel(consumerTag).catch((err) => {
                  console.warn('⚠️ Error canceling consumer:', err.message);
                });
              }
            } catch (parseError) {
              console.error(`❌ Error parsing response from ${queueName}:`, parseError);
              reject(parseError);
            }
          }
        },
        { noAck: false }
      );
      
      consumerTag = consumeResult.consumerTag;

      // Send the request
      channel.sendToQueue(
        queueName, 
        Buffer.from(JSON.stringify(message)), 
        {
          correlationId: correlationId,
          replyTo: replyQueue.queue,
          persistent: true,
          timestamp: Date.now()
        }
      );
      
      console.log(`📤 Sent request to ${queueName} with correlationId: ${correlationId}`);
      
    } catch (error) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        console.error(`❌ Error publishing to queue ${queueName}:`, error);
        reject(error);
      }
    }
  });
};
