import { getChannel, isChannelAvailable } from './connection';
import { v4 as uuidv4 } from 'uuid';

export const sendRPC = (queue: string, payload: object): Promise<any> =>
  new Promise((resolve, reject) => {
    if (!isChannelAvailable()) {
      return reject(new Error('RabbitMQ channel not available'));
    }
    const channel   = getChannel();
    const replyQueue = `${queue}.reply.${uuidv4()}`;
    const corrId    = uuidv4();
    const timeout   = setTimeout(() => reject(new Error(`RPC timeout for ${queue}`)), 10_000);

    channel.assertQueue(replyQueue, { exclusive: true, autoDelete: true })
      .then(() => {
        channel.consume(
          replyQueue,
          (msg: any) => {
            if (!msg || msg.properties.correlationId !== corrId) return;
            clearTimeout(timeout);
            channel.deleteQueue(replyQueue).catch(() => {});
            resolve(JSON.parse(msg.content.toString()));
          },
          { noAck: true }
        );
        return channel.assertQueue(queue, { durable: true });
      })
      .then(() => {
        channel.sendToQueue(
          queue,
          Buffer.from(JSON.stringify(payload)),
          { correlationId: corrId, replyTo: replyQueue, persistent: true }
        );
      })
      .catch((err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });
  });

export const publishToQueue = async (queue: string, payload: object): Promise<void> => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available, skipping publish');
    return;
  }
  const channel = getChannel();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
};