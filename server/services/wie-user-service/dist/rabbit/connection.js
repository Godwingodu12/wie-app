import amqp from 'amqplib';
let connection = null;
let channel = null;
let isConnecting = false;
let reconnectTimeout = null;
export const connectRabbitMQ = async () => {
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
        connection.on('error', (err) => {
            console.error('❌ RabbitMQ connection error:', err.message);
            if (channel) {
                try {
                    channel.close().catch(() => { });
                }
                catch (e) {
                    // Ignore
                }
            }
            channel = null;
            connection = null;
        });
        connection.on('close', () => {
            if (channel) {
                try {
                    channel.close().catch(() => { });
                }
                catch (e) {
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
    }
    catch (err) {
        console.error('❌ RabbitMQ connection error:', err.message);
        channel = null;
        connection = null;
        // Retry connection after 5 seconds
        console.log('🔄 Retrying connection in 5 seconds...');
        reconnectTimeout = setTimeout(() => {
            connectRabbitMQ();
        }, 5000);
    }
    finally {
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
    }
    catch (error) {
        console.error('❌ Error closing RabbitMQ connection:', error.message);
    }
};
//# sourceMappingURL=connection.js.map