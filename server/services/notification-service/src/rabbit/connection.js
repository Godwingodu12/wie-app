import amqp from 'amqplib';

let connection;
let channel;
let isConnecting = false;

export const connectRabbitMQ = async () => {
  if (isConnecting) {
    console.log('⏳ Already attempting to connect to RabbitMQ...');
    return;
  }

  try {
    isConnecting = true;
    
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is not defined in environment variables');
    }

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    console.log('✅ Connected to RabbitMQ (Notification Service)');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed. Reconnecting in 5 seconds...');
      channel = null;
      connection = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    // Handle channel errors
    channel.on('error', (err) => {
      console.error('❌ RabbitMQ channel error:', err);
    });

    channel.on('close', () => {
      console.warn('⚠️ RabbitMQ channel closed');
      channel = null;
    });

  } catch (err) {
    console.error('❌ RabbitMQ connection error:', err.message);
    channel = null;
    connection = null;
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectRabbitMQ, 5000);
  } finally {
    isConnecting = false;
  }
};
export const getChannel = () => {
  if (!channel) {
    throw new Error('RabbitMQ channel is not available');
  }
  return channel;
};

export const isChannelAvailable = () => {
  return channel !== null && channel !== undefined;
};