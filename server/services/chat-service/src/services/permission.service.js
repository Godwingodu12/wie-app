import Block from '../models/block.model.js';
import { getRelationship } from '../grpc/followClient.js';
import { getUserPrivacySettings } from '../grpc/wieUserClient.js';

const permissionCache = new Map();
const PERMISSION_CACHE_TTL = process.env.PERMISSION_CACHE_TTL || 300000; // 5 minutes

export const determineChatPermission = async (senderId, receiverId) => {
  const cacheKey = `permission:${senderId}:${receiverId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < PERMISSION_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Ensure IDs are strings
    const senderIdStr = senderId.toString();
    const receiverIdStr = receiverId.toString();

    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: senderIdStr, blockedId: receiverIdStr },
        { blockerId: receiverIdStr, blockedId: senderIdStr }
      ]
    });

    if (isBlocked) {
      return { permission: 'blocked', reason: 'User is blocked' };
    }

    const [receiverSettings, relationship] = await Promise.all([
      getUserPrivacySettings(receiverIdStr).catch(() => ({
        allow_messages_from: 'followers',
        allow_message_requests: true
      })),
      getRelationship(senderIdStr, receiverIdStr).catch(() => ({
        follows: false,
        followedBy: false,
        isMutual: false
      }))
    ]);

    const allowMessagesFrom = receiverSettings.allow_messages_from || 
                             receiverSettings.allowMessagesFrom || 
                             'followers';
    const allowMessageRequests = receiverSettings.allow_message_requests !== false;

    if (allowMessagesFrom === 'none') {
      return { permission: 'blocked', reason: 'User has disabled messages' };
    }

    const isMutual = relationship.follows && relationship.followedBy;

    let result;

    switch (allowMessagesFrom) {
      case 'everyone':
        result = { permission: 'direct', reason: 'User accepts messages from everyone' };
        break;

      case 'followers':
        if (relationship.followedBy) {
          result = { permission: 'direct', reason: 'You are a follower' };
        } else {
          result = allowMessageRequests
            ? { permission: 'request', reason: 'Message request required' }
            : { permission: 'blocked', reason: 'User only accepts messages from followers' };
        }
        break;

      case 'mutuals':
        if (isMutual) {
          result = { permission: 'direct', reason: 'Mutual followers' };
        } else {
          result = allowMessageRequests
            ? { permission: 'request', reason: 'Message request required' }
            : { permission: 'blocked', reason: 'User only accepts messages from mutuals' };
        }
        break;

      default:
        result = { permission: 'direct', reason: 'Default permission' };
    }

    permissionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;

  } catch (error) {
    console.error('❌ Permission check error:', error);
    return { permission: 'direct', reason: 'Error checking permissions - allowing' };
  }
};

export const invalidatePermissionCache = (senderId, receiverId) => {
  permissionCache.delete(`permission:${senderId}:${receiverId}`);
  permissionCache.delete(`permission:${receiverId}:${senderId}`);
};

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of permissionCache.entries()) {
    if (now - value.timestamp > PERMISSION_CACHE_TTL) {
      permissionCache.delete(key);
    }
  }
}, PERMISSION_CACHE_TTL);