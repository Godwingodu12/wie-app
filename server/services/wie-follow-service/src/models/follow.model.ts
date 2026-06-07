import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow extends Document {
  followerId: string;
  followingId: string;
  status: 'active' | 'blocked'| 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: { 
      type: String, 
      required: true,
      index: true 
    },
    followingId: { 
      type: String, 
      required: true,
      index: true 
    },
    status: { 
      type: String, 
      enum: ['active', 'blocked', 'pending'], 
      default: 'active' 
    },
  },
  { 
    timestamps: true,
    collection: 'follows'
  }
);
// Compound unique index to prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followerId: 1, status: 1 });
FollowSchema.index({ followingId: 1, status: 1 });
export default mongoose.model<IFollow>('Follow', FollowSchema);
