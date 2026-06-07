import { Response } from 'express';
import * as followService from '../services/follow.service';
import { AuthRequest } from '../middleware/auth.middleware';
import * as userClient from '../grpc/userClient';
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    if (!followingId) {
      res.status(400).json({ 
        success: false, 
        message: 'Target user ID is required' 
      });
      return;
    }

    const result = await followService.followUser(followerId, followingId);
    
    res.status(200).json({
      success: true,
      message: result.message,
      status: result.status,
      requestStatus: result.requestStatus,
      isPrivateAccount: result.isPrivateAccount,
      data: {
        followerId: result.followerId,
        followingId: result.followingId
      }
    });
  } catch (error: any) {
    console.error('Follow user error:', error);

    if (error.message === 'Already following this user') {
      res.status(400).json({ 
        success: false, 
        message: error.message,
        code: 'ALREADY_FOLLOWING'
      });
      return;
    }
    
    if (error.message === 'Follow request already sent') {
      res.status(400).json({ 
        success: false, 
        message: error.message,
        code: 'REQUEST_ALREADY_SENT'
      });
      return;
    }
    
    if (error.message === 'Cannot follow yourself') {
      res.status(400).json({ 
        success: false, 
        message: error.message,
        code: 'CANNOT_FOLLOW_SELF'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to follow user',
      code: 'INTERNAL_ERROR'
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
    const currentUserId = req.userId!; 
    const requesterId = req.params.followerId;
    const result = await followService.acceptFollowRequest(currentUserId, requesterId);
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
    const viewerId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getFollowers(userId, page, limit, viewerId);
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
    const viewerId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getFollowing(userId, page, limit, viewerId);
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
      res.status(400).json({ 
        success: false, 
        message: 'Target user ID is required' 
      });
      return;
    }

    if (currentUserId === targetUserId) {
      res.status(200).json({
        success: true,
        isFollowing: false,
        isPending: false,
        requestStatus: 'none',
        isSelf: true,
        message: 'Cannot follow yourself'
      });
      return;
    }

    const status = await followService.getFollowStatus(currentUserId, targetUserId);
    
    // Also fetch target user's privacy status
    let isPrivate = false;
    try {
      const privacy = await userClient.getAccountPrivacy(targetUserId);
      isPrivate = privacy === 'private';
    } catch (e) {
      console.warn('Failed to fetch user privacy in checkFollowStatus:', e);
    }

    res.status(200).json({
      success: true,
      isFollowing: status.isFollowing,
      isPending: status.isPending,
      requestStatus: status.requestStatus,
      status: status.status, // 'active', 'pending', or 'none'
      isPrivate,
      isSelf: false
    });
  } catch (error: any) {
    console.error('Check follow status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check follow status',
      error: error.message
    });
  }
};
export const checkFollowRequestStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!; // User checking the status
    const fromUserId = req.params.fromUserId; // User who sent the request

    if (!fromUserId) {
      res.status(400).json({ success: false, message: 'From user ID is required' });
      return;
    }

    const result = await followService.checkFollowRequestStatus(currentUserId, fromUserId);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check follow request status',
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
export const checkIsFollowedBy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const targetUserId  = req.params.targetUserId;

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'Target user ID is required' });
      return;
    }

    const result = await followService.isFollowing(targetUserId, currentUserId);
    res.status(200).json({ success: true, isFollowedBy: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check followed-by status',
      error: error.message,
    });
  }
};
export const getSentFollowRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const result = await followService.getSentFollowRequests(userId);
    res.status(200).json({ success: true, sentRequests: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent follow requests',
      error: error.message
    });
  }
};
export const autoAcceptPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const result = await followService.autoAcceptPendingRequests(userId);
    res.status(200).json({
      success: true,
      message: result.message,
      acceptedCount: result.acceptedCount
    });
  } catch (error: any) {
    console.error('Auto-accept pending requests error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to auto-accept pending requests',
      code: 'INTERNAL_ERROR'
    });
  }
};
