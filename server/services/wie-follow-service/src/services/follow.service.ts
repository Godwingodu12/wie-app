import Follow from '../models/follow.model';
import * as userClient from '../grpc/userClient';

export const followUser = async (followerId: string, followingId: string) => {
  // Prevent self-follow
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Check if already following
  const existing = await Follow.findOne({ followerId, followingId });
  if (existing) {
    if (existing.status === 'active') {
      throw new Error('Already following this user');
    }
    // Reactivate if previously blocked
    existing.status = 'active';
    await existing.save();
  } else {
    // Create new follow
    await Follow.create({ followerId, followingId, status: 'active' });
  }

  // Update counts in user service (async, non-blocking)
  Promise.all([
    userClient.incrementFollowing(followerId),
    userClient.incrementFollowers(followingId)
  ]).catch(err => {
    console.error('⚠️  Failed to update user counts:', err);
  });

  return { success: true, message: 'User followed successfully' };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const follow = await Follow.findOneAndDelete({ followerId, followingId });
  
  if (!follow) {
    throw new Error('Not following this user');
  }

  // Update counts in user service (async, non-blocking)
  Promise.all([
    userClient.decrementFollowing(followerId),
    userClient.decrementFollowers(followingId)
  ]).catch(err => {
    console.error('⚠️  Failed to update user counts:', err);
  });

  return { success: true, message: 'User unfollowed successfully' };
};

export const getFollowers = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [followers, total] = await Promise.all([
    Follow.find({ followingId: userId, status: 'active' })
      .select('followerId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Follow.countDocuments({ followingId: userId, status: 'active' })
  ]);

  return {
    followers: followers.map(f => ({
      userId: f.followerId,
      followedAt: f.createdAt
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getFollowing = async (userId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [following, total] = await Promise.all([
    Follow.find({ followerId: userId, status: 'active' })
      .select('followingId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Follow.countDocuments({ followerId: userId, status: 'active' })
  ]);

  return {
    following: following.map(f => ({
      userId: f.followingId,
      followedAt: f.createdAt
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const follow = await Follow.findOne({ followerId, followingId, status: 'active' });
  return !!follow;
};

export const getFollowStats = async (userId: string) => {
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ followingId: userId, status: 'active' }),
    Follow.countDocuments({ followerId: userId, status: 'active' })
  ]);

  return {
    followers: followersCount,
    following: followingCount
  };
};