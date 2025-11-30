import mongoose from 'mongoose';

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Create compound unique index to prevent duplicate follow relationships
followSchema.index(
  { follower: 1, following: 1 },
  {
    unique: true,
    name: 'unique_follow_relationship',
    sparse: true
  }
);

// Index for finding all followers of a user
followSchema.index({ following: 1, status: 1 }, { name: 'idx_followers' });

// Index for finding all users someone is following
followSchema.index({ follower: 1, status: 1 }, { name: 'idx_following' });

// Index for sorting by creation date
followSchema.index({ createdAt: -1 }, { name: 'idx_recent_follows' });

const Follow = mongoose.model('Follow', followSchema);

export default Follow;