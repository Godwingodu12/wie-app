import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommentReply {
  _id?: any;
  userId: string;
  text: string;
  gifUrl?: string | null;
  stickerUrl?: string | null;
  likeCount: number;
  likedBy: string[];
  createdAt: Date;
}

export interface IComment extends Document {
  postId: string;
  userId: string;
  text: string;
  gifUrl?: string | null;
  stickerUrl?: string | null;
  likeCount: number;
  likedBy: string[];
  replyCount: number;
  replies: ICommentReply[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<ICommentReply>(
  {
    userId: { type: String, required: true },
    text: { type: String, maxlength: 500, default: "" },
    gifUrl: { type: String, default: null },
    stickerUrl: { type: String, default: null },
    likeCount: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const CommentSchema = new Schema<IComment>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    text: { type: String, maxlength: 2200, default: "" },
    gifUrl: { type: String, default: null },
    stickerUrl: { type: String, default: null },
    likeCount: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    replyCount: { type: Number, default: 0 },
    replies: { type: [ReplySchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

CommentSchema.index({ postId: 1, createdAt: -1 });
CommentSchema.index({ postId: 1, isDeleted: 1 });

const CommentModel: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  CommentSchema,
);
export default CommentModel;
