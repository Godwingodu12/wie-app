import * as blockService from '../services/block.service.js';
import { invalidatePermissionCache } from '../services/permission.service.js';
import WieChat from '../models/wiechat.model.js';

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

    // Delete all chats between these users
    await WieChat.deleteMany({
      participants: { $all: [blockerId.toString(), blockedId] }
    });

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
    const userId = req.user._id || req.user.id;
    const { targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required'
      });
    }

    const result = await blockService.checkBlockStatus(userId.toString(), targetUserId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Check block status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check block status'
    });
  }
};