import Follow from '../models/follow.model';
import * as userClient from '../grpc/userClient';
import { createNotification, emitFollowEvent } from '../utils/notificationHelper';

export const followUser = async (followerId: string, followingId: string): Promise<any> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  const existing = await Follow.findOne({ followerId, followingId });
  
  if (existing) {
    if (existing.status === 'active') {
      throw new Error('Already following this user');
    }
    existing.status = 'active';
    await existing.save();
  } else {
    await Follow.create({ followerId, followingId, status: 'active' });
  }

  // Update counts
  Promise.all([
    userClient.incrementFollowing(followerId),
    userClient.incrementFollowers(followingId)
  ]).catch(err => {
    console.error('Failed to update user counts:', err);
  });

  // Emit follow event for batching/analytics
  emitFollowEvent({
    followerId,
    followingId,
    timestamp: new Date().toISOString()
  }).catch(err => {
    console.error('Failed to emit follow event:', err);
  });

  // Create notification for the followed user (grouping handled by notification service)
  createFollowNotification(followerId, followingId).catch(err => {
    console.error('Failed to create follow notification:', err);
  });

  return {
    success: true,
    message: 'User followed successfully',
    followerId,
    followingId
  };
};

/**
 * Create a follow notification with grouping support
 */
const createFollowNotification = async (followerId: string, followingId: string) => {
  try {
    // Get follower details
    const followerDetails = await userClient.getUsersByIds([followerId]);
    const follower = followerDetails[0];

    if (!follower) {
      console.warn('Follower details not found');
      return;
    }

    // Check if they're mutual followers
    const isMutual = await Follow.findOne({
      followerId: followingId,
      followingId: followerId,
      status: 'active'
    });

    // Get follower's follower count for priority (using Follow model directly)
    const followerCount = await Follow.countDocuments({ 
      followingId: followerId, 
      status: 'active' 
    });

    await createNotification({
      userId: followingId,
      type: 'following',
      title: 'New Follower',
      message: `${follower.username || follower.name} started following you`,
      fromUserId: followerId,
      metadata: {
        followerId: followerId,
        followerName: follower.name,
        followerUsername: follower.username,
        followerProfilePicture: follower.profile_picture,
        isVerified: follower.is_verified || false,
        isMutual: !!isMutual,
        followerCount: followerCount,
        timestamp: new Date().toISOString()
      },
      link: `/profile/${follower.username || followerId}`
    });
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<any> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  if (followerId === followingId) {
    throw new Error('Invalid operation');
  }

  const follow = await Follow.findOneAndDelete({ 
    followerId, 
    followingId,
    status: 'active'
  });
  
  if (!follow) {
    throw new Error('Not following this user');
  }

  Promise.all([
    userClient.decrementFollowing(followerId),
    userClient.decrementFollowers(followingId)
  ]).catch(err => {
    console.error('Failed to update user counts:', err);
  });

  return {
    success: true,
    message: 'User unfollowed successfully',
    followerId,
    followingId
  };
};

export const getFollowers = async (userId: string, page: number = 1, limit: number = 20): Promise<any> => {
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

  const followerIds = followers.map(f => f.followerId);
  let userDetails: any[] = [];

  try {
    userDetails = await userClient.getUsersByIds(followerIds);
  } catch (error) {
    console.error('Failed to fetch user details:', error);
  }
  
  const formattedFollowers = followers.map(f => {
    const userDetail = userDetails.find(u => u.id === f.followerId);
    return {
      id: f.followerId, 
      followedAt: f.createdAt.toISOString(),
      name: userDetail?.name || null,
      username: userDetail?.username || null,
      profile_picture: userDetail?.profile_picture || null,
      bio: userDetail?.bio || null,
      is_verified: userDetail?.is_verified || false,
    };
  });

  return {
    followers: formattedFollowers,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getFollowing = async (userId: string, page: number = 1, limit: number = 20): Promise<any> => {
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

  const followingIds = following.map(f => f.followingId);
  let userDetails: any[] = [];

  try {
    userDetails = await userClient.getUsersByIds(followingIds);
  } catch (error) {
    console.error('Failed to fetch user details:', error);
  }
  
  const formattedFollowing = following.map(f => {
    const userDetail = userDetails.find(u => u.id === f.followingId);
    return {
      id: f.followingId, 
      followedAt: f.createdAt.toISOString(),
      name: userDetail?.name || null,
      username: userDetail?.username || null,
      profile_picture: userDetail?.profile_picture || null,
      bio: userDetail?.bio || null,
      is_verified: userDetail?.is_verified || false,
    };
  });
  
  return {
    following: formattedFollowing,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getOtherFollowers = async (
  currentUserId: string, 
  targetUserId: string, 
  page: number = 1, 
  limit: number = 20
): Promise<any> => {
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    Follow.find({ followingId: targetUserId, status: 'active' })
      .select('followerId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Follow.countDocuments({ followingId: targetUserId, status: 'active' })
  ]);

  const followerIds = followers.map(f => f.followerId);
  let userDetails: any[] = [];

  try {
    userDetails = await userClient.getUsersByIds(followerIds);
  } catch (error) {
    console.error('Failed to fetch user details:', error);
  }

  // Check if current user is following each follower
  const followStatuses = await Promise.all(
    followerIds.map(async (followerId) => {
      const isFollowing = await Follow.findOne({
        followerId: currentUserId,
        followingId: followerId,
        status: 'active'
      });
      return { followerId, isFollowing: !!isFollowing };
    })
  );

  const formattedFollowers = followers.map(f => {
    const userDetail = userDetails.find(u => u.id === f.followerId);
    const followStatus = followStatuses.find(s => s.followerId === f.followerId);
    
    return {
      id: f.followerId,
      followedAt: f.createdAt.toISOString(),
      name: userDetail?.name || null,
      username: userDetail?.username || null,
      profile_picture: userDetail?.profile_picture || null,
      bio: userDetail?.bio || null,
      is_verified: userDetail?.is_verified || false,
      isFollowing: followStatus?.isFollowing || false
    };
  });

  return {
    followers: formattedFollowers,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const getOtherFollowing = async (
  currentUserId: string,
  targetUserId: string,
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    Follow.find({ followerId: targetUserId, status: 'active' })
      .select('followingId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Follow.countDocuments({ followerId: targetUserId, status: 'active' })
  ]);

  const followingIds = following.map(f => f.followingId);
  let userDetails: any[] = [];

  try {
    userDetails = await userClient.getUsersByIds(followingIds);
  } catch (error) {
    console.error('Failed to fetch user details:', error);
  }

  // Check if current user is following each user
  const followStatuses = await Promise.all(
    followingIds.map(async (followingId) => {
      const isFollowing = await Follow.findOne({
        followerId: currentUserId,
        followingId: followingId,
        status: 'active'
      });
      return { followingId, isFollowing: !!isFollowing };
    })
  );

  const formattedFollowing = following.map(f => {
    const userDetail = userDetails.find(u => u.id === f.followingId);
    const followStatus = followStatuses.find(s => s.followingId === f.followingId);
    
    return {
      id: f.followingId,
      followedAt: f.createdAt.toISOString(),
      name: userDetail?.name || null,
      username: userDetail?.username || null,
      profile_picture: userDetail?.profile_picture || null,
      bio: userDetail?.bio || null,
      is_verified: userDetail?.is_verified || false,
      isFollowing: followStatus?.isFollowing || false
    };
  });

  return {
    following: formattedFollowing,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const follow = await Follow.findOne({ 
    followerId, 
    followingId, 
    status: 'active' 
  });
  return !!follow;
};

export const getFollowStats = async (userId: string): Promise<any> => {
  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ followingId: userId, status: 'active' }),
    Follow.countDocuments({ followerId: userId, status: 'active' })
  ]);

  return {
    userId,
    followers: followersCount,
    following: followingCount
  };
};
