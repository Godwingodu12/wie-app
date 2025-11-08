import { getChannel, isChannelAvailable } from './connection.js';

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
        console.log(`⚡ Processing ${queueName}:`, content);
        
        const response = await handler(content);
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Processed ${queueName} in ${processingTime}ms`);

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

    console.log(`👂 Listening on ${queueName}`);
  } catch (error) {
    console.error(`❌ Error setting up listener for ${queueName}:`, error);
  }
};
