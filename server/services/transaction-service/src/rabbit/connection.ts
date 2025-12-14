import amqp from 'amqplib';
let connection: any = null;
let channel: any = null;
let isConnecting = false;
let reconnectTimeout: NodeJS.Timeout | null = null;
export const connectRabbitMQ = async (): Promise<void> => {
  if (isConnecting) {
    return;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  try {
    isConnecting = true;
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is not defined in environment variables');
    }    
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.prefetch(1);
    // Handle connection errors
    connection.on('error', (err: Error) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      if (channel) {
        try {
          channel.close().catch(() => {});
        } catch (e) {
          // Ignore
        }
      }
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      if (channel) {
        try {
          channel.close().catch(() => {});
        } catch (e) {
          // Ignore
        }
      }
      channel = null;
      connection = null;

      // Schedule reconnection
      reconnectTimeout = setTimeout(() => {
        connectRabbitMQ();
      }, 5000);
    });

    // Handle channel errors
    channel.on('error', (err: Error) => {
      console.error('❌ RabbitMQ channel error:', err.message);
    });

    channel.on('close', () => {
      console.warn('⚠️ RabbitMQ channel closed');
      channel = null;
    });
  } catch (err: any) {
    console.error('❌ RabbitMQ connection error:', err.message);
    channel = null;
    connection = null;

    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    reconnectTimeout = setTimeout(() => {
      connectRabbitMQ();
    }, 5000);
  } finally {
    isConnecting = false;
  }
};
// -------------------------------------------
// Utility functions
// -------------------------------------------
const safeClose = async () => {
  if (channel) {
    try { await channel.close(); } catch {}
    channel = null;
  }
  if (connection) {
    try { await connection.close(); } catch {}
    connection = null;
  }
};

const scheduleReconnect = () => {
  if (!reconnectTimeout) {
    console.log("🔄 Retrying in 5 seconds...");
    reconnectTimeout = setTimeout(connectRabbitMQ, 5000);
  }
};
export const getChannel = (): any => {
  if (!channel) {
    throw new Error('RabbitMQ channel is not available');
  }
  return channel;
};
export const isChannelAvailable = (): boolean => {
  return !!channel;
};

export const closeConnection = async (): Promise<void> => {
  safeClose();
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  console.log("✅ Closed RabbitMQ Connection");
};
