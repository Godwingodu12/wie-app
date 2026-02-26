import { getChannel, isChannelAvailable } from './connection.js';
import { v4 as uuidv4 } from 'uuid';
export const listenQueue = async (queueName, handler) => {
  if (!isChannelAvailable()) {
    console.warn(`⚠️ RabbitMQ channel not available, skipping queue: ${queueName}`);
    return;
  }
  try {
    const channel = getChannel();
    // Assert queue WITHOUT x-message-ttl
    await channel.assertQueue(queueName, { 
      durable: true
    });
    // Set prefetch to process messages one at a time
    await channel.prefetch(1);
    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      const startTime = Date.now();
      
      try {
        const content = JSON.parse(msg.content.toString());        
        const response = await handler(content);
        const processingTime = Date.now() - startTime;
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
        const processingTime = Date.now() - startTime;
        console.error(`❌ Error processing ${queueName} after ${processingTime}ms:`, error);
        
        // Send error response if replyTo is present
        if (msg.properties.replyTo) {
          try {
            channel.sendToQueue(
              msg.properties.replyTo,
              Buffer.from(JSON.stringify({ error: error.message })),
              {
                correlationId: msg.properties.correlationId,
              }
            );
          } catch (sendError) {
            console.error(`❌ Failed to send error response:`, sendError);
          }
        }
        
        // Nack without requeue to avoid infinite loops
        channel.nack(msg, false, false);
      }
    });
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

    try {
      const channel = getChannel();
      
      // Assert the target queue exists
      await channel.assertQueue(queueName, { durable: true });
      
      // Create exclusive reply queue
      const replyQueue = await channel.assertQueue('', { 
        exclusive: true,
        autoDelete: true 
      });
      
      const correlationId = uuidv4();

      // Set up timeout with cleanup
      timeoutId = setTimeout(() => {
        // Cancel consumer if it exists
        if (consumerTag) {
          channel.cancel(consumerTag).catch(() => {});
        }
        
        reject(new Error(`Request timeout for queue ${queueName}`));
      }, timeout);

      // Listen for response
      const { consumerTag: tag } = await channel.consume(
        replyQueue.queue,
        (msg) => {
          if (msg && msg.properties.correlationId === correlationId) {
            clearTimeout(timeoutId);
            
            try {
              const response = JSON.parse(msg.content.toString());
              
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
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`❌ Error publishing to queue ${queueName}:`, error);
      reject(error);
    }
  });
};
// Use this instead of listenQueue when the message comes from a topic exchange(for event.cancelled routing key)
export const listenExchangeQueue = async (
  exchangeName,
  routingKey,
  queueName,
  handler
) => {
  if (!isChannelAvailable()) {
    console.warn(`⚠️ RabbitMQ channel not available, skipping exchange queue: ${queueName}`);
    return;
  }

  try {
    const channel = getChannel();

    // Assert exchange
    await channel.assertExchange(exchangeName, 'topic', { durable: true });

    // Assert durable queue
    await channel.assertQueue(queueName, { durable: true });

    // Bind queue to exchange with routing key
    await channel.bindQueue(queueName, exchangeName, routingKey);

    channel.prefetch(5);

    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        channel.ack(msg);
      } catch (error) {
        console.error(`❌ Error processing exchange queue "${queueName}":`, error.message);
        channel.nack(msg, false, false); // No requeue — avoid infinite loops
      }
    });
  } catch (error) {
    console.error(`❌ Error setting up exchange listener for "${queueName}":`, error.message);
  }
};

