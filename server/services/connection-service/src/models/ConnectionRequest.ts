import mongoose, { Schema, Document } from 'mongoose';

export interface IConnectionRequest extends Document {
  fromUserId: String;
  fromConnectionProfileId: String;
  toUserId: String;
  toConnectionProfileId: String;
  purposeCode: string;
  purposeDataId: String;
  purposeDataCollection: string;
  message?: string;
  attachments?: string[];
  matchScore: number;
  matchBreakdown: {
    mutuals: number;
    location: number;
    interests: number;
    personality: number;
  };
  matchReasons: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  respondedAt?: Date;
  responseMessage?: string;
  rejectionReason?: string;
  expiresAt: Date;
  viewedAt?: Date;
  connectionEstablishedAt?: Date;
  conversationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionRequestSchema = new Schema<IConnectionRequest>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      required: true,
      // REMOVED: index: true
    },
    fromConnectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      required: true,
      // REMOVED: index: true
    },
    toConnectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
    },
    purposeCode: {
      type: String,
      required: true,
      // REMOVED: index: true
      enum: [
        'TRAVEL',
        'RELATIONSHIP',
        'LOCATION',
        'PROFESSIONAL',
        'CONCERT',
        'SKILL',
        'DAY_OUTING',
        'MENTAL_SUPPORT',
        'SOCIAL_SERVICE',
        'TECHNICIAN',
        'EXTROVERT',
        'CUSTOM',
      ],
    },
    purposeDataId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    purposeDataCollection: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      maxlength: 500,
    },
    attachments: [String],
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchBreakdown: {
      mutuals: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      interests: { type: Number, default: 0 },
      personality: { type: Number, default: 0 },
    },
    matchReasons: [String],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      default: 'pending',
      // REMOVED: index: true
    },
    respondedAt: Date,
    responseMessage: String,
    rejectionReason: String,
    expiresAt: {
      type: Date,
      required: true,
      // REMOVED: index: true
    },
    viewedAt: Date,
    connectionEstablishedAt: Date,
    conversationId: Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);
// Define all indexes here (compound and single)
ConnectionRequestSchema.index({ fromUserId: 1, status: 1 });
ConnectionRequestSchema.index({ toUserId: 1, status: 1 });
ConnectionRequestSchema.index({ purposeCode: 1, status: 1 });
ConnectionRequestSchema.index({ createdAt: -1 });
ConnectionRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Prevent duplicate pending requests
ConnectionRequestSchema.index(
  { fromUserId: 1, toUserId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);
export default mongoose.model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema);