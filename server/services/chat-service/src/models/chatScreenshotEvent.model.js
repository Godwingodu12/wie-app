import mongoose from 'mongoose';

const ChatScreenshotEventSchema = new mongoose.Schema({
  chatId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

ChatScreenshotEventSchema.index({ chatId: 1, userId: 1 }, { unique: true });

const ChatScreenshotEventModel = mongoose.models.ChatScreenshotEvent || mongoose.model('ChatScreenshotEvent', ChatScreenshotEventSchema);

export default ChatScreenshotEventModel;
