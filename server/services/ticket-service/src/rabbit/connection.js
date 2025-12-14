import amqp from 'amqplib';

let connection;
let channel;
let isConnecting = false;
let reconnectTimeout;

export const connectRabbitMQ = async () => {
  if (isConnecting) {
    console.log('⏳ Already attempting to connect to RabbitMQ...');
    return;
  }

  // Clear any existing reconnect timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  try {
    isConnecting = true;
    
    if (!process.env.RABBITMQ_URL) {
      throw new Error('RABBITMQ_URL is not defined in environment variables');
    }

    console.log('🔌 Connecting to RabbitMQ (Ticket Service)...');
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Set prefetch for better load balancing
    await channel.prefetch(1);
    
    console.log('✅ Connected to RabbitMQ (Ticket Service)');

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err.message);
      if (channel) {
        try {
          channel.close();
        } catch (e) {
          // Ignore
        }
      }
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed. Reconnecting in 5 seconds...');
      if (channel) {
        try {
          channel.close();
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
    channel.on('error', (err) => {
      console.error('❌ RabbitMQ channel error:', err.message);
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
    reconnectTimeout = setTimeout(() => {
      connectRabbitMQ();
    }, 5000);
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

export const closeConnection = async () => {
  try {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (channel) {
      await channel.close();
      channel = null;
    }
    
    if (connection) {
      await connection.close();
      connection = null;
    }
    
    console.log('✅ RabbitMQ connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing RabbitMQ connection:', error.message);
  }
};
