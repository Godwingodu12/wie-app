import mongoose, { Schema, Document } from 'mongoose';

export interface ITravelPurpose extends Document {
  connectionProfileId: mongoose.Types.ObjectId;
  userId: string; // FIXED: lowercase string
  hasSpecificDestination: boolean;
  destinations: Array<{
    location: string;
    city: string;
    region: string;
    country: string;
    coordinates: {
      type: string;
      coordinates: [number, number];
    };
    dateOfVisit?: Date;
    dateRange?: {
      from: Date;
      to: Date;
    };
    isFlexible: boolean;
  }>;
  bucketListPlaces?: string;
  additionalNotes?: string;
  companionType: 'group' | 'single-person' | 'two-person';
  groupPreference?: 'boys-only' | 'girls-only' | 'mixed' | 'any';
  genderPreference?: 'male' | 'female' | 'transgender' | 'any';
  groupSize?: {
    min: number;
    max: number;
  };
  travelStyles: string[];
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  expiresAt?: Date;
}

const TravelPurposeSchema = new Schema<ITravelPurpose>(
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
    hasSpecificDestination: {
      type: Boolean,
      required: true,
    },
    destinations: [
      {
        location: String,
        city: String,
        region: String,
        country: String,
        coordinates: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: {
            type: [Number],
          },
        },
        dateOfVisit: Date,
        dateRange: {
          from: Date,
          to: Date,
        },
        isFlexible: { type: Boolean, default: false },
      },
    ],
    bucketListPlaces: String,
    additionalNotes: String,
    companionType: {
      type: String,
      enum: ['group', 'single-person', 'two-person'],
      required: true,
    },
    groupPreference: {
      type: String,
      enum: ['boys-only', 'girls-only', 'mixed', 'any'],
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'transgender', 'any'],
    },
    groupSize: {
      min: Number,
      max: Number,
    },
    travelStyles: [String],
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

// Define indexes ONLY here
TravelPurposeSchema.index({ connectionProfileId: 1 });
TravelPurposeSchema.index({ userId: 1 });
TravelPurposeSchema.index({ 'destinations.coordinates': '2dsphere' });
TravelPurposeSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model<ITravelPurpose>('TravelPurpose', TravelPurposeSchema);