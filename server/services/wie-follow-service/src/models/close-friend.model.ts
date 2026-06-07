import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICloseFriend extends Document {
  userId: string; // the owner — person who created the list
  closeFriendId: string; // the friend being added
  createdAt: Date;
}

const CloseFriendSchema = new Schema<ICloseFriend>(
  {
    userId: { type: String, required: true, index: true },
    closeFriendId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// Unique pair — prevents duplicate entries
CloseFriendSchema.index({ userId: 1, closeFriendId: 1 }, { unique: true });

// Fast reverse lookup: "which lists does this person appear in?"
CloseFriendSchema.index({ closeFriendId: 1 });

const CloseFriend: Model<ICloseFriend> =
  mongoose.models.CloseFriend ??
  mongoose.model<ICloseFriend>("CloseFriend", CloseFriendSchema);

export default CloseFriend;
