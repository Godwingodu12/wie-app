import amqp from 'amqplib';

const RABBITMQ_URL  = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'wie.events';
const ROUTING_KEY_CANCEL = 'event.cancelled';

let connection = null;
let channel    = null;

const getChannel = async () => {
  if (channel) return channel;
  connection = await amqp.connect(RABBITMQ_URL);
  channel    = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  return channel;
};
export const publishEventCancellation = async (payload) => {
  const ch      = await getChannel();
  const message = Buffer.from(JSON.stringify(payload));
  ch.publish(EXCHANGE_NAME, ROUTING_KEY_CANCEL, message, {
    persistent:  true,
    contentType: 'application/json',
    timestamp:   Date.now(),
    messageId:   `evt_cancel_${payload.eventId}_${Date.now()}`,
  });
};

// Generic publisher — use for any routing key on the wie.events exchange
export const publishToExchange = async (exchange, routingKey, payload) => {
  const ch      = await getChannel();
  // Ensure the requested exchange is asserted (getChannel only asserts wie.events)
  if (exchange !== EXCHANGE_NAME) {
    await ch.assertExchange(exchange, 'topic', { durable: true });
  }
  const message = Buffer.from(JSON.stringify(payload));
  ch.publish(exchange, routingKey, message, {
    persistent:  true,
    contentType: 'application/json',
    timestamp:   Date.now(),
    messageId:   `${routingKey}_${payload.eventId ?? 'unknown'}_${Date.now()}`,
  });
};
