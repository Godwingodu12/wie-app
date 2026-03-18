import mongoose, { Schema, Document } from 'mongoose';
export interface IConnectionProfile extends Document {
  userId: string;
  displayName: string;
  dateOfBirth: Date;
  age: number;
  gender: 'male' | 'female' | 'transgender' | 'non-binary' | 'prefer-not-to-say';
  sexualOrientation: {
    type: string;
    private: boolean;
  };
  location: {
    city: string;
    state: string;
    country: string;
    coordinates: {
      type: string;
      coordinates: [number, number];
    };
    visibilityRadius: number;
  };
  qualifications: string[];
  profession: {
    status: string;
    currentRole?: string;
    industry?: string;
    yearsOfExperience?: string;
    institution?: string;
    fieldOfStudy?: string;
    yearSemester?: string;
    campusLocation?: string;
  };
  educationLevel: string;
  personalDescription?: string;
  hometown: {
    city: string;
    state: string;
    country: string;
  };
  hobbies: Array<{
    category: string;
    name: string;
    level?: string;
  }>;
  interests: Array<{
    category: string;
    tags: string[];
  }>;
  photos: Array<{
    url: string;
    publicId: string;
    isPrimary: boolean;
    isVerified: boolean;
    isAIGenerated: boolean;
    uploadedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  privacy: {
    hideAccountFromOthers: boolean;
    restrictVideoCall: boolean;
    hideNameFromProfile: boolean;
    hideProfileFromOthers: boolean;
    visibleOnlyToMutuals: boolean;
    locationVisibility: 'exact' | 'approximate' | 'city-only' | 'hidden';
  };
  status: 'draft' | 'active' | 'paused' | 'suspended' | 'deleted';
  profileCompleteness: number;
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  analytics: {
    profileViews: number;
    connectionsSent: number;
    connectionsReceived: number;
    connectionsAccepted: number;
    averageMatchScore: number;
    lastActiveAt?: Date;
  };
  faceVerification?: {
    status: string;
    embeddingsRegistered: boolean;
    registeredAt?: Date;
    verifiedAt?: Date;
    profileLocked: boolean;
    similarity?: number;
    failedAttempts: number;
    lastFailedAt?: Date;
    appealPending: boolean;
    appealReason?: string;
    appealRequestedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  calculateCompleteness(): number;
}

const ConnectionProfileSchema = new Schema<IConnectionProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 100,
    },
    gender: {
      type: String,
      required: true,
      enum: ['male', 'female', 'transgender', 'non-binary', 'prefer-not-to-say'],
    },
    sexualOrientation: {
      type: {
        type: String,
        enum: [
          'straight',
          'gay',
          'lesbian',
          'bisexual',
          'pansexual',
          'asexual',
          'queer',
          'questioning',
          'other',
        ],
      },
      private: {
        type: Boolean,
        default: false,
      },
    },
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          required: true,
          // REMOVED: index: '2dsphere'
        },
      },
      visibilityRadius: {
        type: Number,
        default: 10,
      },
    },
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],
    profession: {
      status: {
        type: String,
        enum: ['student', 'employed', 'self-employed', 'freelance', 'unemployed', 'career-break'],
      },
      currentRole: String,
      industry: String,
      yearsOfExperience: String,
      institution: String,
      fieldOfStudy: String,
      yearSemester: String,
      campusLocation: String,
    },
    educationLevel: {
      type: String,
      enum: [
        'still-studying',
        'high-school',
        'diploma',
        'bachelors',
        'masters',
        'doctoral',
        'prefer-not-to-say',
      ],
    },
    personalDescription: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    hometown: {
      city: String,
      state: String,
      country: String,
    },
    hobbies: [
      {
        category: String,
        name: String,
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'expert'],
        },
      },
    ],
    interests: [
      {
        category: String,
        tags: [String],
      },
    ],
    photos: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false },
        isAIGenerated: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
    privacy: {
      hideAccountFromOthers: { type: Boolean, default: false },
      restrictVideoCall: { type: Boolean, default: false },
      hideNameFromProfile: { type: Boolean, default: false },
      hideProfileFromOthers: { type: Boolean, default: false },
      visibleOnlyToMutuals: { type: Boolean, default: false },
      locationVisibility: {
        type: String,
        enum: ['exact', 'approximate', 'city-only', 'hidden'],
        default: 'approximate',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'suspended', 'deleted'],
      default: 'draft',
      // REMOVED: index: true
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedAt: Date,
    analytics: {
      profileViews: { type: Number, default: 0 },
      connectionsSent: { type: Number, default: 0 },
      connectionsReceived: { type: Number, default: 0 },
      connectionsAccepted: { type: Number, default: 0 },
      averageMatchScore: { type: Number, default: 0 },
      lastActiveAt: Date,
    },
    faceVerification: {
      status: {
        type: String,
        enum: ['not_started', 'pending_verification', 'verified', 'locked', 'appeal_pending'],
        default: 'not_started',
      },
      embeddingsRegistered: { type: Boolean, default: false },
      registeredAt:         { type: Date },
      verifiedAt:           { type: Date },
      profileLocked:        { type: Boolean, default: false },
      similarity:           { type: Number },
      failedAttempts:       { type: Number, default: 0 },
      lastFailedAt:         { type: Date },
      appealPending:        { type: Boolean, default: false },
      appealReason:         { type: String },
      appealRequestedAt:    { type: Date },
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Define all indexes here
ConnectionProfileSchema.index({ 'location.coordinates': '2dsphere' });
ConnectionProfileSchema.index({ status: 1 });
ConnectionProfileSchema.index({ 'hobbies.category': 1, 'hobbies.name': 1 });
ConnectionProfileSchema.index({ createdAt: -1 });
ConnectionProfileSchema.index({ 'analytics.lastActiveAt': -1 });

// Pre-save middleware to calculate age
ConnectionProfileSchema.pre('save', function (next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Method to calculate profile completeness
ConnectionProfileSchema.methods.calculateCompleteness = function (): number {
  let score = 0;
  const weights = {
    displayName: 10,
    dateOfBirth: 10,
    gender: 10,
    location: 10,
    qualifications: 10,
    hobbies: 15,
    interests: 15,
    photos: 20,
  };

  if (this.displayName) score += weights.displayName;
  if (this.dateOfBirth) score += weights.dateOfBirth;
  if (this.gender) score += weights.gender;
  if (this.location?.city) score += weights.location;
  if (this.qualifications?.length > 0) score += weights.qualifications;
  if (this.hobbies?.length >= 3) score += weights.hobbies;
  if (this.interests?.length >= 5) score += weights.interests;
  if (this.photos?.length >= 3) score += weights.photos;

  return score;
};

export default mongoose.model<IConnectionProfile>('ConnectionProfile', ConnectionProfileSchema);
