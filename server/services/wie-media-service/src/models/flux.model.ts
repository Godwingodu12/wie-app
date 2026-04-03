import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFluxView {
  viewerId: string;
  viewedAt: Date;
}

export interface IFluxReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}
export interface IFluxComment {
  _id?: string;
  userId: string;
  text: string;
  likes: string[]; // userIds who liked this comment
  createdAt: Date;
}
export interface IFluxLike {
  userId: string;
  emoji: string; // "❤️" default, or any reaction emoji
  createdAt: Date;
}
export interface IFluxReply {
  senderId: string;
  message: string;
  createdAt: Date;
}
export interface mentionFlux {
  userId: string;
  hasRemoved?: boolean;
  createdAt: Date;
}
export type FluxVisibility =
  | "public"
  | "followers"
  | "close_friends"
  | "only_me";
export type FluxMediaType = "image" | "video";

export interface IFlux extends Document {
  userId: string;
  mediaUrl: string;
  mediaType: FluxMediaType;
  cloudinaryPublicId: string;
  cloudinaryResourceType: string;
  caption?: string;
  visibility: FluxVisibility;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  // Location sticker (stored as a structured object, not just caption)
  locationLabel?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
  locationCategory?: string;
  // Position of location sticker on the canvas (% of preview frame)
  locationStickerX?: number; // 0–100
  locationStickerY?: number; // 0–100
  locationStickerTheme?: number; // 0–5
  stickers?: Record<string, any>[];
  filterName?: string;
  filterValue?: string;
  textLayers?: Record<string, any>[];
  textBg?: string;
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartAt?: number;
  musicPreviewUrl?: string;
  musicAlbumArt?: string;
  overlays?: Record<string, any>[];
  // Viewer tracking (flat array for fast $addToSet)
  viewers: string[];
  hiddenFrom: string[];
  views: IFluxView[];
  reactions: IFluxReaction[];
  mentions: mentionFlux[];
  replies: IFluxReply[];
  reMentions: { userId: string; comment: string; createdAt: Date }[];
  comments: IFluxComment[];
  likes: IFluxLike[];
  expiresAt: Date;
  status: "active" | "expired" | "archived" | "deleted";
  isArchived: boolean;
  isDeleted: boolean;
  commentsDisabled: boolean;
  isPersistent: boolean;
  createdAt: Date;
  updatedAt: Date;

  // virtuals
  viewCount: number;
  reactionCount: number;
  isExpired: boolean;
}

const FluxSchema = new Schema<IFlux>(
  {
    userId: { type: String, required: true, index: true },
    mediaUrl: { type: String, default: "" },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      default: "image",
    },
    cloudinaryPublicId: { type: String, default: "" },
    cloudinaryResourceType: { type: String, default: "image" },
    caption: { type: String, maxlength: 500 },
    visibility: {
      type: String,
      enum: ["public", "followers", "close_friends", "only_me"],
      default: "followers",
    },
    duration: { type: Number },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    bytes: { type: Number },

    musicId: { type: String },
    musicTitle: { type: String },
    musicArtist: { type: String },
    musicStartAt: { type: Number },
    musicPreviewUrl: { type: String },
    musicAlbumArt: { type: String },

    locationLabel: { type: String },
    locationPlaceId: { type: String },
    locationLat: { type: Number },
    locationLng: { type: Number },
    locationCategory: { type: String },
    locationStickerX: { type: Number },
    locationStickerY: { type: Number },
    locationStickerTheme: { type: Number },
    stickers: [
      {
        id: { type: String },
        type: { type: String, enum: ["gif", "emoji", "static"] },
        url: { type: String },
        x: { type: Number, default: 50 },
        y: { type: Number, default: 50 },
        scale: { type: Number, default: 1 },
        rotate: { type: Number, default: 0 },
        width: { type: Number },
        height: { type: Number },
      },
    ],
    filterName: { type: String, default: "Normal" },
    filterValue: { type: String, default: "none" },
    textLayers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    textBg: { type: String },
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
          userId: { type: String, required: true },
          hasRemoved: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    reMentions: {
      type: [
        {
          userId: { type: String, required: true },
          comment: { type: String, default: "" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    comments: {
      type: [
        {
          userId: { type: String, required: true },
          text: { type: String, required: true, maxlength: 300 },
          likes: { type: [String], default: [] },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    likes: {
      type: [
        {
          userId: { type: String, required: true },
          emoji: { type: String, default: "❤️" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    reactions: [
      {
        userId: { type: String, required: true },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replies: [
      {
        senderId: { type: String, required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["active", "expired", "archived", "deleted"],
      default: "active",
      index: true,
    },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    commentsDisabled: { type: Boolean, default: false },
    isPersistent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
FluxSchema.pre("save", function (next) {
  if (this.isNew) {
    const base = this.createdAt ?? new Date();
    const expected = new Date(base.getTime() + 24 * 60 * 60 * 1000);

    // Only override if expiresAt is missing or already in the past
    if (!this.expiresAt || this.expiresAt <= base) {
      this.expiresAt = expected;
    }
  }
  next();
});
// ── Indexes
FluxSchema.index({ userId: 1, expiresAt: 1 });
FluxSchema.index({ userId: 1, isArchived: 1 });
FluxSchema.index({ createdAt: -1 });
FluxSchema.index(
  { userId: 1, status: 1, expiresAt: 1, isDeleted: 1, isArchived: 1 },
  { name: "feed_query_idx" },
);
// ── Virtuals
// viewCount = unique viewers via the flat `viewers` array (O(1) .length)
FluxSchema.virtual("viewCount").get(function (this: IFlux) {
  return this.viewers.length;
});

FluxSchema.virtual("reactionCount").get(function (this: IFlux) {
  return this.reactions.length;
});

FluxSchema.virtual("isExpired").get(function (this: IFlux) {
  return new Date() > this.expiresAt;
});

// Auto-compute status based on fields
FluxSchema.virtual("computedStatus").get(function (this: IFlux) {
  if (this.isDeleted) return "deleted";
  if (this.isArchived) return "archived";
  if (new Date() > this.expiresAt) return "expired";
  return "active";
});

// ── Model
const FluxModel: Model<IFlux> = mongoose.model<IFlux>("Flux", FluxSchema);

export default FluxModel;
