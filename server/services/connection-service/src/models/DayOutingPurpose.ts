import mongoose, { Schema, Document } from 'mongoose';

export interface IDayOutingPurpose extends Document {
  connectionProfileId: String;
  userId: String;
  outingType:
    | 'cafe-restaurant'
    | 'nature-walk-hiking'
    | 'shopping-market'
    | 'museum-gallery'
    | 'photography-walk'
    | 'cycling-biking'
    | 'beach-lake'
    | 'amusement-park'
    | 'heritage-tour'
    | 'food-tour'
    | 'theater-show'
    | 'sports-activity'
    | 'yoga-meditation'
    | 'creative-workshop'
    | 'custom';
  customOutingDescription?: string;
  outingDate: Date;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
  duration: 'quick-1-2hrs' | 'half-day' | 'full-day' | 'flexible';
  companionPreference: {
    type: 'solo-companion' | 'small-group' | 'large-group';
    genderPreference: 'male' | 'female' | 'mixed' | 'any';
    groupSize?: {
      min: number;
      max: number;
    };
  };
  outingStyle:
    | 'planner'
    | 'go-with-flow'
    | 'budget-conscious'
    | 'premium-experience'
    | 'content-creator'
    | 'social-fun'
    | 'chill-relax';
  logistics: {
    transportation: 'own-vehicle' | 'need-ride' | 'public-transport' | 'meet-location' | 'flexible';
    costSplitting: 'dutch' | 'split-equally' | 'rotating-treat' | 'flexible';
    foodPreferences: ('vegetarian' | 'non-vegetarian' | 'vegan' | 'jain' | 'no-restrictions')[];
  };
  meetingPreference: 'public-place-first' | 'direct-meetup' | 'video-call-before';
  comfortSettings: {
    preferMutualFriends: boolean;
    checkSocialProfiles: boolean;
  };
  specificMentions?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const DayOutingPurposeSchema = new Schema<IDayOutingPurpose>(
  {
    connectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
      // REMOVED: index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      // REMOVED: index: true
    },
    outingType: {
      type: String,
      enum: [
        'cafe-restaurant',
        'nature-walk-hiking',
        'shopping-market',
        'museum-gallery',
        'photography-walk',
        'cycling-biking',
        'beach-lake',
        'amusement-park',
        'heritage-tour',
        'food-tour',
        'theater-show',
        'sports-activity',
        'yoga-meditation',
        'creative-workshop',
        'custom',
      ],
      required: true,
    },
    customOutingDescription: {
      type: String,
      maxlength: 300,
    },
    outingDate: {
      type: Date,
      required: true,
      // REMOVED: index: true
    },
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
      required: true,
    },
    duration: {
      type: String,
      enum: ['quick-1-2hrs', 'half-day', 'full-day', 'flexible'],
      required: true,
    },
    companionPreference: {
      type: {
        type: String,
        enum: ['solo-companion', 'small-group', 'large-group'],
        required: true,
      },
      genderPreference: {
        type: String,
        enum: ['male', 'female', 'mixed', 'any'],
        required: true,
      },
      groupSize: {
        min: Number,
        max: Number,
      },
    },
    outingStyle: {
      type: String,
      enum: [
        'planner',
        'go-with-flow',
        'budget-conscious',
        'premium-experience',
        'content-creator',
        'social-fun',
        'chill-relax',
      ],
      required: true,
    },
    logistics: {
      transportation: {
        type: String,
        enum: ['own-vehicle', 'need-ride', 'public-transport', 'meet-location', 'flexible'],
        required: true,
      },
      costSplitting: {
        type: String,
        enum: ['dutch', 'split-equally', 'rotating-treat', 'flexible'],
        required: true,
      },
      foodPreferences: [
        {
          type: String,
          enum: ['vegetarian', 'non-vegetarian', 'vegan', 'jain', 'no-restrictions'],
        },
      ],
    },
    meetingPreference: {
      type: String,
      enum: ['public-place-first', 'direct-meetup', 'video-call-before'],
      required: true,
    },
    comfortSettings: {
      preferMutualFriends: {
        type: Boolean,
        default: false,
      },
      checkSocialProfiles: {
        type: Boolean,
        default: false,
      },
    },
    specificMentions: {
      type: String,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
      // REMOVED: index: true
    },
  },
  { timestamps: true }
);

// Define all indexes here
DayOutingPurposeSchema.index({ connectionProfileId: 1 });
DayOutingPurposeSchema.index({ userId: 1 });
DayOutingPurposeSchema.index({ outingDate: 1 });
DayOutingPurposeSchema.index({ status: 1 });
DayOutingPurposeSchema.index({ outingType: 1 });

export default mongoose.model<IDayOutingPurpose>('DayOutingPurpose', DayOutingPurposeSchema);