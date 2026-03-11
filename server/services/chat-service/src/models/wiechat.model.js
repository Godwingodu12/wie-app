import mongoose from 'mongoose';

//  Message sub-schema 
const wieMessageSchema = new mongoose.Schema({
  sender: {
    type:     String,
    required: true,
    index:    true
  },
  content: {
    type:     String,
    required: true
  },
  messageType: {
    type:    String,
    enum:    [
      'text',
      'voice',
      'image',
      'video',
      'audio',       // uploaded audio file (not voice note)
      'file',        // document / archive
      'sticker',
      'location',
      'live_location',
      'contact',
      'profile',
      'event'
    ],
    default:  'text',
    required: true
  },

  //  Voice / audio note 
  voiceData: {
    audioBase64: String,
    duration:    Number,
    mimeType:    String,
    url:         String   
  },

  // ── Images (array – multi-image send) 
  chat_images: [{ type: String }],

  // ── Videos 
  chat_videos: [{
    url:      String,
    duration: Number,
    size:     Number,
    mimeType: String,
    thumbnail: String
  }],

  // ── Audio files 
  chat_audio: [{
    url:          String,
    duration:     Number,
    size:         Number,
    mimeType:     String,
    originalName: String
  }],

  // ── Documents 
  chat_files: [{
    url:          String,
    name:         String,
    size:         Number,
    mimeType:     String,
    extension:    String
  }],

  // ── Stickers 
  chat_stickers: [{ type: String }],
  stickerData: {
    url:      String,
    stickerId: String,
    pack:     String
  },

  // ── Location 
  locationData: {
    latitude:    Number,
    longitude:   Number,
    address:     String,
    name:        String,       // place name
    isLive:      { type: Boolean, default: false },
    liveExpiry:  Date          // when live location sharing ends
  },

  // ── Contact 
  contactData: {
    name:        String,
    phone:       [String],
    email:       [String],
    avatar:      String,
    vCard:       String        // full vCard string (optional)
  },

  // ── Profile share 
  profileData: {
    userId:      String,
    name:        String,
    username:    String,
    avatar:      String,
    bio:         String,
    is_verified: Boolean
  },

  // ── Event share 
  eventData: {
    eventId:     String,
    title:       String,
    description: String,
    startDate:   Date,
    endDate:     Date,
    venue:       String,
    image:       String,
    ticketUrl:   String
  },

  // ── Read / delivery tracking 
  readBy:      [{ type: String }],
  deliveredTo: [{ type: String }],
  isRead: {
    type:    Boolean,
    default: false
  },

  // ── Soft-delete 
  deletedFor:          [{ type: String }],
  deletedForEveryone: {
    type:    Boolean,
    default: false
  },

  timestamp: {
    type:    Date,
    default: Date.now,
    index:   true
  }
}, {
  _id:    true,
  strict: false
});

// ─── Chat schema 
const wieChatSchema = new mongoose.Schema({
  participants: [{
    type:     String,
    required: true
  }],
  type: {
    type:    String,
    enum:    ['direct', 'request'],
    default: 'direct'
  },
  status: {
    type:    String,
    enum:    ['pending', 'accepted', 'declined'],
    default: 'accepted'
  },
  messages:    [wieMessageSchema],
  lastMessage: {
    content:   String,
    sender:    String,
    timestamp: Date
  },
  isActive: {
    type:    Boolean,
    default: true
  },
  deletedFor: [{ type: String }],
  clearedBy:  [{
    user:      String,
    clearedAt: Date
  }],
  acceptedBy:  { type: String },
  acceptedAt:  { type: Date },
  requestedBy: { type: String },
  requestedAt: { type: Date },
  createdBy:   { type: String },
  unreadCounts: {
    type:    mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  strict:     false
});

wieChatSchema.index({ participants: 1, isActive: 1 });
wieChatSchema.index({ participants: 1, type: 1 });
wieChatSchema.index({ updatedAt: -1 });
wieChatSchema.index({ 'lastMessage.timestamp': -1 });

const WieChat = mongoose.model('WieChat', wieChatSchema);
export default WieChat;
