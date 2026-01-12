import { getChannel, isChannelAvailable } from './connection';
import { v4 as uuidv4 } from 'uuid';
import { ConsumeMessage } from 'amqplib';

const EXCHANGE = 'wie.events';
const EXCHANGE_TYPE = 'topic';

export const publishToQueue = async (
  routingKey: string,
  payload: any
): Promise<void> => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ channel not available');
    return;
  }

  const channel = getChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });

  channel.publish(
    EXCHANGE,
    routingKey,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
};

/**
 * RPC-style request (used for notification-service)
 */
export const sendRPC = async (
  queue: string,
  payload: any
): Promise<any> => {
  const channel = getChannel();
  const { queue: replyQueue } = await channel.assertQueue('', {
    exclusive: true,
  });

  const correlationId = uuidv4();

  return new Promise((resolve, reject) => {
    channel.consume(
      replyQueue,
      (msg: ConsumeMessage | null) => {
        if (!msg) return;

        if (msg.properties.correlationId === correlationId) {
          resolve(JSON.parse(msg.content.toString()));
        }
      },
      { noAck: true }
    );

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      correlationId,
      replyTo: replyQueue,
      persistent: true,
    });
  });
};
