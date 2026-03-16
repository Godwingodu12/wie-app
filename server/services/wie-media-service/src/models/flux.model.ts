import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFluxView {
  viewerId: string;
  viewedAt: Date;
}

export interface IFluxReaction {
  userId:    string;
  emoji:     string;
  createdAt: Date;
}

export interface IFluxReply {
  senderId:  string;
  message:   string;
  createdAt: Date;
}
export interface mentionFlux{
  userId: string;
  createdAt: Date;
}
export type FluxVisibility = 'public' | 'followers' | 'close_friends' | 'only_me';
export type FluxMediaType  = 'image'  | 'video';

export interface IFlux extends Document {
  userId:                  string;
  mediaUrl:                string;
  mediaType:               FluxMediaType;
  cloudinaryPublicId:      string;
  cloudinaryResourceType:  string;
  caption?:                string;
  visibility:              FluxVisibility;
  duration?:               number;
  width?:                  number;
  height?:                 number;
  format?:                 string;
  bytes?:                  number;
  // Location sticker (stored as a structured object, not just caption)
  locationLabel?:  string;   
  locationPlaceId?: string;
  locationLat?:    number;
  locationLng?:    number;
  locationCategory?: string;
    // Position of location sticker on the canvas (% of preview frame)
  locationStickerX?: number;   // 0–100
  locationStickerY?: number;   // 0–100
  locationStickerTheme?: number; // 0–5
  stickers?:    Record<string, any>[];
  musicId?:     string;
  musicTitle?:  string;
  musicArtist?: string;
  musicStartAt?: number;
  musicPreviewUrl?: string;
  musicAlbumArt?:  string;
  overlays?: Record<string, any>[];
  // Viewer tracking (flat array for fast $addToSet)
  viewers: string[];
  hiddenFrom: string[];  
  views:     IFluxView[];
  reactions: IFluxReaction[];
  mentions: mentionFlux[];
  replies:   IFluxReply[];
  reMentions: { userId: string; comment: string; createdAt: Date }[];
  expiresAt:  Date;
  status:     'active' | 'expired' | 'archived' | 'deleted';
  isArchived: boolean;
  isDeleted:  boolean;

  createdAt: Date;
  updatedAt: Date;

  // virtuals
  viewCount:     number;
  reactionCount: number;
  isExpired:     boolean;
}

const FluxSchema = new Schema<IFlux>(
  {
    userId:                 { type: String, required: true, index: true },
    mediaUrl:               { type: String, required: true },
    mediaType:              { type: String, enum: ['image', 'video'], required: true },
    cloudinaryPublicId:     { type: String, required: true },
    cloudinaryResourceType: { type: String, default: 'image' },
    caption:                { type: String, maxlength: 500 },
    visibility: {
      type:    String,
      enum:    ['public', 'followers', 'close_friends', 'only_me'],
      default: 'followers',
    },
    duration: { type: Number },
    width:    { type: Number },
    height:   { type: Number },
    format:   { type: String },
    bytes:    { type: Number },

    stickers:     { type: [Schema.Types.Mixed], default: [] },
    musicId:      { type: String },
    musicTitle:   { type: String },
    musicArtist:  { type: String },
    musicStartAt: { type: Number },
    musicPreviewUrl: {type: String},
    musicAlbumArt:   { type: String },

    locationLabel:        { type: String },
    locationPlaceId:      { type: String },
    locationLat:          { type: Number },
    locationLng:          { type: Number },
    locationCategory:     { type: String },
    locationStickerX:     { type: Number },
    locationStickerY:     { type: Number },
    locationStickerTheme: { type: Number },

    overlays: { type: [Schema.Types.Mixed], default: [] },
    // Flat viewer-ID list — used by $addToSet for deduplication
    viewers: { type: [String], default: [] },
    hiddenFrom: { type: [String], default: [] },
    views: [
      {
        viewerId: { type: String, required: true },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    mentions: {
      type: [
        {
          userId:    { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    reMentions: {
      type: [
        {
          userId:    { type: String, required: true },
          comment:   { type: String, default: '' },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    reactions: [
      {
        userId:    { type: String, required: true },
        emoji:     { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replies: [
      {
        senderId:  { type: String, required: true },
        message:   { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    expiresAt: {
          type:    Date,
          default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    status: {
      type:    String,
      enum:    ['active', 'expired', 'archived', 'deleted'],
      default: 'active',
      index:   true,
    },
    isArchived: { type: Boolean, default: false },
    isDeleted:  { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────
FluxSchema.index({ userId: 1, expiresAt:  1 });
FluxSchema.index({ userId: 1, isArchived: 1 });
FluxSchema.index({ createdAt: -1 });

// ── Virtuals ───────────────────────────────────────────────

// viewCount = unique viewers via the flat `viewers` array (O(1) .length)
FluxSchema.virtual('viewCount').get(function (this: IFlux) {
  return this.viewers.length;
});

FluxSchema.virtual('reactionCount').get(function (this: IFlux) {
  return this.reactions.length;
});

FluxSchema.virtual('isExpired').get(function (this: IFlux) {
  return new Date() > this.expiresAt;
});

// Auto-compute status based on fields
FluxSchema.virtual('computedStatus').get(function (this: IFlux) {
  if (this.isDeleted)              return 'deleted';
  if (this.isArchived)             return 'archived';
  if (new Date() > this.expiresAt) return 'expired';
  return 'active';
});

// ── Model 
const FluxModel: Model<IFlux> = mongoose.model<IFlux>('Flux', FluxSchema);

export default FluxModel;