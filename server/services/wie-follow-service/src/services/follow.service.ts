import Follow from '../models/follow.model';
import * as userClient from '../grpc/userClient';
import { createNotification, emitFollowEvent } from '../utils/notificationHelper';
import { canSendNotification, setNotificationCooldown } from '../utils/notificationCooldown';
export const followUser = async (
  followerId: string, 
  followingId: string
): Promise<{
  success: boolean;
  message: string;
  followerId: string;
  followingId: string;
  status: 'pending' | 'active';
  requestStatus: 'pending' | 'active';
  isPrivateAccount: boolean;
}> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Check if already following or has pending request
  const existing = await Follow.findOne({ followerId, followingId });
  
  if (existing) {
    if (existing.status === 'active') {
      throw new Error('Already following this user');
    }
    if (existing.status === 'pending') {
      throw new Error('Follow request already sent');
    }
  }

  // Check if target user has private account
  let isPrivateAccount = false;
  try {
    const targetAccountPrivacy = await userClient.getAccountPrivacy(followingId);
    isPrivateAccount = targetAccountPrivacy === 'private';
  } catch (error) {
    console.error('Failed to get account privacy, defaulting to public:', error);
    isPrivateAccount = false;
  }

  const followStatus: 'pending' | 'active' = isPrivateAccount ? 'pending' : 'active';

  // Create or update follow record
  if (existing) {
    // Reactivate or update existing record
    existing.status = followStatus;
    await existing.save();
  } else {
    // Create new follow/request
    await Follow.create({ 
      followerId, 
      followingId, 
      status: followStatus
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

    // ✅ CHANGE: Only create notification if cooldown allows
    createFollowNotification(followerId, followingId).catch(err => {
      console.error('Failed to create follow notification:', err);
    });
  } else {
    // ✅ CHANGE: Only create follow request notification if cooldown allows
    createFollowRequestNotification(followerId, followingId).catch(err => {
      console.error('Failed to create follow request notification:', err);
    });
  }
  return {
    success: true,
    message: isPrivateAccount ? 'Follow request sent' : 'User followed successfully',
    followerId,
    followingId,
    status: followStatus,
    requestStatus: followStatus,
    isPrivateAccount
  };
};
const createFollowNotification = async (followerId: string, followingId: string) => {
  try {
    // ✅ NEW: Check 24-hour cooldown before sending notification
    const canSend = await canSendNotification(followerId, followingId, 'follow');
    
    if (!canSend) {
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

    // ✅ NEW: Set 24-hour cooldown after successful notification
    await setNotificationCooldown(followerId, followingId, 'follow');
    console.log(`✅ Follow notification sent and 24h cooldown set: ${followerId} -> ${followingId}`);
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
};
const createFollowRequestNotification = async (followerId: string, followingId: string) => {
  try {
    // ✅ NEW: Check 24-hour cooldown before sending notification
    const canSend = await canSendNotification(followerId, followingId, 'follow_request');
    
    if (!canSend) {
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

    // ✅ NEW: Set 24-hour cooldown after successful notification
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
  followRequest.status = 'active';
  await followRequest.save();
  Promise.all([
    userClient.incrementFollowing(followerId),  
    userClient.incrementFollowers(followingId)  
  ]).catch(err => {
    console.error('Failed to update user counts:', err);
  });
  emitFollowEvent({
    followerId,
    followingId,
    timestamp: new Date().toISOString()
  }).catch(err => {
    console.error('Failed to emit follow event:', err);
  });

  return {
    success: true,
    message: 'Follow request accepted',
    followerId,
    followingId
  };
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
export const getSentFollowRequests = async (userId: string): Promise<any[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const sentRequests = await Follow.find({
    followerId: userId,
    status: 'pending'
  }).sort({ createdAt: -1 });

  if (sentRequests.length === 0) {
    return [];
  }

  const followingIds = sentRequests.map(req => req.followingId);
  const users = await userClient.getUsersByIds(followingIds);

  return sentRequests.map(req => {
    const user = users.find((u: any) => u.id === req.followingId);
    return {
      id: req.followingId,
      userId: req.followingId,
      name: user?.name || '',
      username: user?.username || '',
      profile_picture: user?.profile_picture || null,
      bio: user?.bio || '',
      is_verified: user?.is_verified || false,
      followedAt: req.createdAt.toISOString(),
      requestStatus: req.status
    };
  });
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
export const getFollowStatus = async (
  followerId: string, 
  followingId: string
): Promise<{
  isFollowing: boolean;
  isPending: boolean;
  requestStatus: 'pending' | 'active' | 'blocked' | 'none';
  status: string;
}> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }

  const follow = await Follow.findOne({ followerId, followingId });
  
  if (!follow) {
    return {
      isFollowing: false,
      isPending: false,
      requestStatus: 'none',
      status: 'none'
    };
  }

  return {
    isFollowing: follow.status === 'active',
    isPending: follow.status === 'pending',
    requestStatus: follow.status as 'pending' | 'active' | 'blocked' | 'none',
    status: follow.status
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

export const isFollowing = async (
  followerId: string, 
  followingId: string
): Promise<boolean> => {
  if (!followerId || !followingId) {
    throw new Error('Follower ID and Following ID are required');
  }
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
export const checkFollowRequestStatus = async (
  currentUserId: string, 
  fromUserId: string
): Promise<{
  hasRequest: boolean;
  requestStatus: 'pending' | 'active' | 'blocked' | 'none';
  isFollowingBack: boolean;
}> => {
  if (!fromUserId || !currentUserId) {
    throw new Error('User IDs are required');
  }
  const followRequest = await Follow.findOne({ 
    followerId: fromUserId,      // User who sent the request
    followingId: currentUserId   // Current user (received the request)
  });

  if (!followRequest) {
    return {
      hasRequest: false,
      requestStatus: 'none',
      isFollowingBack: false
    };
  }

  // Check if current user is following back
  const followBack = await Follow.findOne({
    followerId: currentUserId,  // Current user
    followingId: fromUserId,    // User who sent the request
    status: 'active'
  });

  return {
    hasRequest: true,
    requestStatus: followRequest.status,
    isFollowingBack: !!followBack
  };
};
export const autoAcceptPendingRequests = async (userId: string): Promise<{
  success: boolean;
  message: string;
  acceptedCount: number;
}> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  try {
    const pendingRequests = await Follow.find({
      followingId: userId,
      status: 'pending'
    });
    if (pendingRequests.length === 0) {
      return {
        success: true,
        message: 'No pending requests to accept',
        acceptedCount: 0
      };
    }
    const result = await Follow.updateMany(
      {
        followingId: userId,
        status: 'pending'
      },
      {
        $set: { status: 'active' }
      }
    );
    const followerIds = pendingRequests.map(req => req.followerId);
    // Update follower/following counts for all affected users
    Promise.all([
      ...followerIds.map(followerId => 
        userClient.incrementFollowing(followerId).catch(err => 
          console.error(`Failed to increment following for ${followerId}:`, err)
        )
      ),
      // Increment followers count for the user (userId) by the total count
      ...Array(followerIds.length).fill(null).map(() =>
        userClient.incrementFollowers(userId).catch(err => 
          console.error(`Failed to increment followers for ${userId}:`, err)
        )
      )
    ]).catch(err => {
      console.error('Error updating counts during auto-accept:', err);
    });

    // Emit follow events for analytics (but NO notifications)
    followerIds.forEach(followerId => {
      emitFollowEvent({
        followerId,
        followingId: userId,
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.error('Failed to emit follow event:', err);
      });
    });
    return {
      success: true,
      message: `Auto-accepted ${result.modifiedCount} follow requests`,
      acceptedCount: result.modifiedCount || 0
    };
  } catch (error) {
    console.error('Error auto-accepting pending requests:', error);
    throw error;
  }
};
