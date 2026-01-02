import mongoose from 'mongoose';

const wieMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  readBy: [{
    type: String
  }],
  deliveredTo: [{
    type: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  deletedFor: [{  // NEW: Track who deleted this message
    type: String
  }],
  deletedForEveryone: {  // NEW: If true, message is deleted for all users
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { _id: true });

const wieChatSchema = new mongoose.Schema({
  participants: [{
    type: String,
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'request'],
    default: 'direct'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'accepted'
  },
  messages: [wieMessageSchema],
  lastMessage: {
    content: String,
    sender: String,
    timestamp: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deletedFor: [{
    type: String
  }],
  clearedBy: [{
    user: String,
    clearedAt: Date
  }],
  acceptedBy: {
    type: String
  },
  acceptedAt: {
    type: Date
  }
}, {
  timestamps: true
});

wieChatSchema.index({ participants: 1, isActive: 1 });
wieChatSchema.index({ participants: 1, type: 1 });
wieChatSchema.index({ updatedAt: -1 });
wieChatSchema.index({ 'lastMessage.timestamp': -1 });

const WieChat = mongoose.model('WieChat', wieChatSchema);

export default WieChat;