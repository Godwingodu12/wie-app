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
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat.messages'
  },
  replyContent: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Chat schema with all necessary fields
const chatSchema = new mongoose.Schema({
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }],
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: mongoose.Schema.Types.ObjectId,
    timestamp: Date
  },
  // Track who cleared the chat and when (for "clear chat for me" feature)
  clearedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clearedAt: { type: Date }
  }],
  // Track who deleted the chat (for "delete chat for me" feature)
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  // Track if chat is active (for permanent deletion)
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Indexes for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ isActive: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ isActive: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;