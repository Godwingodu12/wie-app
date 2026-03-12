import path from 'path';
import WieChat from '../models/wiechat.model.js';
import { getWieUserById } from '../grpc/wieUserClient.js';
import { getIO, isUserOnline } from '../socket/wieSocket.js';
import { isBlocked } from '../services/block.service.js';
import {
  uploadChatImage,
  uploadChatVideo,
  uploadChatAudio,
  uploadChatDocument
} from '../utils/cloudinaryHelper.js';


const sendMediaMessage = async ({ res, chat, userId, messageObj, receiverInfo, senderInfo }) => {
  const userIdStr  = userId.toString();
  const receiverId = chat.participants.find(id => id !== userIdStr);

  // ── Check receiver is viewing this chat 
  const receiverOnline = isUserOnline(receiverId);
  let   receiverViewingChat = false;

  if (receiverOnline) {
    try {
      const io = getIO();
      for (const [, socket] of io.sockets.sockets) {
        if (socket.userId === receiverId && socket.rooms.has(chat._id.toString())) {
          receiverViewingChat = true;
          break;
        }
      }
    } catch { /* silent */ }
  }

  // ── Finalise message object 
  messageObj.readBy      = receiverViewingChat ? [userIdStr, receiverId] : [userIdStr];
  messageObj.isRead      = receiverViewingChat;
  messageObj.deliveredTo = receiverOnline ? [receiverId] : [];
  messageObj.timestamp   = new Date();

  chat.messages.push(messageObj);
  chat.lastMessage = {
    content:   messageObj.content,
    sender:    userIdStr,
    timestamp: messageObj.timestamp
  };

  // Restore chat for receiver if previously deleted
  if (chat.deletedFor?.length) {
    chat.deletedFor = chat.deletedFor.filter(id => id !== receiverId);
  }

  chat.updatedAt = new Date();
  await chat.save();

  const saved = chat.messages[chat.messages.length - 1];

  // ── Unread count for receiver 
  let receiverUnreadCount = 0;
  if (!receiverViewingChat) {
    let msgs = chat.messages;
    const clearRec = chat.clearedBy?.find(r => r.user === receiverId);
    if (clearRec) msgs = msgs.filter(m => new Date(m.createdAt || m.timestamp) > new Date(clearRec.clearedAt));
    receiverUnreadCount = msgs.filter(m => m.sender !== receiverId && !m.readBy?.includes(receiverId)).length;
  }

  // ── HTTP response 
  res.status(201).json({
    success: true,
    message: buildMessagePayload(saved, userIdStr, receiverOnline),
    chatId:  chat._id
  });

  // ── Socket emissions (non-blocking) 
  setImmediate(() => {
    try {
      const io       = getIO();
      const msgData  = buildMessagePayload(saved, userIdStr, receiverOnline);
      const chatIdStr = chat._id.toString();

      // To the whole chat room
      io.to(chatIdStr).emit('new-message', {
        chatId:   chatIdStr,
        message:  msgData,
        sender:   userIdStr,
        timestamp: new Date()
      });

      const participantPayload = {
        _id:            senderInfo?.id || userIdStr,
        name:           senderInfo?.name || 'Someone',
        username:       senderInfo?.username || '',
        profile_picture:senderInfo?.profile_picture || null,
        is_verified:    senderInfo?.is_verified || false,
        isOnline:       isUserOnline(userIdStr),
        last_seen_at:   senderInfo?.last_seen_at || null
      };

      // Notification to receiver
      io.to(receiverId).emit('new-message-notification', {
        chatId:    chatIdStr,
        message:   msgData,
        lastMessage: chat.lastMessage,
        participant: participantPayload,
        type:        'direct',
        status:      'accepted',
        unreadCount: receiverUnreadCount,
        timestamp:   new Date()
      });

      io.to(receiverId).emit('chat-unread-update', { chatId: chatIdStr, unreadCount: receiverUnreadCount });

      // Chat-list update for both sides
      io.to(receiverId).emit('chat-list-update', {
        chatId:      chatIdStr,
        lastMessage: chat.lastMessage,
        participant: participantPayload,
        type:        'direct',
        status:      'accepted',
        unreadCount: receiverUnreadCount
      });

      const receiverPayload = {
        _id:            receiverInfo?.id || receiverId,
        name:           receiverInfo?.name || 'Someone',
        username:       receiverInfo?.username || '',
        profile_picture:receiverInfo?.profile_picture || null,
        is_verified:    receiverInfo?.is_verified || false,
        isOnline:       receiverOnline,
        last_seen_at:   receiverInfo?.last_seen_at || null
      };

      io.to(userIdStr).emit('chat-list-update', {
        chatId:      chatIdStr,
        lastMessage: chat.lastMessage,
        participant: receiverPayload,
        type:        'direct',
        status:      'accepted',
        unreadCount: 0,
        isSender:    true
      });

    } catch (err) {
      console.error('Socket emit error (media):', err.message);
    }
  });
};

/** Strips internal fields and returns a clean payload */
const buildMessagePayload = (msg, currentUserId, receiverOnline = false) => {
  const base = {
    _id:         msg._id?.toString(),
    sender:      msg.sender,
    content:     msg.content,
    messageType: msg.messageType,
    timestamp:   msg.timestamp,
    createdAt:   msg.timestamp,
    readBy:      msg.readBy || [],
    deliveredTo: msg.deliveredTo || [],
    isRead:      msg.isRead || false,
    isSender:    msg.sender === currentUserId,
    receiverOnline
  };

  // Attach rich data if present
  const richFields = [
    'chat_images','chat_videos','chat_audio','chat_files','chat_stickers',
    'stickerData','voiceData','locationData','contactData','profileData','eventData'
  ];
  richFields.forEach(f => { if (msg[f] != null) base[f] = msg[f]; });

  return base;
};

/** Guard: verify participant + block status */
const verifyParticipant = async (chat, userIdStr) => {
  if (!chat.participants.some(id => id === userIdStr)) return 'not_participant';
  const otherId = chat.participants.find(id => id !== userIdStr);
  const blocked = await isBlocked(userIdStr, otherId);
  if (blocked) return 'blocked';
  return 'ok';
};


export const sendImageMessage = async (req, res) => {
  try {
    const { chatId }  = req.params;
    const userId      = req.user._id || req.user.id;
    const userIdStr   = userId.toString();
    const { caption } = req.body;

    if (!req.files?.length && !req.file) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') {
      return res.status(403).json({ success: false, message: guard === 'blocked' ? 'User is blocked' : 'Not a participant' });
    }

    const files  = req.files || [req.file];
    const VALID_MODES = ['view_once', 'allow_replay', 'keep'];
    const viewMode = VALID_MODES.includes(req.body.viewMode) ? req.body.viewMode : 'keep';
    const imgUrls = await Promise.all(
      files.map(f => uploadChatImage(f.buffer, { originalName: f.originalname, mimeType: f.mimetype }))
    );
    const imagesWithMode = imgUrls.map(result => ({
      url:      result.url,
      viewMode,
      viewedBy: [],
    }));
    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const messageObj = {
      sender:      userIdStr,
      content:     viewMode !== 'keep' ? '📷 Photo' : (caption?.trim() || '📷 Image'),
      messageType: 'image',
      chat_images: imagesWithMode,
      viewMode,
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendImageMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send image' });
  }
};

export const sendVideoMessage = async (req, res) => {
  try {
    const { chatId }  = req.params;
    const userId      = req.user._id || req.user.id;
    const userIdStr   = userId.toString();
    const { caption } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: 'No video file provided' });

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const videoResult = await uploadChatVideo(req.file.buffer, {
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype
    });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const viewMode = req.body.viewMode || 'keep';
    const messageObj = {
      sender:      userIdStr,
      content:     viewMode !== 'keep' ? '🎥 Video' : (caption?.trim() || '🎥 Video'),
      messageType: 'video',
      chat_videos: [{
        url:      videoResult.url,
        duration: videoResult.duration,
        size:     videoResult.bytes,
        mimeType: req.file.mimetype,
        viewMode,
        viewedBy: [],
      }],
      viewMode,
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendVideoMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send video' });
  }
};

export const sendAudioMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId     = req.user._id || req.user.id;
    const userIdStr  = userId.toString();

    if (!req.file) return res.status(400).json({ success: false, message: 'No audio file provided' });

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const audioResult = await uploadChatAudio(req.file.buffer, {
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype
    });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const messageObj = {
      sender:      userIdStr,
      content:     '🎵 Audio',
      messageType: 'audio',
      chat_audio:  [{
        url:          audioResult.url,
        duration:     audioResult.duration,
        size:         audioResult.bytes,
        mimeType:     req.file.mimetype,
        originalName: req.file.originalname
      }]
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendAudioMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send audio' });
  }
};

export const sendDocumentMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId     = req.user._id || req.user.id;
    const userIdStr  = userId.toString();

    if (!req.file) return res.status(400).json({ success: false, message: 'No document file provided' });

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const docResult = await uploadChatDocument(req.file.buffer, {
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype
    });

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const messageObj = {
      sender:      userIdStr,
      content:     `📎 ${req.file.originalname}`,
      messageType: 'file',
      chat_files:  [{
        url:          docResult.url,
        name:         req.file.originalname,
        size:         docResult.bytes || req.file.size,
        mimeType:     req.file.mimetype,
        extension:    ext
      }]
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendDocumentMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send document' });
  }
};

/**
 * POST /api/wie-chat/:chatId/send-sticker
 * Body (JSON): { stickerId, url, pack }
 */
export const sendStickerMessage = async (req, res) => {
  try {
    const { chatId }            = req.params;
    const { stickerId, url, pack } = req.body;
    const userId                = req.user._id || req.user.id;
    const userIdStr             = userId.toString();

    if (!url) return res.status(400).json({ success: false, message: 'Sticker URL is required' });

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const messageObj = {
      sender:      userIdStr,
      content:     '🎭 Sticker',
      messageType: 'sticker',
      stickerData: { url, stickerId: stickerId || null, pack: pack || null }
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendStickerMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send sticker' });
  }
};

export const sendLocationMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { latitude, longitude, address, name, isLive, liveExpiry } = req.body;
    const userId     = req.user._id || req.user.id;
    const userIdStr  = userId.toString();

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const messageType = isLive ? 'live_location' : 'location';
    const messageObj = {
      sender:      userIdStr,
      content:     isLive ? '📍 Live Location' : '📍 Location',
      messageType,
      locationData: {
        latitude:   parseFloat(latitude),
        longitude:  parseFloat(longitude),
        address:    address || null,
        name:       name    || null,
        isLive:     !!isLive,
        liveExpiry: liveExpiry ? new Date(liveExpiry) : null
      }
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendLocationMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send location' });
  }
};

export const updateLiveLocation = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { latitude, longitude } = req.body;
    const userId    = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    if (latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'Coordinates required' });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const msg = chat.messages.id(messageId);
    if (!msg || msg.messageType !== 'live_location') {
      return res.status(404).json({ success: false, message: 'Live location message not found' });
    }
    if (msg.sender !== userIdStr) {
      return res.status(403).json({ success: false, message: 'Only sender can update live location' });
    }
    if (msg.locationData?.liveExpiry && new Date(msg.locationData.liveExpiry) < new Date()) {
      return res.status(400).json({ success: false, message: 'Live location has expired' });
    }

    msg.locationData.latitude  = parseFloat(latitude);
    msg.locationData.longitude = parseFloat(longitude);
    chat.markModified('messages');
    await chat.save();

    // Broadcast updated coordinates
    try {
      const io = getIO();
      io.to(chatId.toString()).emit('live-location-update', {
        chatId,
        messageId,
        latitude:   msg.locationData.latitude,
        longitude:  msg.locationData.longitude,
        senderId:   userIdStr,
        timestamp:  new Date()
      });
    } catch { /* silent */ }

    res.status(200).json({ success: true, message: 'Live location updated' });
  } catch (error) {
    console.error('updateLiveLocation error:', error);
    res.status(500).json({ success: false, message: 'Failed to update live location' });
  }
};

/**
 * POST /api/wie-chat/:chatId/send-contact
 * Body (JSON): { name, phone: string | string[], email?, avatar?, vCard? }
 */
export const sendContactMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, phone, email, avatar, vCard } = req.body;
    const userId     = req.user._id || req.user.id;
    const userIdStr  = userId.toString();

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'name and phone are required' });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const phones = Array.isArray(phone) ? phone : [phone];
    const emails = email ? (Array.isArray(email) ? email : [email]) : [];

    const messageObj = {
      sender:      userIdStr,
      content:     `👤 ${name}`,
      messageType: 'contact',
      contactData: {
        name,
        phone:  phones,
        email:  emails,
        avatar: avatar || null,
        vCard:  vCard  || null
      }
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendContactMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send contact' });
  }
};

/**
 * POST /api/wie-chat/:chatId/send-profile
 * Body (JSON): { userId (of shared profile), name, username, avatar, bio, is_verified }
 * NOTE: Frontend resolves the user data from wie-user-service before calling this.
 */
export const sendProfileMessage = async (req, res) => {
  try {
    const { chatId }    = req.params;
    const { profileUserId, name, username, avatar, bio, is_verified } = req.body;
    const userId        = req.user._id || req.user.id;
    const userIdStr     = userId.toString();

    if (!profileUserId) {
      return res.status(400).json({ success: false, message: 'profileUserId is required' });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    let profileName     = name        || null;
    let profileUsername = username    || null;
    let profileAvatar   = avatar      || null;
    let profileBio      = bio         || null;
    let profileVerified = is_verified || false;
    try {
      const profileUser = await getWieUserById(profileUserId);
      if (profileUser) {
        profileName     = profileName     || profileUser.name        || null;
        profileUsername = profileUsername || profileUser.username    || null;
        profileAvatar   = profileAvatar   || profileUser.profile_picture || null;
        profileBio      = profileBio      || profileUser.bio         || null;
        profileVerified = profileVerified || profileUser.is_verified || false;
      }
    } catch (e) {
      console.error('Could not fetch profile user details:', e.message);
    }

    const messageObj = {
      sender:      userIdStr,
      content:     `👤 ${profileName || 'Profile'}`,
      messageType: 'profile',
      profileData: {
        userId:      profileUserId,
        name:        profileName,
        username:    profileUsername,
        avatar:      profileAvatar,
        bio:         profileBio,
        is_verified: profileVerified,
      }
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendProfileMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send profile' });
  }
};

export const sendEventMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { eventId, title, description, startDate, endDate, venue, image, ticketUrl } = req.body;
    const userId     = req.user._id || req.user.id;
    const userIdStr  = userId.toString();

    if (!eventId || !title) {
      return res.status(400).json({ success: false, message: 'eventId and title are required' });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const guard = await verifyParticipant(chat, userIdStr);
    if (guard !== 'ok') return res.status(403).json({ success: false, message: 'Access denied' });

    const [senderInfo, receiverInfo] = await Promise.allSettled([
      getWieUserById(userIdStr),
      getWieUserById(chat.participants.find(id => id !== userIdStr))
    ]).then(r => r.map(s => s.status === 'fulfilled' ? s.value : null));

    const messageObj = {
      sender:      userIdStr,
      content:     `🎟️ ${title}`,
      messageType: 'event',
      eventData: {
        eventId,
        title,
        description: description || null,
        startDate:   startDate   ? new Date(startDate) : null,
        endDate:     endDate     ? new Date(endDate)   : null,
        venue:       venue       || null,
        image:       image       || null,
        ticketUrl:   ticketUrl   || null
      }
    };

    await sendMediaMessage({ res, chat, userId, messageObj, senderInfo, receiverInfo });
  } catch (error) {
    console.error('sendEventMessage error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to send event' });
  }
};

export const getChatMedia = async (req, res) => {
  try {
    const { chatId }             = req.params;
    const userId                 = req.user._id || req.user.id;
    const userIdStr              = userId.toString();
    const { type, page = 1, limit = 20 } = req.query;

    const chat = await WieChat.findById(chatId).lean();
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    if (!chat.participants.some(id => id === userIdStr)) {
      return res.status(403).json({ success: false, message: 'Not a participant' });
    }

    const MEDIA_TYPES = ['image', 'video', 'audio', 'file', 'sticker', 'voice'];

    let messages = chat.messages.filter(msg => {
      if (msg.deletedForEveryone) return false;
      if (msg.deletedFor?.includes(userIdStr)) return false;
      if (type) return msg.messageType === type;
      return MEDIA_TYPES.includes(msg.messageType);
    });

    // Apply cleared-chat filter
    const clearRec = chat.clearedBy?.find(r => r.user === userIdStr);
    if (clearRec) {
      messages = messages.filter(m => new Date(m.createdAt || m.timestamp) > new Date(clearRec.clearedAt));
    }

    const total  = messages.length;
    const start  = (parseInt(page) - 1) * parseInt(limit);
    const paged  = messages.slice(start, start + parseInt(limit));

    res.status(200).json({
      success: true,
      media:   paged.map(m => buildMessagePayload(m, userIdStr)),
      total,
      page:    parseInt(page),
      pages:   Math.ceil(total / parseInt(limit)),
      hasMore: start + parseInt(limit) < total
    });
  } catch (error) {
    console.error('getChatMedia error:', error);
    res.status(500).json({ success: false, message: 'Failed to get media' });
  }
};

export const markMediaViewed = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { finalView = true }  = req.body;
    const userId = (req.user._id || req.user.id).toString();

    const chat = await WieChat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const message = chat.messages.id(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    ['chat_images', 'chat_videos'].forEach(field => {
      (message[field] || []).forEach(item => {
        if (item.viewMode && item.viewMode !== 'keep') {
          if (!item.viewedBy.includes(userId)) {
            item.viewedBy.push(userId);
          }
        }
      });
    });

    await chat.save();
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('media_viewed', { chatId, messageId, viewedBy: userId });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('markMediaViewed error:', error);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: 'Failed to mark media as viewed' });
  }
};
