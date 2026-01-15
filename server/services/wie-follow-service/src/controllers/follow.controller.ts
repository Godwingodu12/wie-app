import { Response } from 'express';
import * as followService from '../services/follow.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    const result = await followService.followUser(followerId, followingId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Already following this user') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    if (error.message === 'Cannot follow yourself') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to follow user',
    });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    const result = await followService.unfollowUser(followerId, followingId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Not following this user') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    
    if (error.message === 'Invalid operation') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unfollow user',
    });
  }
};
export const acceptFollowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followingId = req.userId!; // Current user (who receives the request)
    const followerId = req.params.followerId; // User who sent the request

    const result = await followService.acceptFollowRequest(followingId, followerId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'No pending follow request found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept follow request',
    });
  }
};

export const rejectFollowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followingId = req.userId!;
    const followerId = req.params.followerId;

    const result = await followService.rejectFollowRequest(followingId, followerId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'No pending follow request found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject follow request',
    });
  }
};

export const getFollowRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await followService.getFollowRequests(userId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow requests',
      error: error.message
    });
  }
};

export const cancelFollowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    const result = await followService.cancelFollowRequest(followerId, followingId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'No pending follow request found') {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel follow request',
    });
  }
};

export const getDetailedFollowStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    if (!followingId) {
      res.status(400).json({ success: false, message: 'Target user ID is required' });
      return;
    }

    const result = await followService.getFollowStatus(followerId, followingId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check follow status',
      error: error.message
    });
  }
};
export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getFollowers(userId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers',
      error: error.message
    });
  }
};
export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getFollowing(userId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch following',
      error: error.message
    });
  }
};
export const getOtherFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const targetUserId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getOtherFollowers(currentUserId, targetUserId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch followers',
      error: error.message
    });
  }
};
export const getOtherFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const targetUserId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getOtherFollowing(currentUserId, targetUserId, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch following',
      error: error.message
    });
  }
};
export const checkFollowStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const targetUserId = req.params.targetUserId;

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'Target user ID is required' });
      return;
    }

    if (currentUserId === targetUserId) {
      res.status(200).json({
        success: true,
        isFollowing: false,
        isSelf: true,
        message: 'Cannot follow yourself'
      });
      return;
    }

    const isFollowing = await followService.isFollowing(currentUserId, targetUserId);

    res.status(200).json({
      success: true,
      isFollowing,
      isSelf: false
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check follow status',
      error: error.message
    });
  }
};

export const getFollowStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getFollowStats(userId);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch follow statistics',
      error: error.message
    });
  }
};

export const checkIsFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    if (!followingId) {
      res.status(400).json({ success: false, message: 'Target user ID is required' });
      return;
    }

    const result = await followService.isFollowing(followerId, followingId);
    res.status(200).json({ success: true, isFollowing: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check following status',
      error: error.message
    });
  }
};
