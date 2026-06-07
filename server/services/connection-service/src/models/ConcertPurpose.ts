import mongoose, { Schema, Document } from 'mongoose';

export interface IConcertPurpose extends Document {
  connectionProfileId: mongoose.Types.ObjectId;
  userId: string;
  eventTypes: (
    | 'music'
    | 'sports'
    | 'tech-fest'
    | 'cultural'
    | 'art-design'
    | 'literary'
    | 'food-drink'
    | 'gaming'
    | 'fitness-wellness'
  )[];
  hasUpcomingEvent: boolean;
  event?: {
    name: string;
    date: Date;
    venue: string;
    location: {
      city: string;
      coordinates: {
        type: string;
        coordinates: [number, number];
      };
    };
    ticketStatus: 'confirmed' | 'planning' | 'interested';
  };
  lookingFor: (
    | 'ride-buddies'
    | 'group-attend'
    | 'accommodation-sharing'
    | 'pre-event-meetup'
    | 'post-event-hangout'
    | 'photography-partner'
    | 'fellow-fans'
  )[];
  eventStyle?:
    | 'front-row-fanatic'
    | 'chill-viber'
    | 'content-creator'
    | 'social-butterfly'
    | 'true-enthusiast'
    | 'dance-energy';
  musicPreferences?: {
    genres: string[];
    favoriteArtists: string[];
  };
  status: 'active' | 'event-completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const ConcertPurposeSchema = new Schema<IConcertPurpose>(
  {
    connectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
      // REMOVED: index: true
    },
    userId: {
      type: String,
      required: true,
      // REMOVED: index: true
    },
    eventTypes: {
      type: [String],
      enum: [
        'music',
        'sports',
        'tech-fest',
        'cultural',
        'art-design',
        'literary',
        'food-drink',
        'gaming',
        'fitness-wellness',
      ],
      default: [],
    },
    hasUpcomingEvent: {
      type: Boolean,
      required: true,
      default: false,
    },
    event: {
      type: {
        name: { type: String },
        date: {
          type: Date,
          // REMOVED: index: true
        },
        venue: { type: String },
        location: {
          city: { type: String },
          coordinates: {
            type: {
              type: String,
              enum: ['Point'],
              default: 'Point',
            },
            coordinates: {
              type: [Number],
              // REMOVED: index: '2dsphere'
            },
          },
        },
        ticketStatus: {
          type: String,
          enum: ['confirmed', 'planning', 'interested'],
        },
      },
      required: false,
    },
    lookingFor: {
      type: [String],
      enum: [
        'ride-buddies',
        'group-attend',
        'accommodation-sharing',
        'pre-event-meetup',
        'post-event-hangout',
        'photography-partner',
        'fellow-fans',
      ],
      default: [],
    },
    eventStyle: {
      type: String,
      enum: [
        'front-row-fanatic',
        'chill-viber',
        'content-creator',
        'social-butterfly',
        'true-enthusiast',
        'dance-energy',
      ],
    },
    musicPreferences: {
      type: {
        genres: { type: [String], default: [] },
        favoriteArtists: { type: [String], default: [] },
      },
      required: false,
    },
    status: {
      type: String,
      enum: ['active', 'event-completed', 'cancelled'],
      default: 'active',
      // REMOVED: index: true
    },
  },
  { timestamps: true }
);

// Define all indexes here
ConcertPurposeSchema.index({ connectionProfileId: 1 });
ConcertPurposeSchema.index({ userId: 1 });
ConcertPurposeSchema.index({ 'event.date': 1 });
ConcertPurposeSchema.index({ 'event.location.coordinates': '2dsphere' });
ConcertPurposeSchema.index({ status: 1 });

export default mongoose.model<IConcertPurpose>('ConcertPurpose', ConcertPurposeSchema);