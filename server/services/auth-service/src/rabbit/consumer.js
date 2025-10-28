
import { getChannel } from './connection.js';

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
