import { getChannel, isChannelAvailable } from './connection';
export const listenQueue = async (queueName, handler) => {
    if (!isChannelAvailable()) {
        console.warn(`⚠️ RabbitMQ channel not available, skipping queue: ${queueName}`);
        return;
    }
    try {
        const channel = getChannel();
        await channel.assertQueue(queueName, { durable: true });
        await channel.prefetch(1);
        channel.consume(queueName, async (msg) => {
            if (!msg)
                return;
            try {
                const content = JSON.parse(msg.content.toString());
                const response = await handler(content);
                if (msg.properties.replyTo) {
                    channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(response)), {
                        correlationId: msg.properties.correlationId,
                    });
                }
                channel.ack(msg);
            }
            catch (error) {
                console.error(`❌ Error processing message from ${queueName}:`, error);
                channel.nack(msg, false, false);
            }
        }, { noAck: false });
    }
    catch (error) {
        console.error(`❌ Error setting up listener for ${queueName}:`, error);
    }
};
//# sourceMappingURL=consumer.js.map