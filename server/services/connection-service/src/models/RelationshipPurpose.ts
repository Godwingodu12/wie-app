import mongoose, { Schema, Document } from 'mongoose';

export interface IRelationshipPurpose extends Document {
  connectionProfileId: mongoose.Types.ObjectId;
  userId: string; // FIXED: lowercase string
  relationshipType: 'long-term' | 'fling' | 'deluluship' | 'friends-with-benefits';
  hadRelationshipBefore: boolean;
  previousRelationship?: {
    duration: string;
    endedAgo: string;
    currentStage: string;
  };
  lookingFor: {
    gender: string;
    ageRange: {
      min: number;
      max: number;
    };
    distanceRange: number;
  };
  importantQualities: string[];
  dealBreakers?: string[];
  customNote?: string;
  status: 'active' | 'paused' | 'deleted';
}

const RelationshipPurposeSchema = new Schema<IRelationshipPurpose>(
  {
    connectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
    },
    userId: {
      type: String, // FIXED: String (not Schema.Types.ObjectId)
      required: true,
    },
    relationshipType: {
      type: String,
      enum: ['long-term', 'fling', 'deluluship', 'friends-with-benefits'],
      required: true,
    },
    hadRelationshipBefore: {
      type: Boolean,
      required: true,
    },
    previousRelationship: {
      duration: String,
      endedAgo: String,
      currentStage: {
        type: String,
        enum: ['depression', 'sad', 'neutral', 'healed'],
      },
    },
    lookingFor: {
      gender: {
        type: String,
        enum: ['male', 'female', 'transgender', 'any'],
        required: true,
      },
      ageRange: {
        min: Number,
        max: Number,
      },
      distanceRange: Number,
    },
    importantQualities: [String],
    dealBreakers: [String],
    customNote: String,
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Define indexes here
RelationshipPurposeSchema.index({ connectionProfileId: 1 });
RelationshipPurposeSchema.index({ userId: 1 });
RelationshipPurposeSchema.index({ status: 1 });

export const RelationshipPurpose = mongoose.model<IRelationshipPurpose>(
  'RelationshipPurpose',
  RelationshipPurposeSchema
);