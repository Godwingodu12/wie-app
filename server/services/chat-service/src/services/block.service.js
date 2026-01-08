import Block from '../models/block.model.js';
import { unfollowUserViaGrpc } from '../grpc/followClient.js';

export const blockUser = async (blockerId, blockedId) => {
  if (blockerId === blockedId) {
    throw new Error('Cannot block yourself');
  }

  const existing = await Block.findOne({ blockerId, blockedId });
  if (existing) {
    throw new Error('User is already blocked');
  }

  // Create block
  await Block.create({ blockerId, blockedId });

  // Unfollow both ways via gRPC
  try {
    await Promise.allSettled([
      unfollowUserViaGrpc(blockerId, blockedId),
      unfollowUserViaGrpc(blockedId, blockerId)
    ]);
  } catch (error) {
    console.error('Failed to unfollow during block:', error);
  }
  return { success: true, message: 'User blocked successfully' };
};
export const isBlockedByUser = async (blockerId, blockedId) => {
  const block = await Block.findOne({
    blockerId: blockerId,
    blockedId: blockedId
  });
  
  return !!block;
};
export const unblockUser = async (blockerId, blockedId) => {
  const result = await Block.findOneAndDelete({ blockerId, blockedId });
  
  if (!result) {
    throw new Error('User is not blocked');
  }
  return { success: true, message: 'User unblocked successfully' };
};

export const getBlockedUsers = async (userId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const [blocks, total] = await Promise.all([
    Block.find({ blockerId: userId })
      .select('blockedId createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Block.countDocuments({ blockerId: userId })
  ]);

  return {
    blockedUsers: blocks.map(b => ({
      userId: b.blockedId,
      blockedAt: b.createdAt
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};
export const isBlocked = async (userId1, userId2) => {
  const block = await Block.findOne({
    $or: [
      { blockerId: userId1, blockedId: userId2 },
      { blockerId: userId2, blockedId: userId1 }
    ]
  });
  
  return !!block;
};
