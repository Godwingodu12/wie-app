import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import * as followService from '../services/follow.service';

const router = express.Router();

// Follow a user
router.post('/:targetUserId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    const result = await followService.followUser(followerId, followingId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Follow error:', error);
    res.status(400).json({ message: error.message || 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/:targetUserId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    const result = await followService.unfollowUser(followerId, followingId);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Unfollow error:', error);
    res.status(400).json({ message: error.message || 'Failed to unfollow user' });
  }
});

// Get user's followers
router.get('/:userId/followers', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await followService.getFollowers(userId, page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Failed to fetch followers' });
  }
});

// Get user's following
router.get('/:userId/following', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await followService.getFollowing(userId, page, limit);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Failed to fetch following' });
  }
});

// Check if following
router.get('/:targetUserId/is-following', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const followerId = req.userId!;
    const followingId = req.params.targetUserId;

    const isFollowing = await followService.isFollowing(followerId, followingId);
    res.status(200).json({ isFollowing });
  } catch (error: any) {
    console.error('Check following error:', error);
    res.status(500).json({ message: 'Failed to check follow status' });
  }
});

// Get follow stats
router.get('/:userId/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.userId;
    const stats = await followService.getFollowStats(userId);
    res.status(200).json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

export default router;