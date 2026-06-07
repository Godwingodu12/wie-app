import * as blockService from '../services/block.service.js';
import { invalidatePermissionCache } from '../services/permission.service.js';
import WieChat from '../models/wiechat.model.js';
import { getIO } from '../socket/wieSocket.js';
export const blockUser = async (req, res) => {
  try {
    const blockerId = req.user._id || req.user.id;
    const { userId: blockedId } = req.body;

    if (!blockedId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await blockService.blockUser(blockerId.toString(), blockedId);

    // Invalidate permission cache
    invalidatePermissionCache(blockerId.toString(), blockedId);

    // ❌ REMOVED: Don't hide chat for blocked user anymore
    // We want them to see the chat but just can't message

    // Get all chats between these users
    const chats = await WieChat.find({
      participants: { $all: [blockerId.toString(), blockedId] }
    }).select('_id').lean();

    const chatIds = chats.map(c => c._id.toString());

    // Emit real-time block events
    try {
      const io = getIO();
      
      // Notify blocked user (User B) - they can still see chat but can't message
      io.to(blockedId).emit('user-blocked-you', {
        blockerId: blockerId.toString(),
        blockerName: req.user.name, // Optional: for UI display
        chatIds: chatIds,
        timestamp: new Date().toISOString()
      });

      // Notify blocker (User A) - they blocked someone
      io.to(blockerId.toString()).emit('you-blocked-user', {
        blockedId: blockedId,
        chatIds: chatIds,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.error('Socket emit failed:', socketError);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Block user error:', error);
    
    if (error.message === 'User is already blocked') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to block user'
    });
  }
};
export const unblockUser = async (req, res) => {
  try {
    const blockerId = req.user._id || req.user.id;
    const { userId: blockedId } = req.params;

    if (!blockedId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await blockService.unblockUser(blockerId.toString(), blockedId);

    // Invalidate permission cache
    invalidatePermissionCache(blockerId.toString(), blockedId);

    // Restore chat visibility for blocked user
    await WieChat.updateMany(
      {
        participants: { $all: [blockerId.toString(), blockedId] }
      },
      {
        $pull: { deletedFor: blockedId }
      }
    );

    // ✅ NEW: Get all chats between these users
    const chats = await WieChat.find({
      participants: { $all: [blockerId.toString(), blockedId] }
    }).select('_id').lean();

    const chatIds = chats.map(c => c._id.toString());

    // ✅ NEW: Emit real-time unblock event
    try {
      const io = getIO();
      
      // Notify unblocked user
      io.to(blockedId).emit('user-unblocked-you', {
        unblockerId: blockerId.toString(),
        chatIds: chatIds,
        timestamp: new Date().toISOString()
      });

      // Also emit to unblocker
      io.to(blockerId.toString()).emit('you-unblocked-user', {
        unblockedId: blockedId,
        chatIds: chatIds,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.error('Socket emit failed:', socketError);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Unblock user error:', error);
    
    if (error.message === 'User is not blocked') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to unblock user'
    });
  }
};
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await blockService.getBlockedUsers(userId.toString(), page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blocked users'
    });
  }
};
export const checkBlockStatus = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const { userId: otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if current user blocked the other user
    const iBlockedThem = await blockService.isBlockedByUser(currentUserId.toString(), otherUserId);
    
    // Check if the other user blocked current user
    const theyBlockedMe = await blockService.isBlockedByUser(otherUserId, currentUserId.toString());

    res.status(200).json({
      success: true,
      iBlockedThem,
      theyBlockedMe
    });
  } catch (error) {
    console.error('Check block status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check block status'
    });
  }
};
