import mongoose, { Schema, Document, Model } from "mongoose";

// Types
export type PostVisibility = "public" | "followers" | "only_me";
export type PostMediaType = "image" | "video";

// ── Sub-document interfaces
export interface IPostMediaItem {
  url: string;
  type: PostMediaType;
  publicId: string;
  cloudinaryResourceType: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  aspectRatio?: string; // e.g. "4:5", "1:1", "16:9"
  order: number; // position in carousel
}

export interface IPostCommentReply {
  _id?: any;
  userId: string;
  text: string;
  likes: string[];
  createdAt: Date;
}

export interface IPostComment {
  _id?: any;
  userId: string;
  text: string;
  likes: string[];
  replies: IPostCommentReply[];
  createdAt: Date;
}

export interface IPostLike {
  userId: string;
  emoji: string; // "❤️" | "🔥" | "😂" | "😮" | "👏" | "🚀"
  createdAt: Date;
}

export interface IPostShare {
  userId: string;
  createdAt: Date;
}

export interface IPostSave {
  userId: string;
  collection?: string;
  createdAt: Date;
}

export interface ITaggedUser {
  userId: string;
  x?: number; // % position on image (0–100)
  y?: number;
  mediaIndex?: number; // which item in carousel (0-based)
}

// ── Main document interface
export interface IPost extends Document {
  userId: string;
  mediaItems: IPostMediaItem[];
  caption?: string;
  visibility: PostVisibility;

  // Location sticker
  locationLabel?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;

  // People tagged in image(s)
  taggedUsers: ITaggedUser[];

  // @mention user IDs extracted from caption
  mentions: string[];

  // Interactions
  likes: IPostLike[];
  comments: IPostComment[];
  shares: IPostShare[];
  saves: IPostSave[];
  shareCount: number; // also bumped when shared externally

  // Post-level settings
  commentsDisabled: boolean;
  likesHidden: boolean; // owner can hide the like count

  // Status
  isDeleted: boolean;
  isArchived: boolean;
  isPinned: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Virtuals
  likeCount: number;
  commentCount: number;
  saveCount: number;
  mediaCount: number;
}

// ── Sub-schemas
const PostCommentReplySchema = new Schema<IPostCommentReply>(
  {
    userId: { type: String, required: true },
    text: { type: String, required: true, maxlength: 300 },
    likes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const PostCommentSchema = new Schema<IPostComment>(
  {
    userId: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    likes: { type: [String], default: [] },
    replies: { type: [PostCommentReplySchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

// ── Main schema
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

    // Location
    locationLabel: { type: String },
    locationPlaceId: { type: String },
    locationLat: { type: Number },
    locationLng: { type: Number },

    // Tags & mentions
    taggedUsers: [
      {
        userId: { type: String, required: true },
        x: { type: Number },
        y: { type: Number },
        mediaIndex: { type: Number, default: 0 },
      },
    ],
    mentions: { type: [String], default: [] },

    // Interactions
    likes: [
      {
        userId: { type: String, required: true },
        emoji: { type: String, default: "❤️" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    comments: { type: [PostCommentSchema], default: [] },
    shares: [
      {
        userId: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    saves: [
      {
        userId: { type: String },
        collection: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shareCount: { type: Number, default: 0 },

    // Settings
    commentsDisabled: { type: Boolean, default: false },
    likesHidden: { type: Boolean, default: false },

    // Status
    isDeleted: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ userId: 1, isDeleted: 1, isPinned: -1, createdAt: -1 });
PostSchema.index({ visibility: 1, isDeleted: 1, createdAt: -1 });

// ── Virtuals
PostSchema.virtual("likeCount").get(function (this: IPost) {
  return this.likes.length;
});
PostSchema.virtual("commentCount").get(function (this: IPost) {
  return this.comments.length;
});
PostSchema.virtual("saveCount").get(function (this: IPost) {
  return this.saves.length;
});
PostSchema.virtual("mediaCount").get(function (this: IPost) {
  return this.mediaItems.length;
});

const PostModel: Model<IPost> = mongoose.model<IPost>("Post", PostSchema);
export default PostModel;
