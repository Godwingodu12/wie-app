import { sendRPC, publishToQueue } from '../rabbit/producer';
import { isChannelAvailable }      from '../rabbit/connection';

export const createNotification = async (payload: {
  userId:     string;
  type:       string;
  title:      string;
  message:    string;
  fromUserId?: string;
  metadata?:  Record<string, any>;
  link?:      string;
}) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available. Skipping notification.');
    return { success: false, error: 'RabbitMQ not available' };
  }
  try {
    // Use publishToQueue for fire-and-forget — sendRPC times out if no consumer replies
    await publishToQueue('notification-create', payload);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating notification:', message);
    return { success: false, error: message };
  }
};

export const emitMentionEvent = async (payload: {
  mentionedUserId: string;
  mentionerUserId: string;
  fluxId:          string;
  fluxMediaUrl?:   string;
  timestamp?:      string;
}) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available. Skipping mention event.');
    return;
  }
  try {
    await publishToQueue('flux.mention.created', {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error emitting mention event:', error);
  }
};
