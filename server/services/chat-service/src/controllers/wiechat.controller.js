import WieChat from '../models/wiechat.model.js';
import { getFollowerIds,getRelationship } from '../grpc/followClient.js';
import { getWieUserById, getWieUsersByIds, searchWieUsers } from '../grpc/wieUserClient.js';
import { determineChatPermission } from '../services/permission.service.js';
import { getIO, emitToChat,getUserOnlineStat } from '../socket/wieSocket.js';
import { uploadChatImage, deleteChatImage, replaceChatImage } from '../utils/cloudinaryHelper.js';
import { isBlocked } from '../services/block.service.js';
const formatUserForChat = (user) => {
  if (!user) {
    return null;
  }
  return {
    _id: user.id,
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    contact_no: user.contact_no || '',
    profile_picture: user.profile_picture || null,
    bio: user.bio || '',
    is_verified: user.is_verified || false
  };
};
function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return null;
  
  const now = new Date();
  const lastSeen = new Date(lastSeenAt);
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return lastSeen.toLocaleDateString();
}
export const getWieChatSuggestions = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }
    try {
      const followerIds = await getFollowerIds(userId);      
      if (!followerIds || followerIds.length === 0) {
        return res.status(200).json({
          success: true,
          suggestions: []
        });
      }
      const users = await getWieUsersByIds(followerIds);      
      const suggestions = users.map(formatUserForChat).filter(u => u !== null);
      return res.status(200).json({
        success: true,
        suggestions
      });
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      return res.status(200).json({
        success: true,
        suggestions: [],
        message: 'Unable to fetch suggestions'
      });
    }
  } catch (error) {
    console.error('❌ Error in getWieChatSuggestions:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const searchWieUsersForChat = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { query } = req.query;    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found'
      });
    }
    try {
      const users = await searchWieUsers(query.trim(), userId.toString(), 50);
      const formattedUsers = users.map(formatUserForChat).filter(u => u !== null);
      return res.status(200).json({
        success: true,
        users: formattedUsers,
        count: formattedUsers.length
      });
    } catch (error) {
      console.error('❌ Search error:', error);
      return res.status(200).json({
        success: true,
        users: [],
        message: 'Search temporarily unavailable'
      });
    }
  } catch (error) {
    console.error('❌ Error in searchWieUsersForChat:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
export const createOrGetWieChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user?._id || req.user?.id || req.user?.userId;
    
    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userIdStr = userId.toString().trim();
    const participantIdStr = participantId.toString().trim();

    if (participantIdStr === userIdStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }
    const blocked = await isBlocked(userIdStr, participantIdStr);
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot create chat with this user'
      });
    }
    // Get participant details first
    let participant = null;
    try {
      participant = await getWieUserById(participantIdStr);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (participant.status !== 'active') {
        return res.status(404).json({
          success: false,
          message: 'User is not active'
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch participant:', error);
      return res.status(404).json({
        success: false,
        message: 'Failed to fetch user details'
      });
    }

    // Check if chat already exists
    let chat = await WieChat.findOne({
      participants: { $all: [userIdStr, participantIdStr] },
      type: { $in: ['direct', 'request'] },
      isActive: true
    });

    if (chat) {
      // Restore chat if deleted for this user
      if (chat.deletedFor && chat.deletedFor.includes(userIdStr)) {
        await WieChat.updateOne(
          { _id: chat._id },
          { $pull: { deletedFor: userIdStr } }
        );
      }

      return res.status(200).json({
        success: true,
        chat: {
          _id: chat._id,
          participants: chat.participants,
          participant: {
            _id: participant.id,
            name: participant.name,
            username: participant.username,
            email: participant.email,
            contact_no: participant.contact_no,
            profile_picture: participant.profile_picture,
            bio: participant.bio,
            is_verified: participant.is_verified,
            isOnline: participant.isOnline || false,
            lastSeen: participant.last_seen_at
          },
          type: chat.type,
          status: chat.status,
          messages: chat.messages || [],
          lastMessage: chat.lastMessage || null,
          unreadCount: chat.unreadCounts?.[userIdStr] || 0,
          isActive: chat.isActive,
          updatedAt: chat.updatedAt,
          isEmpty: !chat.lastMessage
        },
        isNew: false
      });
    }

    // Check if participant follows current user (recipient check)
    let isFollowedByRecipient = false;
    try {
      const relationship = await getRelationship(userIdStr, participantIdStr);
      isFollowedByRecipient = relationship?.isFollowing || false;
    } catch (relationshipError) {
      console.error('❌ Failed to check relationship:', relationshipError);
      isFollowedByRecipient = false;
    }

    // Create new chat
    // If recipient follows sender, it's direct. Otherwise it's a request
    const chatType = isFollowedByRecipient ? 'direct' : 'request';
    const chatStatus = isFollowedByRecipient ? 'accepted' : 'pending';
    
    const newChat = new WieChat({
      participants: [userIdStr, participantIdStr],
      type: chatType,
      status: chatStatus,
      createdBy: userIdStr,
      messages: [],
      unreadCounts: {
        [userIdStr]: 0,
        [participantIdStr]: 0
      },
      isActive: true,
      deletedFor: [],
      clearedBy: []
    });

    if (!isFollowedByRecipient) {
      newChat.requestedBy = userIdStr;
      newChat.requestedAt = new Date();
    }

    await newChat.save();
    return res.status(201).json({
      success: true,
      chat: {
        _id: newChat._id,
        participants: newChat.participants,
        participant: {
          _id: participant.id,
          name: participant.name,
          username: participant.username,
          email: participant.email,
          contact_no: participant.contact_no,
          profile_picture: participant.profile_picture,
          bio: participant.bio,
          is_verified: participant.is_verified,
          isOnline: participant.isOnline || false,
          lastSeen: participant.last_seen_at
        },
        type: newChat.type,
        status: newChat.status,
        messages: [],
        lastMessage: null,
        unreadCount: 0,
        isActive: newChat.isActive,
        updatedAt: newChat.updatedAt,
        isEmpty: true
      },
      isNew: true,
      isEmpty: true
    });
  } catch (error) {
    console.error('❌ Error in createOrGetWieChat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create or get chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const getWieUserChats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    const { page = 1, limit = 40 } = req.query;

    const chats = await WieChat.find({
      participants: userIdStr,
      isActive: true,
      $or: [
        { deletedFor: { $ne: userIdStr } },
        { deletedFor: { $exists: false } },
        { deletedFor: [] }
      ]
    })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const { isUserOnline } = await import('../socket/wieSocket.js');

    const chatsWithParticipants = await Promise.all(
      chats.map(async (chat) => {
        try {
          const otherParticipantId = chat.participants.find(id => id !== userIdStr);

          if (!otherParticipantId) {
            return null;
          }

          let participant = null;
          try {
            participant = await getWieUserById(otherParticipantId);
          } catch (error) {
            participant = {
              id: otherParticipantId,
              name: 'Unknown User',
              profile_picture: null
            };
          }

          const participantIsOnline = isUserOnline(otherParticipantId);

          let filteredMessages = chat.messages || [];

          if (chat.clearedBy && chat.clearedBy.length > 0) {
            const userClearRecord = chat.clearedBy.find(item => item.user === userIdStr);

            if (userClearRecord) {
              const clearTime = new Date(userClearRecord.clearedAt);
              filteredMessages = chat.messages.filter(
                msg => new Date(msg.createdAt || msg.timestamp) > clearTime
              );
            }
          }

          filteredMessages = filteredMessages.filter(msg => {
            if (msg.deletedForEveryone) return false;
            if (msg.deletedFor && msg.deletedFor.includes(userIdStr)) return false;
            return true;
          });

          const unreadCount = filteredMessages.filter(
            msg =>
              msg.sender !== userIdStr &&
              !msg.readBy?.some(id => id === userIdStr)
          ).length;

          let chatType = chat.type || 'direct';
          let chatStatus = chat.status || 'accepted';
          if (chatType === 'request' && chatStatus === 'pending') {
            // Keep as request for both sender and receiver
            chatType = 'request';
            chatStatus = 'pending';
          }
          // If chat is type='request' and status='pending', check who sent the first message
          if (chatType === 'request' && chatStatus === 'pending') {
            const firstMessage = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;
            
            if (firstMessage) {
              const firstMessageSender = firstMessage.sender;
              if (firstMessageSender === userIdStr) {
                chatType = 'direct';
                chatStatus = 'accepted';
              } 
            }
          }

          return {
            _id: chat._id,
            participant: participant ? {
              _id: participant.id,
              name: participant.name,
              username: participant.username || '',
              email: participant.email || '',
              contact_no: participant.contact_no || '',
              profile_picture: participant.profile_picture || null,
              bio: participant.bio || '',
              is_verified: participant.is_verified || false,
              isOnline: participantIsOnline,
              last_seen_at: participant.last_seen_at || null,
            } : null,
            lastMessage: chat.lastMessage || null,
            type: chatType, // ✅ Use determined type
            status: chatStatus, // ✅ Use determined status
            unreadCount: unreadCount,
            updatedAt: chat.updatedAt,
            isBlocked: false,
            isBlockedBy: undefined
          };
        } catch (error) {
          console.error('Error processing chat:', error);
          return null;
        }
      })
    );

    const validChats = chatsWithParticipants.filter(chat => chat !== null);

    res.status(200).json({
      success: true,
      chats: validChats,
      page: parseInt(page),
      totalPages: Math.ceil(validChats.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getWieUserChats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats'
    });
  }
};
export const sendWieMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    if (!chatId || !content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and message content are required'
      });
    }

    const chat = await WieChat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.some(id => id === userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    
    const otherUserId = chat.participants.find(id => id !== userIdStr);
    const blocked = await isBlocked(userIdStr, otherUserId);
    
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send message. User has been blocked.'
      });
    }
    let messageType = 'text';
    let voiceData = null;
    let messageContent = content.trim();
    if (messageContent.startsWith('{') && messageContent.includes('"type":"voice"')) {
      try {
        const parsed = JSON.parse(messageContent);
        const durationValue = Number(parsed.duration);
        const hasValidDuration = !isNaN(durationValue) && 
                                isFinite(durationValue) && 
                                durationValue > 0;
        
        if (parsed.type === 'voice' && parsed.audio && hasValidDuration) {
          messageType = 'voice';
          
          // ✅ CRITICAL: Ensure audio is a complete data URI
          let audioData = parsed.audio;
          
          // Verify it starts with data:
          if (!audioData.startsWith('data:')) {
            console.error('❌ Backend - Audio missing data URI prefix!');
            const mimeType = parsed.mimeType || 'audio/webm;codecs=opus';
            audioData = `data:${mimeType};base64,${audioData}`;
          }
          voiceData = {
            audioBase64: audioData,
            duration: durationValue,
            mimeType: parsed.mimeType || 'audio/webm;codecs=opus'
          };
          
          messageContent = '🎤 Voice message';
        }
      } catch (e) {
        console.error('❌ Backend - Failed to parse voice message:', e);
      }
    }
    // Get sender info
    let senderInfo = null;
    try {
      senderInfo = await getWieUserById(userIdStr);
    } catch (error) {
      senderInfo = { 
        id: userIdStr,
        name: 'Someone', 
        profile_picture: null 
      };
    }

    const receiverId = chat.participants.find(id => id !== userIdStr);

    // Get receiver info
    let receiverInfo = null;
    try {
      receiverInfo = await getWieUserById(receiverId);
    } catch (error) {
      receiverInfo = { 
        id: receiverId,
        name: 'Someone', 
        profile_picture: null 
      };
    }

    const { isUserOnline } = await import('../socket/wieSocket.js');
    const senderIsOnline = isUserOnline(userIdStr);
    const receiverOnline = isUserOnline(receiverId);
    
    let receiverViewingChat = false;
    
    if (receiverOnline) {
      const io = getIO();
      const sockets = io.sockets.sockets;
      
      for (const [socketId, socket] of sockets) {
        if (socket.userId === receiverId) {
          const isInChatRoom = socket.rooms.has(chatId.toString());          
          if (isInChatRoom) {
            receiverViewingChat = true;
            break;
          }
        }
      }
    }
    const messageObj = {
      sender: userIdStr,
      content: messageContent,
      messageType: messageType,  // ✅ Explicitly set this
      readBy: receiverViewingChat ? [userIdStr, receiverId] : [userIdStr], 
      isRead: receiverViewingChat,
      deliveredTo: receiverOnline ? [receiverId] : [],
      timestamp: new Date()
    };
    if (messageType === 'voice' && voiceData && voiceData.duration > 0) {
      messageObj.voiceData = voiceData;
    } 
    chat.messages.push(messageObj);
    chat.lastMessage = {
      content: messageContent,
      sender: userIdStr,
      timestamp: new Date()
    };

    if (chat.deletedFor && chat.deletedFor.length > 0) {
      chat.deletedFor = chat.deletedFor.filter(id => id !== receiverId);
    }

    chat.updatedAt = new Date();
    await chat.save();
    const savedMessage = chat.messages[chat.messages.length - 1];
    const isFirstMessage = chat.messages.length === 1;

    let receiverUnreadCount = 0;
    
    if (!receiverViewingChat) {
      let filteredMessages = chat.messages;
      
      if (chat.clearedBy && chat.clearedBy.length > 0) {
        const receiverClearRecord = chat.clearedBy.find(item => item.user === receiverId);
        
        if (receiverClearRecord) {
          const clearTime = new Date(receiverClearRecord.clearedAt);
          filteredMessages = chat.messages.filter(msg => 
            new Date(msg.createdAt || msg.timestamp) > clearTime
          );
        }
      }
      
      receiverUnreadCount = filteredMessages.filter(
        msg => 
          msg.sender !== receiverId && 
          !msg.readBy?.some(id => id === receiverId)
      ).length;
    }
    const messageDataForSender = {
      _id: savedMessage._id.toString(),
      content: savedMessage.content,
      messageType: savedMessage.messageType,
      sender: userIdStr,
      timestamp: savedMessage.timestamp,
      createdAt: savedMessage.timestamp,
      readBy: savedMessage.readBy,
      deliveredTo: savedMessage.deliveredTo || [],
      isRead: savedMessage.isRead,
      isSender: true,
      receiverOnline
    };

    if (savedMessage.voiceData && savedMessage.messageType === 'voice') {
      messageDataForSender.voiceData = {
        audioBase64: savedMessage.voiceData.audioBase64,
        duration: savedMessage.voiceData.duration,
        mimeType: savedMessage.voiceData.mimeType
      };
    }
    // Send HTTP response first
    res.status(201).json({
      success: true,
      message: messageDataForSender,
      chatId: chat._id,
      chat: {
        _id: chat._id,
        participant: receiverInfo ? {
          _id: receiverInfo.id,
          name: receiverInfo.name,
          username: receiverInfo.username || '',
          contact_no: receiverInfo.contact_no || '',
          email: receiverInfo.email || '',
          profile_picture: receiverInfo.profile_picture || null,
          bio: receiverInfo.bio || null,
          is_verified: receiverInfo.is_verified || false,
          isOnline: receiverOnline,
          last_seen_at: receiverInfo.last_seen_at || null
        } : null,
        type: 'direct', 
        status: 'accepted',
        lastMessage: {
          content: messageContent,
          sender: userIdStr,
          timestamp: new Date()
        }
      }
    });
    // Handle socket emissions after response
    setImmediate(() => {
      try {
        const io = getIO();
        
        // ✅ Build message data for socket with all fields
        const messageData = {
          _id: savedMessage._id.toString(),
          sender: userIdStr,
          content: savedMessage.content,
          messageType: savedMessage.messageType,
          timestamp: savedMessage.timestamp,
          createdAt: savedMessage.timestamp,
          readBy: savedMessage.readBy || [],
          deliveredTo: savedMessage.deliveredTo || [],
          isRead: savedMessage.isRead || false
        };

        // ✅ Add voiceData if exists
        if (savedMessage.voiceData) {
          messageData.voiceData = {
            audioBase64: savedMessage.voiceData.audioBase64,
            duration: savedMessage.voiceData.duration,
            mimeType: savedMessage.voiceData.mimeType
          };
        }

        // Emit to chat room
        io.to(chatId.toString()).emit('new-message', {
          chatId: chatId.toString(),
          message: messageData,
          sender: userIdStr,
          timestamp: new Date(),
          autoRead: receiverViewingChat
        });

        // ✅ CRITICAL: Determine who is the requester (first message sender)
        let requester = null;
        if (chat.type === 'request' && chat.status === 'pending' && chat.messages.length > 0) {
          requester = chat.messages[0].sender; // First message sender is the requester
        }

        // ✅ For RECEIVER: Determine type/status based on whether they're the requester
        const receiverType = (chat.type === 'request' && chat.status === 'pending' && requester !== receiverId) 
          ? 'request'  // Receiver is NOT the requester -> show as request
          : 'direct';  // Receiver IS the requester -> show as direct

        const receiverStatus = (chat.type === 'request' && chat.status === 'pending' && requester !== receiverId)
          ? 'pending'  // Receiver is NOT the requester -> show as pending
          : 'accepted'; // Receiver IS the requester -> show as accepted

        const notificationData = {
          chatId: chatId.toString(),
          message: messageData,
          lastMessage: {
            content: messageContent,
            sender: userIdStr,
            timestamp: new Date(),
            readBy: savedMessage.readBy,
            isRead: savedMessage.isRead
          },
          participant: {
            _id: senderInfo?.id || userIdStr,
            name: senderInfo?.name || 'Someone',
            username: senderInfo?.username || '',
            contact_no: senderInfo?.contact_no || '',
            email: senderInfo?.email || '',
            profile_picture: senderInfo?.profile_picture || null,
            bio: senderInfo?.bio || null,
            is_verified: senderInfo?.is_verified || false,
            isOnline: senderIsOnline,
            last_seen_at: senderIsOnline ? new Date().toISOString() : (senderInfo?.last_seen_at || null),
            lastSeen: senderIsOnline ? new Date().toISOString() : (senderInfo?.last_seen_at || null)
          },
          type: receiverType, // ✅ Use calculated type for receiver
          status: receiverStatus, // ✅ Use calculated status for receiver
          unreadCount: receiverUnreadCount,
          timestamp: new Date(),
          isFirstMessage: isFirstMessage,
          autoRead: receiverViewingChat
        };
        
        io.to(receiverId).emit('new-message-notification', notificationData);
        
        // ✅ Only emit new-message-request if this is truly a new request for the receiver
        if (receiverType === 'request' && receiverStatus === 'pending' && isFirstMessage) {
          io.to(receiverId).emit('new-message-request', {
            ...notificationData,
            isNewRequest: true
          });
        }
        
        io.to(receiverId).emit('chat-unread-update', {
          chatId: chatId.toString(),
          unreadCount: receiverUnreadCount 
        });

        // Update RECEIVER's chat list
        io.to(receiverId).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: {
            content: messageContent,
            sender: userIdStr,
            timestamp: new Date(),
            readBy: savedMessage.readBy,
            isRead: savedMessage.isRead
          },
          participant: {
            _id: senderInfo?.id || userIdStr,
            name: senderInfo?.name || 'Someone',
            username: senderInfo?.username || '',
            contact_no: senderInfo?.contact_no || '',
            email: senderInfo?.email || '',
            profile_picture: senderInfo?.profile_picture || null,
            bio: senderInfo?.bio || null,
            is_verified: senderInfo?.is_verified || false,
            isOnline: senderIsOnline,
            last_seen_at: senderIsOnline ? new Date().toISOString() : (senderInfo?.last_seen_at || null)
          },
          type: receiverType, // ✅ Use calculated type
          status: receiverStatus, // ✅ Use calculated status
          unreadCount: receiverUnreadCount,
          isFirstMessage: isFirstMessage
        });
        
        // ✅ Emit request count update only if receiver sees this as a request
        if (receiverType === 'request' && receiverStatus === 'pending') {
          io.to(receiverId).emit('request-count-update', {
            chatId: chatId.toString(),
            unreadCount: receiverUnreadCount,
            timestamp: new Date()
          });
        }

        // ✅ For SENDER: Determine type/status based on whether they're the requester
        const senderType = (chat.type === 'request' && chat.status === 'pending' && requester !== userIdStr)
          ? 'request'  // Sender is NOT the requester -> show as request
          : 'direct';  // Sender IS the requester -> show as direct

        const senderStatus = (chat.type === 'request' && chat.status === 'pending' && requester !== userIdStr)
          ? 'pending'  // Sender is NOT the requester -> show as pending
          : 'accepted'; // Sender IS the requester -> show as accepted

        // ✅ Update SENDER's chat list
        io.to(userIdStr).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: {
            content: messageContent,
            sender: userIdStr,
            timestamp: new Date(),
            readBy: savedMessage.readBy,
            isRead: savedMessage.isRead
          },
          participant: {
            _id: receiverInfo?.id || receiverId,
            name: receiverInfo?.name || 'Someone',
            username: receiverInfo?.username || '',
            contact_no: receiverInfo?.contact_no || '',
            email: receiverInfo?.email || '',
            profile_picture: receiverInfo?.profile_picture || null,
            bio: receiverInfo?.bio || null,
            is_verified: receiverInfo?.is_verified || false,
            isOnline: receiverInfo?.isOnline ?? false,
            last_seen_at: receiverInfo?.last_seen_at || null
          },
          type: senderType, // ✅ Use calculated type for sender
          status: senderStatus, // ✅ Use calculated status for sender
          unreadCount: 0,
          isFirstMessage: isFirstMessage,
          isSender: true
        });

        // Send new message to sender's socket
        io.to(userIdStr).emit('new-message', {
          chatId: chatId.toString(),
          message: messageDataForSender,
          sender: userIdStr,
          timestamp: new Date(),
          autoRead: false
        });

      } catch (socketError) {
        console.error('Socket emit failed:', socketError.message);
      }
    });
  } catch (error) {
    console.error('Error in sendWieMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};
export const getWieChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    const { page = 1, limit = 50 } = req.query;
    
    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.some(id => id === userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    const otherParticipantId = chat.participants.find(id => id !== userIdStr);
    let participant = null;
    let finalIsOnline = false;
    let lastSeenAt = null;
    
    try {
      const socketStatus = getUserOnlineStat(otherParticipantId);
      const isSocketOnline = socketStatus.isOnline;
      
      participant = await getWieUserById(otherParticipantId);
      
      if (participant) {
        if (isSocketOnline) {
          finalIsOnline = true;
          lastSeenAt = new Date().toISOString();
        } else {
          finalIsOnline = false;
          lastSeenAt = participant.last_seen_at;
        }
      }
    } catch (error) {
      console.error('Error fetching participant:', error);
    }

    let filteredMessages = chat.messages;

    if (chat.clearedBy && chat.clearedBy.length > 0) {
      const userClearRecord = chat.clearedBy.find(item => item.user === userIdStr);
      
      if (userClearRecord) {
        filteredMessages = chat.messages.filter(
          msg => new Date(msg.createdAt || msg.timestamp) > new Date(userClearRecord.clearedAt)
        );
      }
    }

    filteredMessages = filteredMessages.filter(msg => {
      if (msg.deletedForEveryone) return false;
      if (msg.deletedFor && msg.deletedFor.includes(userIdStr)) return false;
      return true;
    });

    const totalMessages = filteredMessages.length;
    const startIndex = Math.max(0, totalMessages - (parseInt(page) * parseInt(limit)));
    const endIndex = totalMessages - ((parseInt(page) - 1) * parseInt(limit));
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    const RICH_FIELDS = [
      'chat_images', 'chat_videos', 'chat_audio', 'chat_files',
      'stickerData', 'voiceData', 'locationData', 'contactData',
      'profileData', 'eventData'
    ];

    const messagesWithAllFields = paginatedMessages.map(msg => {
      const messageData = {
        _id:                msg._id,
        sender:             msg.sender,
        content:            msg.content,
        messageType:        msg.messageType || 'text',
        timestamp:          msg.timestamp   || msg.createdAt,
        createdAt:          msg.createdAt   || msg.timestamp,
        readBy:             msg.readBy      || [],
        isRead:             msg.isRead      || false,
        deliveredTo:        msg.deliveredTo || [],
        deletedForEveryone: msg.deletedForEveryone || false
      };

      // ✅ Carry ALL rich-media fields so the frontend renderer gets real URLs
      RICH_FIELDS.forEach(field => {
        if (msg[field] != null) messageData[field] = msg[field];
      });

      return messageData;
    });

    // ✅ CRITICAL: Determine type/status based on who is viewing
    let chatType = chat.type || 'direct';
    let chatStatus = chat.status || 'accepted';
    let isReceiverOfRequest = false;

    if (chatType === 'request' && chatStatus === 'pending') {
      const firstMessage = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;
      
      if (firstMessage) {
        const firstMessageSender = firstMessage.sender;
        
        // If current user sent the first message, they see it as 'direct'/'accepted'
        if (firstMessageSender === userIdStr) {
          chatType = 'direct';
          chatStatus = 'accepted';
        } else {
          // ✅ Current user is the RECEIVER
          isReceiverOfRequest = true;
        }
      }
    }
    // ✅ CRITICAL: Check if there are ACTUALLY unread messages BEFORE marking
    let shouldEmitEvents = false;
    if (isReceiverOfRequest) {
      setImmediate(async () => {
        try {
          const io = getIO();          
          io.to(userIdStr).emit('request-messages-read', {
            chatId: chatId.toString(),
            timestamp: new Date()
          });

          io.to(userIdStr).emit('request-count-update', {
            chatId: chatId.toString(),
            unreadCount: 0,
            timestamp: new Date()
          });

          io.to(userIdStr).emit('chat-unread-update', {
            chatId: chatId.toString(),
            unreadCount: 0,
            timestamp: new Date()
          });

          try {
            const participantInfo = await getWieUserById(otherParticipantId);
            
            io.to(userIdStr).emit('chat-list-update', {
              chatId: chatId.toString(),
              lastMessage: chat.lastMessage,
              participant: participantInfo ? {
                _id: participantInfo.id,
                name: participantInfo.name,
                username: participantInfo.username || '',
                contact_no: participantInfo.contact_no || '',
                email: participantInfo.email || '',
                profile_picture: participantInfo.profile_picture || null,
                bio: participantInfo.bio || null,
                is_verified: participantInfo.is_verified || false,
                isOnline: participantInfo.isOnline ?? false,
                last_seen_at: participantInfo.last_seen_at || null
              } : null,
              type: chatType,
              status: chatStatus,
              unreadCount: 0,
              timestamp: new Date()
            });

          } catch (err) {
            console.error('❌ Failed to get participant info:', err);
          }

        } catch (socketError) {
          console.error('❌ Socket emit failed:', socketError);
        }
      });
    }

    // ✅ Send HTTP response FIRST
    const response = {
      success: true,
      chat: {
        _id: chat._id,
        type: chatType,
        status: chatStatus,
        participant: participant ? {
          _id: participant.id,
          name: participant.name,
          email: participant.email,
          profile_picture: participant.profile_picture,
          bio: participant.bio,
          is_verified: participant.is_verified,
          isOnline: finalIsOnline,
          last_seen_at: lastSeenAt,
          lastSeenFormatted: !finalIsOnline && lastSeenAt 
            ? formatLastSeen(lastSeenAt) 
            : null
        } : null
      },
      messages: messagesWithAllFields,
      totalMessages,
      page: parseInt(page),
      pages: Math.ceil(totalMessages / parseInt(limit)),
      hasMore: startIndex > 0
    };
    
    res.status(200).json(response);

    // ✅ ONLY emit events if we actually marked messages as read
    if (shouldEmitEvents) {
      setImmediate(async () => {
        try {
          const io = getIO();          
          io.to(userIdStr).emit('request-messages-read', {
            chatId: chatId.toString(),
            timestamp: new Date()
          });

          io.to(userIdStr).emit('request-count-update', {
            chatId: chatId.toString(),
            unreadCount: 0,
            timestamp: new Date()
          });

          io.to(userIdStr).emit('chat-unread-update', {
            chatId: chatId.toString(),
            unreadCount: 0,
            timestamp: new Date()
          });

          try {
            const participantInfo = await getWieUserById(otherParticipantId);
            
            io.to(userIdStr).emit('chat-list-update', {
              chatId: chatId.toString(),
              lastMessage: chat.lastMessage,
              participant: participantInfo ? {
                _id: participantInfo.id,
                name: participantInfo.name,
                username: participantInfo.username || '',
                contact_no: participantInfo.contact_no || '',
                email: participantInfo.email || '',
                profile_picture: participantInfo.profile_picture || null,
                bio: participantInfo.bio || null,
                is_verified: participantInfo.is_verified || false,
                isOnline: participantInfo.isOnline ?? false,
                last_seen_at: participantInfo.last_seen_at || null
              } : null,
              type: chatType,
              status: chatStatus,
              unreadCount: 0, 
              timestamp: new Date()
            });

          } catch (err) {
            console.error('❌ Failed to get participant info:', err);
          }

        } catch (socketError) {
          console.error('❌ Socket emit failed:', socketError);
        }
      });
    }

  } catch (error) {
    console.error('Error in getWieChatMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};
export const getChatDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { chatId } = req.params;

    const chat = await WieChat.findOne({
      _id: chatId,
      participants: userId.toString(),
      isActive: true
    }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Get the other participant
    const otherParticipantId = chat.participants.find(id => id !== userId.toString());
    
    // Check block status
    const iBlockedThem = await isBlocked(userId.toString(), otherParticipantId);
    const theyBlockedMe = await isBlocked(otherParticipantId, userId.toString());

    res.status(200).json({
      success: true,
      chat: {
        ...chat,
        isBlocked: iBlockedThem || theyBlockedMe,
        isBlockedBy: iBlockedThem ? 'you' : theyBlockedMe ? 'them' : undefined
      }
    });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat details'
    });
  }
};
export const deleteWieMessage = async (req, res) => {
try {
const { chatId, messageId } = req.params;
const userId = req.user._id || req.user.id;
const chat = await WieChat.findById(chatId);
if (!chat) {
  return res.status(404).json({
    success: false,
    message: 'Chat not found'
  });
}

if (!chat.participants.some(id => id === userId.toString())) {
  return res.status(403).json({
    success: false,
    message: 'You are not a participant in this chat'
  });
}

const messageIndex = chat.messages.findIndex(msg => msg._id.toString() === messageId);

if (messageIndex === -1) {
  return res.status(404).json({
    success: false,
    message: 'Message not found'
  });
}

const message = chat.messages[messageIndex];

if (message.sender !== userId.toString()) {
  return res.status(403).json({
    success: false,
    message: 'You can only delete your own messages'
  });
}

chat.messages.splice(messageIndex, 1);

if (chat.messages.length > 0) {
  const lastMsg = chat.messages[chat.messages.length - 1];
  chat.lastMessage = {
    content: lastMsg.content,
    sender: lastMsg.sender,
    timestamp: lastMsg.timestamp
  };
} else {
  chat.lastMessage = null;
}

await chat.save();

try {
  const io = getIO();
  io.to(chatId.toString()).emit('message-deleted', {
    chatId: chatId.toString(),
    messageId: messageId,
    deletedBy: userId.toString(),
    lastMessage: chat.lastMessage
  });
} catch (socketError) {
  // Silent fail
}

res.status(200).json({
  success: true,
  message: 'Message deleted successfully',
  lastMessage: chat.lastMessage
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Failed to delete message'
});
}
};
export const deleteWieChat = async (req, res) => {
try {
const { chatId } = req.params;
const userId = req.user._id || req.user.id;
const chat = await WieChat.findById(chatId);
if (!chat) {
  return res.status(404).json({
    success: false,
    message: 'Chat not found'
  });
}

if (!chat.participants.some(id => id === userId.toString())) {
  return res.status(403).json({
    success: false,
    message: 'You are not a participant in this chat'
  });
}

if (!chat.deletedFor.some(id => id === userId.toString())) {
  chat.deletedFor.push(userId.toString());
}

if (chat.deletedFor.length === chat.participants.length) {
  await WieChat.deleteOne({ _id: chatId });
  
  try {
    const io = getIO();
    chat.participants.forEach(participantId => {
      io.to(participantId).emit('chat-deleted', {
        chatId: chatId.toString(),
        deletedBy: userId.toString(),
        permanent: true
      });
    });
  } catch (socketError) {
    // Silent fail
  }
} else {
  await chat.save();
  
  try {
    const io = getIO();
    io.to(userId.toString()).emit('chat-deleted', {
      chatId: chatId.toString(),
      deletedBy: userId.toString(),
      permanent: false
    });
  } catch (socketError) {
    // Silent fail
  }
}
res.status(200).json({
  success: true,
  message: 'Chat deleted successfully'
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Failed to delete chat'
});
}
};
export const acceptMessageRequest = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (chat.participants[1] !== userIdStr) {
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can accept'
      });
    }

    if (chat.type !== 'request' || chat.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Not a pending request'
      });
    }

    // ✅ CRITICAL: Clear unread messages BEFORE accepting
    const unreadMessageIds = [];
    let updated = false;

    chat.messages.forEach(msg => {
      if (msg.sender !== userIdStr && !msg.readBy.includes(userIdStr)) {
        if (!msg.readBy) {
          msg.readBy = [];
        }
        msg.readBy.push(userIdStr);
        msg.isRead = true;
        unreadMessageIds.push(msg._id.toString());
        updated = true;
      }
    });

    // Update chat status
    chat.status = 'accepted';
    chat.type = 'direct'; // ✅ Change to direct chat
    chat.acceptedBy = userIdStr;
    chat.acceptedAt = new Date();
    
    if (updated) {
      chat.markModified('messages');
    }
    
    await chat.save();

    // ✅ Send response first
    res.status(200).json({
      success: true,
      message: 'Message request accepted'
    });

    // ✅ Emit socket events after response
    setImmediate(async () => {
      try {
        const io = getIO();
        const otherParticipant = chat.participants.find(p => p !== userIdStr);

        // 1. Clear request count for accepter
        io.to(userIdStr).emit('request-messages-read', {
          chatId: chatId.toString(),
          timestamp: new Date()
        });

        io.to(userIdStr).emit('request-count-update', {
          chatId: chatId.toString(),
          unreadCount: 0,
          timestamp: new Date()
        });

        io.to(userIdStr).emit('chat-unread-update', {
          chatId: chatId.toString(),
          unreadCount: 0,
          timestamp: new Date()
        });

        // 2. Notify sender that messages were read
        if (otherParticipant && unreadMessageIds.length > 0) {
          io.to(otherParticipant).emit('messages-read', {
            chatId: chatId.toString(),
            userId: userIdStr,
            messageIds: unreadMessageIds,
            readBy: userIdStr,
            timestamp: new Date()
          });
        }

        // 3. Update chat status for both users
        const participantInfo = await getWieUserById(otherParticipant);
        const accepterInfo = await getWieUserById(userIdStr);

        // For accepter (receiver) - now shows as direct/accepted
        io.to(userIdStr).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: chat.lastMessage,
          participant: participantInfo ? {
            _id: participantInfo.id,
            name: participantInfo.name,
            username: participantInfo.username || '',
            contact_no: participantInfo.contact_no || '',
            email: participantInfo.email || '',
            profile_picture: participantInfo.profile_picture || null,
            bio: participantInfo.bio || null,
            is_verified: participantInfo.is_verified || false,
            isOnline: participantInfo.isOnline ?? false,
            last_seen_at: participantInfo.last_seen_at || null
          } : null,
          type: 'direct', // ✅ Changed to direct
          status: 'accepted',
          unreadCount: 0,
          timestamp: new Date()
        });

        // For sender - already sees as direct/accepted
        io.to(otherParticipant).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: chat.lastMessage,
          participant: accepterInfo ? {
            _id: accepterInfo.id,
            name: accepterInfo.name,
            username: accepterInfo.username || '',
            contact_no: accepterInfo.contact_no || '',
            email: accepterInfo.email || '',
            profile_picture: accepterInfo.profile_picture || null,
            bio: accepterInfo.bio || null,
            is_verified: accepterInfo.is_verified || false,
            isOnline: accepterInfo.isOnline ?? false,
            last_seen_at: accepterInfo.last_seen_at || null
          } : null,
          type: 'direct',
          status: 'accepted',
          unreadCount: 0,
          timestamp: new Date()
        });

      } catch (socketError) {
        console.error('❌ Socket emit failed in acceptMessageRequest:', socketError);
      }
    });

  } catch (error) {
    console.error('❌ Accept request error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to accept request'
      });
    }
  }
};
export const declineMessageRequest = async (req, res) => {
try {
const { chatId } = req.params;
const userId = req.user._id || req.user.id;
const chat = await WieChat.findById(chatId);

if (!chat) {
  return res.status(404).json({
    success: false,
    message: 'Chat not found'
  });
}

if (chat.participants[1] !== userId.toString()) {
  return res.status(403).json({
    success: false,
    message: 'Only the recipient can decline'
  });
}

if (chat.type !== 'request' || chat.status !== 'pending') {
  return res.status(400).json({
    success: false,
    message: 'Not a pending request'
  });
}

await WieChat.deleteOne({ _id: chatId });

res.status(200).json({
  success: true,
  message: 'Message request declined'
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Failed to decline request'
});
}
};
export const clearWieChatMessages = async (req, res) => {
try {
const { chatId } = req.params;
const userId = req.user._id || req.user.id;
const chat = await WieChat.findById(chatId);
if (!chat) {
  return res.status(404).json({
    success: false,
    message: 'Chat not found'
  });
}

if (!chat.participants.some(id => id === userId.toString())) {
  return res.status(403).json({
    success: false,
    message: 'You are not a participant in this chat'
  });
}

if (!chat.clearedBy) {
  chat.clearedBy = [];
}

chat.clearedBy = chat.clearedBy.filter(item => item.user !== userId.toString());

chat.clearedBy.push({
  user: userId.toString(),
  clearedAt: new Date()
});

await chat.save();

try {
  const io = getIO();
  const userSockets = await io.in(chatId.toString()).fetchSockets();
  for (const socket of userSockets) {
    if (socket.data?.userId === userId.toString()) {
      socket.emit('chat-cleared', {
        chatId: chatId.toString(),
        clearedBy: userId.toString()
      });
    }
  }
} catch (socketError) {
  // Silent fail
}

res.status(200).json({
  success: true,
  message: 'Chat cleared successfully'
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Failed to clear chat'
});
}
};
export const getUnreadMessageCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    // Find all active chats for this user
    const chats = await WieChat.find({
      participants: userIdStr,
      isActive: true,
      deletedFor: { $ne: userIdStr }
    }).lean();

    // Count how many chats have unread messages (not total message count)
    let usersWithUnreadMessages = 0;

    for (const chat of chats) {
      let filteredMessages = chat.messages || [];
      
      // Apply cleared filter if exists
      if (chat.clearedBy && chat.clearedBy.length > 0) {
        const userClearRecord = chat.clearedBy.find(item => item.user === userIdStr);
        
        if (userClearRecord) {
          const clearTime = new Date(userClearRecord.clearedAt);
          filteredMessages = chat.messages.filter(msg => 
            new Date(msg.createdAt || msg.timestamp) > clearTime
          );
        }
      }

      // Check if this chat has ANY unread message from the other user
      const hasUnreadMessages = filteredMessages.some(
        msg => 
          msg.sender !== userIdStr && // Message is not from me
          !msg.readBy?.some(id => id === userIdStr) // I haven't read it
      );
      // If this chat has at least one unread message, count this user
      if (hasUnreadMessages) {
        usersWithUnreadMessages++;
      }
    }
    res.status(200).json({
      success: true,
      unreadCount: usersWithUnreadMessages 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get unread message count'
    });
  }
};
export const markWieMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // ✅ Find all unread messages from other participant
    const unreadMessageIds = [];
    let updated = false;

    chat.messages.forEach(msg => {
      if (msg.sender !== userIdStr && !msg.readBy.includes(userIdStr)) {
        // ✅ Add user to readBy array
        if (!msg.readBy) {
          msg.readBy = [];
        }
        msg.readBy.push(userIdStr);
        msg.isRead = true;
        unreadMessageIds.push(msg._id.toString());
        updated = true;
      }
    });

    // ✅ Save changes if any updates were made
    if (updated) {
      chat.markModified('messages');
      await chat.save();
    }

    // ✅ Get other participant
    const otherParticipant = chat.participants.find(p => p !== userIdStr);

    // ✅ Send HTTP response FIRST
    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      markedCount: unreadMessageIds.length
    });
    // ✅ Handle socket emissions AFTER response (non-blocking)
    setImmediate(async () => {
      try {
        const io = getIO();
        
        // ✅ 1. Emit to OTHER PARTICIPANT (sender) that their messages were read
        if (otherParticipant && unreadMessageIds.length > 0) {
          io.to(otherParticipant).emit('messages-read', {
            chatId: chatId.toString(),
            userId: userIdStr,
            messageIds: unreadMessageIds,
            readBy: userIdStr,
            timestamp: new Date()
          });
        }
        
        // ✅ 2. Emit to CURRENT USER (reader) to update their unread count
        io.to(userIdStr).emit('chat-unread-update', {
          chatId: chatId.toString(),
          unreadCount: 0,
          timestamp: new Date()
        });

        // ✅ 3. If this is a REQUEST chat, emit ALL events IMMEDIATELY
        if (chat.type === 'request' && chat.status === 'pending') {          
          // Emit to current user (reader) - CRITICAL ORDER
          io.to(userIdStr).emit('request-messages-read', {
            chatId: chatId.toString(),
            timestamp: new Date()
          });

          io.to(userIdStr).emit('request-count-update', {
            chatId: chatId.toString(),
            unreadCount: 0,
            timestamp: new Date()
          });
          
          io.to(userIdStr).emit('chat-unread-update', {
            chatId: chatId.toString(),
            unreadCount: 0,
            timestamp: new Date()
          });
        }

        // ✅ 4. Update the reader's chat list to show 0 count
        if (otherParticipant) {
          try {
            const participantInfo = await getWieUserById(otherParticipant);
            
            io.to(userIdStr).emit('chat-list-update', {
              chatId: chatId.toString(),
              lastMessage: chat.lastMessage,
              participant: participantInfo ? {
                _id: participantInfo.id,
                name: participantInfo.name,
                username: participantInfo.username || '',
                contact_no: participantInfo.contact_no || '',
                email: participantInfo.email || '',
                profile_picture: participantInfo.profile_picture || null,
                bio: participantInfo.bio || null,
                is_verified: participantInfo.is_verified || false,
                isOnline: participantInfo.isOnline ?? false,
                last_seen_at: participantInfo.last_seen_at || null
              } : null,
              type: chat.type || 'direct',
              status: chat.status || 'accepted',
              unreadCount: 0, // ✅ Set to 0 since messages are now read
              timestamp: new Date()
            });
          } catch (err) {
            console.error('❌ Failed to get participant info:', err);
          }
        }

      } catch (socketError) {
        console.error('❌ Socket emit failed in markWieMessagesAsRead:', socketError);
      }
    });

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    
    // Only send response if not already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read'
      });
    }
  }
};
// Mark messages as unread
export const markWieMessagesAsUnread = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // Mark last message from other participant as unread
    const lastUnreadMsg = [...chat.messages]
      .reverse()
      .find(msg => msg.sender !== userIdStr);

    if (lastUnreadMsg && lastUnreadMsg.readBy.includes(userIdStr)) {
      lastUnreadMsg.readBy = lastUnreadMsg.readBy.filter(id => id !== userIdStr);
      lastUnreadMsg.isRead = false;
      await chat.save();
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as unread'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as unread'
    });
  }
};
export const getMessageRequests = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    const requests = await WieChat.find({
      participants: userIdStr,
      type: 'request',
      status: 'pending',
      'participants.1': userIdStr, // User is the recipient
      isActive: true,
      // IMPORTANT: Only return requests that have messages
      $or: [
        { 'messages.0': { $exists: true } },
        { lastMessage: { $exists: true, $ne: null } }
      ]
    })
      .sort({ updatedAt: -1 })
      .lean();

    const senderIds = requests.map(req => req.participants[0]);
    const senders = await getWieUsersByIds(senderIds);
    const senderMap = new Map(senders.map(s => [s.id, s]));

    const requestsWithDetails = requests.map(request => {
      const sender = senderMap.get(request.participants[0]);
      
      // ✅ CRITICAL: Calculate UNREAD message count from OTHER USER only
      let filteredMessages = request.messages || [];
      
      // Apply cleared filter if exists
      if (request.clearedBy && request.clearedBy.length > 0) {
        const userClearRecord = request.clearedBy.find(item => item.user === userIdStr);
        
        if (userClearRecord) {
          const clearTime = new Date(userClearRecord.clearedAt);
          filteredMessages = request.messages.filter(msg => 
            new Date(msg.createdAt || msg.timestamp) > clearTime
          );
        }
      }
      
      // ✅ Count ONLY unread messages from the OTHER USER (sender)
      const unreadCount = filteredMessages.filter(
        msg => 
          msg.sender !== userIdStr && // Message is from OTHER user
          !msg.readBy?.some(id => id === userIdStr) // I haven't read it
      ).length;
      
      return {
        _id: request._id,
        participant: sender ? {
          _id: sender.id,
          name: sender.name,
          username: sender.username,
          contact_no: sender.contact_no,
          email: sender.email,
          profile_picture: sender.profile_picture,
          bio: sender.bio,
          is_verified: sender.is_verified
        } : null,
        lastMessage: request.lastMessage,
        type: request.type,
        status: request.status,
        updatedAt: request.updatedAt,
        unreadCount: unreadCount // ✅ Return actual unread count, not total messages
      };
    });

    res.status(200).json({
      success: true,
      requests: requestsWithDetails
    });
  } catch (error) {
    console.error('❌ Error in getMessageRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get message requests'
    });
  }
};
// Delete messages for user (For Me)
export const deleteMessagesForMe = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs are required'
      });
    }

    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // Mark messages as deleted for this user only
    let updated = false;
    messageIds.forEach(msgId => {
      const message = chat.messages.find(m => m._id.toString() === msgId);
      if (message && !message.deletedFor.includes(userIdStr)) {
        message.deletedFor.push(userIdStr);
        updated = true;
      }
    });

if (updated) {
  // ✅ Calculate new last message for THIS USER only (excluding deleted messages)
  const visibleMessagesForUser = chat.messages.filter(
    m => !m.deletedFor.includes(userIdStr) && !m.deletedForEveryone
  );
  
  const totalVisibleForUser = visibleMessagesForUser.length;
  let newLastMessageForUser = null;

  if (visibleMessagesForUser.length > 0) {
    const lastMsg = visibleMessagesForUser[visibleMessagesForUser.length - 1];
    newLastMessageForUser = {
      content: lastMsg.content,
      sender: lastMsg.sender,
      timestamp: lastMsg.timestamp,
      deliveredTo: lastMsg.deliveredTo || [],
      readBy: lastMsg.readBy || [],
      isRead: lastMsg.isRead || false
    };
  }

  await chat.save();

  try {
    const io = getIO();
    
    // ✅ Emit ONLY to the user who deleted (not to chat room)
    io.to(userIdStr).emit('messages-deleted-for-me', {
      chatId: chatId.toString(),
      messageIds,
      deletedBy: userIdStr,
      lastMessage: newLastMessageForUser,
      totalMessages: totalVisibleForUser
    });
    
  } catch (socketError) {
    console.error('Socket emit failed:', socketError);
  }
}

    res.status(200).json({
      success: true,
      message: 'Messages deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete messages'
    });
  }
};
// Delete messages for everyone
export const deleteMessagesForEveryone = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs are required'
      });
    }

    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // Check if all messages are from the current user
    const invalidMessages = messageIds.filter(msgId => {
      const message = chat.messages.find(m => m._id.toString() === msgId);
      return !message || message.sender !== userIdStr;
    });

    if (invalidMessages.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages for everyone'
      });
    }

    // Mark messages as deleted for everyone
    let updated = false;
    messageIds.forEach(msgId => {
      const message = chat.messages.find(m => m._id.toString() === msgId);
      if (message) {
        message.deletedForEveryone = true;
        message.content = 'This message was deleted';
        updated = true;
      }
    });

    if (updated) {
      // ✅ Calculate new last message and total visible messages
      const visibleMessages = chat.messages.filter(m => !m.deletedForEveryone);
      const totalVisibleMessages = visibleMessages.length;
      let newLastMessage = null;

      // Update last message if any of deleted messages was the last one
      if (visibleMessages.length > 0) {
        const lastMsg = visibleMessages[visibleMessages.length - 1];
        newLastMessage = {
          content: lastMsg.content,
          sender: lastMsg.sender,
          timestamp: lastMsg.timestamp,
          deliveredTo: lastMsg.deliveredTo || [],
          readBy: lastMsg.readBy || [],
          isRead: lastMsg.isRead || false
        };
        chat.lastMessage = newLastMessage;
      } else {
        chat.lastMessage = null;
      }

      await chat.save();

      try {
        const io = getIO();
        
        // ✅ Emit to all participants in the chat room
        io.to(chatId.toString()).emit('messages-deleted-for-everyone', {
          chatId: chatId.toString(),
          messageIds,
          deletedBy: userIdStr,
          lastMessage: newLastMessage,
          totalMessages: totalVisibleMessages
        });
        
        // ✅ Emit message-deleted event for chat list update
        io.to(chatId.toString()).emit('message-deleted', {
          chatId: chatId.toString(),
          messageIds: messageIds,
          lastMessage: newLastMessage,
          totalMessages: totalVisibleMessages,
          deletedBy: userIdStr
        });        
      } catch (socketError) {
        console.error('Socket emit failed:', socketError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages deleted for everyone'
    });
  } catch (error) {
    console.error('Error in deleteMessagesForEveryone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete messages'
    });
  }
};
// Get user online status
export const getUserOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await getWieUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      isOnline: user.isOnline || false,
      lastSeen: user.updated_at || user.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user status'
    });
  }
};
export const getMessagesForSelection = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    
    const chat = await WieChat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.some(id => id === userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    let filteredMessages = chat.messages;

    // Apply cleared filter
    if (chat.clearedBy && chat.clearedBy.length > 0) {
      const userClearRecord = chat.clearedBy.find(item => item.user === userIdStr);
      
      if (userClearRecord) {
        filteredMessages = chat.messages.filter(
          msg => new Date(msg.createdAt || msg.timestamp) > new Date(userClearRecord.clearedAt)
        );
      }
    }

    // Filter out messages deleted for this user
    filteredMessages = filteredMessages.filter(msg => {
      if (msg.deletedForEveryone) return false;
      if (msg.deletedFor && msg.deletedFor.includes(userIdStr)) return false;
      return true;
    });

    const messagesForSelection = filteredMessages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp || msg.createdAt,
      isSender: msg.sender === userIdStr
    }));

    res.status(200).json({
      success: true,
      messages: messagesForSelection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};
export const deleteChatForMe = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    
    const chat = await WieChat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(userIdStr)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    // Mark all messages as deleted for this user
    chat.messages.forEach(msg => {
      if (!msg.deletedFor) {
        msg.deletedFor = [];
      }
      if (!msg.deletedFor.includes(userIdStr)) {
        msg.deletedFor.push(userIdStr);
      }
    });

    // Add to deletedFor array if not already there
    if (!chat.deletedFor.includes(userIdStr)) {
      chat.deletedFor.push(userIdStr);
    }

    await chat.save();

    try {
      const io = getIO();
      io.to(userIdStr).emit('chat-deleted-for-me', {
        chatId: chatId.toString(),
        deletedBy: userIdStr
      });
    } catch (socketError) {
      // Silent fail
    }

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat'
    });
  }
};
export const getUnreadUsersCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    // Find all active chats for this user
    const chats = await WieChat.find({
      participants: userIdStr,
      isActive: true,
      deletedFor: { $ne: userIdStr }
    }).lean();

    // ✅ Count unique USERS with unread messages (not total messages)
    let uniqueUsersWithUnreadMessages = 0;

    for (const chat of chats) {
      let filteredMessages = chat.messages || [];
      
      // Apply cleared filter if exists
      if (chat.clearedBy && chat.clearedBy.length > 0) {
        const userClearRecord = chat.clearedBy.find(item => item.user === userIdStr);
        
        if (userClearRecord) {
          const clearTime = new Date(userClearRecord.clearedAt);
          filteredMessages = chat.messages.filter(msg => 
            new Date(msg.createdAt || msg.timestamp) > clearTime
          );
        }
      }
      // Check if this chat has ANY unread message from the other user
      const hasUnreadMessages = filteredMessages.some(
        msg => 
          msg.sender !== userIdStr && // Message is not from me
          !msg.readBy?.some(id => id === userIdStr) // I haven't read it
      );
      if (hasUnreadMessages) {
        uniqueUsersWithUnreadMessages++;
      }
    }
    res.status(200).json({
      success: true,
      unreadUsersCount: uniqueUsersWithUnreadMessages
    });
  } catch (error) {
    console.error('❌ Error in getUnreadUsersCount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread users count'
    });
  }
};

