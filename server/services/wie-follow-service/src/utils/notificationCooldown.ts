import redisClient from '../config/redis';

// Cooldown period: 24 hours in seconds
const NOTIFICATION_COOLDOWN_SECONDS = 24 * 60 * 60; // 86400 seconds

/**
 * Generate a unique key for notification tracking
 */
const getNotificationKey = (fromUserId: string, toUserId: string, type: string): string => {
  return `notification:cooldown:${type}:${fromUserId}:${toUserId}`;
};

/**
 * Check if enough time has passed since last notification
 * Returns true if notification can be sent
 */
export const canSendNotification = async (
  fromUserId: string, 
  toUserId: string, 
  type: 'follow' | 'follow_request' | 'follow_accepted'
): Promise<boolean> => {
  try {
    const key = getNotificationKey(fromUserId, toUserId, type);
    
    // Check if key exists in Redis
    const exists = await redisClient.exists(key);
    
    if (!exists) {
      return true; // No cooldown active, can send notification
    }
    
    // Check remaining TTL
    const ttl = await redisClient.ttl(key);
    
    if (ttl <= 0) {
      return true; // Key expired or doesn't exist
    }
    
    return false; // Cooldown still active
  } catch (error) {
    console.error('Error checking notification cooldown:', error);
    // On error, allow notification to prevent blocking
    return true;
  }
};

/**
 * Update the notification timestamp (set cooldown)
 */
export const setNotificationCooldown = async (
  fromUserId: string, 
  toUserId: string, 
  type: 'follow' | 'follow_request' | 'follow_accepted'
): Promise<boolean> => {
  try {
    const key = getNotificationKey(fromUserId, toUserId, type);
    const timestamp = Date.now().toString();
    
    // Set key with 24-hour expiration
    const success = await redisClient.set(key, timestamp, NOTIFICATION_COOLDOWN_SECONDS);
    
    if (success) {
      console.log(`Notification cooldown set for ${type}: ${fromUserId} -> ${toUserId} (24h)`);
    }
    
    return success;
  } catch (error) {
    console.error('Error setting notification cooldown:', error);
    return false;
  }
};

/**
 * Clear notification cooldown (useful for testing or admin actions)
 */
export const clearNotificationCooldown = async (
  fromUserId: string, 
  toUserId: string, 
  type: 'follow' | 'follow_request' | 'follow_accepted'
): Promise<boolean> => {
  try {
    const key = getNotificationKey(fromUserId, toUserId, type);
    return await redisClient.del(key);
  } catch (error) {
    console.error('Error clearing notification cooldown:', error);
    return false;
  }
};

/**
 * Get remaining cooldown time in seconds
 */
export const getRemainingCooldown = async (
  fromUserId: string, 
  toUserId: string, 
  type: 'follow' | 'follow_request' | 'follow_accepted'
): Promise<number> => {
  try {
    const key = getNotificationKey(fromUserId, toUserId, type);
    const ttl = await redisClient.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    console.error('Error getting remaining cooldown:', error);
    return 0;
  }
};
