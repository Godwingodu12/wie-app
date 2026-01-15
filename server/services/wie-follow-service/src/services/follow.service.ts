import Follow from '../models/follow.model';
import * as userClient from '../grpc/userClient';
import { createNotification, emitFollowEvent } from '../utils/notificationHelper';
import { canSendNotification, setNotificationCooldown } from '../utils/notificationCooldown';

export const followUser = async (followerId: string, followingId: string): Promise<any> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Check if target user has private account
  const targetAccountPrivacy = await userClient.getAccountPrivacy(followingId);
  const isPrivateAccount = targetAccountPrivacy === 'private';

  const existing = await Follow.findOne({ followerId, followingId });
  
  if (existing) {
    if (existing.status === 'active') {
      throw new Error('Already following this user');
    }
    if (existing.status === 'pending') {
      throw new Error('Follow request already sent');
    }
    
    // Reactivate blocked or update to pending
    existing.status = isPrivateAccount ? 'pending' : 'active';
    await existing.save();
  } else {
    // Create new follow/request
    await Follow.create({ 
      followerId, 
      followingId, 
      status: isPrivateAccount ? 'pending' : 'active' 
    });
  }

  // Only update counts if it's a public account (instant follow)
  if (!isPrivateAccount) {
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

    // Create notification for the followed user (with cooldown check)
    createFollowNotification(followerId, followingId).catch(err => {
      console.error('Failed to create follow notification:', err);
    });
  } else {
    // Create follow request notification for private accounts (with cooldown check)
    createFollowRequestNotification(followerId, followingId).catch(err => {
      console.error('Failed to create follow request notification:', err);
    });
  }
  
  return {
    success: true,
    message: isPrivateAccount ? 'Follow request sent' : 'User followed successfully',
    followerId,
    followingId,
    status: isPrivateAccount ? 'pending' : 'active',
    isPrivateAccount
  };
};

const createFollowNotification = async (followerId: string, followingId: string) => {
  try {
    // Check cooldown using Redis
    const canSend = await canSendNotification(followerId, followingId, 'follow');
    
    if (!canSend) {
      console.log(`Follow notification skipped due to cooldown: ${followerId} -> ${followingId}`);
      return;
    }

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

    // Get follower's follower count for priority
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

    // Set cooldown after successful notification
    await setNotificationCooldown(followerId, followingId, 'follow');
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
};

const createFollowRequestNotification = async (followerId: string, followingId: string) => {
  try {
    // Check cooldown using Redis
    const canSend = await canSendNotification(followerId, followingId, 'follow_request');
    
    if (!canSend) {
      console.log(`Follow request notification skipped due to cooldown: ${followerId} -> ${followingId}`);
      return;
    }

    const followerDetails = await userClient.getUsersByIds([followerId]);
    const follower = followerDetails[0];

    if (!follower) {
      console.warn('Follower details not found');
      return;
    }
    
    await createNotification({
      userId: followingId,
      type: 'follow_request',
      title: 'Follow Request',
      message: `${follower.username || follower.name} wants to follow you`,
      fromUserId: followerId,
      metadata: {
        followerId: followerId,
        followerName: follower.name,
        followerUsername: follower.username,
        followerProfilePicture: follower.profile_picture,
        isVerified: follower.is_verified || false,
        timestamp: new Date().toISOString()
      },
      link: `/profile/${follower.username || followerId}`,
    });

    // Set cooldown after successful notification
    await setNotificationCooldown(followerId, followingId, 'follow_request');
  } catch (error) {
    console.error('Error creating follow request notification:', error);
  }
};

export const acceptFollowRequest = async (followingId: string, followerId: string): Promise<any> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  const followRequest = await Follow.findOne({ 
    followerId, 
    followingId,
    status: 'pending'
  });
  
  if (!followRequest) {
    throw new Error('No pending follow request found');
  }

  // Update status to active
  followRequest.status = 'active';
  await followRequest.save();

  // Update counts
  Promise.all([
    userClient.incrementFollowing(followerId),
    userClient.incrementFollowers(followingId)
  ]).catch(err => {
    console.error('Failed to update user counts:', err);
  });

  // Emit follow event
  emitFollowEvent({
    followerId,
    followingId,
    timestamp: new Date().toISOString()
  }).catch(err => {
    console.error('Failed to emit follow event:', err);
  });
  
  // Create notification for the requester (with cooldown check)
  createFollowAcceptedNotification(followerId, followingId).catch(err => {
    console.error('Failed to create follow accepted notification:', err);
  });

  return {
    success: true,
    message: 'Follow request accepted',
    followerId,
    followingId
  };
};

const createFollowAcceptedNotification = async (followerId: string, followingId: string) => {
  try {
    // Check cooldown using Redis
    const canSend = await canSendNotification(followingId, followerId, 'follow_accepted');
    
    if (!canSend) {
      console.log(`Follow accepted notification skipped due to cooldown: ${followingId} -> ${followerId}`);
      return;
    }

    const userDetails = await userClient.getUsersByIds([followingId]);
    const user = userDetails[0];

    if (!user) {
      console.warn('User details not found');
      return;
    }

    await createNotification({
      userId: followerId,
      type: 'follow_accepted',
      title: 'Follow Request Accepted',
      message: `${user.username || user.name} accepted your follow request`,
      fromUserId: followingId,
      metadata: {
        userId: followingId,
        userName: user.name,
        userUsername: user.username,
        userProfilePicture: user.profile_picture,
        isVerified: user.is_verified || false,
        timestamp: new Date().toISOString()
      },
      link: `/profile/${user.username || followingId}`
    });
    // Set cooldown after successful notification
    await setNotificationCooldown(followingId, followerId, 'follow_accepted');
  } catch (error) {
    console.error('Error creating follow accepted notification:', error);
  }
};
export const rejectFollowRequest = async (followingId: string, followerId: string): Promise<any> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  const followRequest = await Follow.findOneAndDelete({ 
    followerId, 
    followingId,
    status: 'pending'
  });
  
  if (!followRequest) {
    throw new Error('No pending follow request found');
  }

  return {
    success: true,
    message: 'Follow request rejected',
    followerId,
    followingId
  };
};
export const getFollowRequests = async (userId: string, page: number = 1, limit: number = 20): Promise<any> => {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    Follow.find({ followingId: userId, status: 'pending' })
      .select('followerId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Follow.countDocuments({ followingId: userId, status: 'pending' })
  ]);

  const followerIds = requests.map(r => r.followerId);
  let userDetails: any[] = [];

  try {
    userDetails = await userClient.getUsersByIds(followerIds);
  } catch (error) {
    console.error('Failed to fetch user details:', error);
  }
  
  const formattedRequests = requests.map(r => {
    const userDetail = userDetails.find(u => u.id === r.followerId);
    return {
      id: r.followerId,
      requestedAt: r.createdAt.toISOString(),
      name: userDetail?.name || null,
      username: userDetail?.username || null,
      profile_picture: userDetail?.profile_picture || null,
      bio: userDetail?.bio || null,
      is_verified: userDetail?.is_verified || false,
    };
  });

  return {
    requests: formattedRequests,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};
export const cancelFollowRequest = async (followerId: string, followingId: string): Promise<any> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }
  const followRequest = await Follow.findOneAndDelete({ 
    followerId, 
    followingId,
    status: 'pending'
  });
  
  if (!followRequest) {
    throw new Error('No pending follow request found');
  }

  return {
    success: true,
    message: 'Follow request cancelled',
    followerId,
    followingId
  };
};
export const getFollowStatus = async (followerId: string, followingId: string): Promise<any> => {
  const follow = await Follow.findOne({ followerId, followingId });
  return {
    isFollowing: follow?.status === 'active',
    isPending: follow?.status === 'pending',
    status: follow?.status || 'none'
  };
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
