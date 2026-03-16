import amqp from 'amqplib';

let connection: any = null;
let channel: any = null;
let isConnecting = false;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const connectRabbitMQ = async (): Promise<void> => {
  if (isConnecting) return;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  try {
    isConnecting = true;
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is not defined');
    }
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.prefetch(1);

    connection.on('error', (err: Error) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      channel = null;
      connection = null;
    });
    connection.on('close', () => {
      channel = null;
      connection = null;
      reconnectTimeout = setTimeout(() => connectRabbitMQ(), 5000);
    });
    channel.on('error', (err: Error) => {
      console.error('❌ RabbitMQ channel error:', err.message);
    });
    channel.on('close', () => {
      channel = null;
    });

    console.log('✅ Media-service RabbitMQ connected');
  } catch (err: any) {
    console.error('❌ RabbitMQ connection error:', err.message);
    channel = null;
    connection = null;
    reconnectTimeout = setTimeout(() => connectRabbitMQ(), 5000);
  } finally {
    isConnecting = false;
  }
};

export const getChannel = (): any => {
  if (!channel) throw new Error('RabbitMQ channel is not available');
  return channel;
};

export const isChannelAvailable = (): boolean => !!channel;

export const closeConnection = async (): Promise<void> => {
  try { if (channel) await channel.close(); } catch {}
  try { if (connection) await connection.close(); } catch {}
  channel = null;
  connection = null;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
};