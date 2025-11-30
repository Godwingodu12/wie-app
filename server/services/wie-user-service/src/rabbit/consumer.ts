import { getChannel, isChannelAvailable } from './connection';
import * as amqp from 'amqplib';

export const listenQueue = async (
  queueName: string,
  handler: (content: any) => Promise<any>
): Promise<void> => {
  if (!isChannelAvailable()) {
    console.warn(
      `⚠️ RabbitMQ channel not available, skipping queue: ${queueName}`
    );
    return;
  }

  try {
    const channel: amqp.Channel = getChannel();
    await channel.assertQueue(queueName, { durable: true });

    await channel.prefetch(1); // Process one message at a time

    channel.consume(
      queueName,
      async (msg: amqp.ConsumeMessage | null) => {
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
        } catch (error: any) {
          console.error(
            `❌ Error processing message from ${queueName}:`,
            error
          );
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  } catch (error: any) {
    console.error(`❌ Error setting up listener for ${queueName}:`, error);
  }
};