import amqp from 'amqplib';

let connection;
let channel;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export const connectRabbitMQ = async () => {
  if (isConnecting) {
    console.log('⏳ Already attempting to connect to RabbitMQ...');
    return;
  }

  if (channel) {
    console.log('✅ RabbitMQ already connected');
    return;
  }

  try {
    isConnecting = true;
    
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is not defined in environment variables');
    }

    console.log('🔌 Connecting to RabbitMQ...');

    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Reset reconnect attempts on successful connection
    reconnectAttempts = 0;
    
    console.log('✅ Connected to RabbitMQ (Auth Service)');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed');
      channel = null;
      connection = null;
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000);
        reconnectAttempts++;
        console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connectRabbitMQ, delay);
      }
    });

    // Handle channel errors
    channel.on('error', (err) => {
      console.error('❌ RabbitMQ channel error:', err.message);
    });

    channel.on('close', () => {
      console.warn('⚠️ RabbitMQ channel closed');
      channel = null;
    });

  } catch (err) {
    console.error('❌ RabbitMQ connection failed:', err.message);
    channel = null;
    connection = null;
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000);
      reconnectAttempts++;
      console.log(`🔄 Retrying in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connectRabbitMQ, delay);
    }
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

export const closeRabbitMQ = async () => {
  try {
    if (channel) {
      await channel.close();
      console.log('✅ RabbitMQ channel closed');
    }
    if (connection) {
      await connection.close();
      console.log('✅ RabbitMQ connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing RabbitMQ:', error.message);
  }
};
