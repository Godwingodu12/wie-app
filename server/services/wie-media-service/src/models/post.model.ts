import mongoose, { Schema, Document, Model } from "mongoose";

export type PostVisibility = "public" | "followers" | "only_me";
export type PostMediaType = "image" | "video";

export interface IPostMediaItem {
  url: string;
  type: PostMediaType;
  publicId: string;
  cloudinaryResourceType: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  aspectRatio?: string;
  order: number;
}

export interface ITaggedUser {
  userId: string;
  x?: number;
  y?: number;
  mediaIndex?: number;
}

export interface IPost extends Document {
  userId: string;
  mediaItems: IPostMediaItem[];
  caption?: string;
  visibility: PostVisibility;
  contentType: "post" | "reel";

  locationLabel?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;

  taggedUsers: ITaggedUser[];
  mentions: string[];

  // ── Denormalized counters (updated atomically) ────────────
  likeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;

  // ── Settings ─────────────────────────────────────────────
  commentsDisabled: boolean;
  likesHidden: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  isArchived: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, index: true },

    mediaItems: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
        publicId: { type: String, default: "" },
        cloudinaryResourceType: { type: String, default: "image" },
        width: { type: Number },
        height: { type: Number },
        duration: { type: Number },
        format: { type: String },
        aspectRatio: { type: String },
        order: { type: Number, default: 0 },
      },
    ],

    caption: { type: String, maxlength: 2200 },
    visibility: {
      type: String,
      enum: ["public", "followers", "only_me"],
      default: "public",
    },
    contentType: {
      type: String,
      enum: ["post", "reel"],
      default: "post",
      index: true,
    },

    locationLabel: { type: String },
    locationPlaceId: { type: String },
    locationLat: { type: Number },
    locationLng: { type: Number },

    taggedUsers: [
      {
        userId: { type: String, required: true },
        x: { type: Number },
        y: { type: Number },
        mediaIndex: { type: Number, default: 0 },
      },
    ],
    mentions: { type: [String], default: [] },

    // ── Counters ──────────────────────────────────────────
    likeCount: { type: Number, default: 0, index: true },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },

    // ── Settings ──────────────────────────────────────────
    commentsDisabled: { type: Boolean, default: false },
    likesHidden: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ userId: 1, isDeleted: 1, isPinned: -1, createdAt: -1 });
PostSchema.index({ visibility: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ contentType: 1, isDeleted: 1, createdAt: -1 });

const PostModel: Model<IPost> = mongoose.model<IPost>("Post", PostSchema);
export default PostModel;
