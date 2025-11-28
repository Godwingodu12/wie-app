import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }],
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: mongoose.Schema.Types.ObjectId,
    timestamp: Date
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
// SEPARATE indexes - do NOT combine array fields
chatSchema.index({ participants: 1 });
chatSchema.index({ isActive: 1 });
chatSchema.index({ updatedAt: -1 });
// Compound index with non-array field
chatSchema.index({ isActive: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
