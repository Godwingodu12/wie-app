import WieChat from '../models/wiechat.model.js';
import { getFollowerIds,getRelationship } from '../grpc/followClient.js';
import { getWieUserById, getWieUsersByIds, searchWieUsers } from '../grpc/wieUserClient.js';
import { determineChatPermission } from '../services/permission.service.js';
import { getIO, emitToChat,getUserOnlineStat } from '../socket/wieSocket.js';
import { isBlocked } from '../services/block.service.js';
const formatUserForChat = (user) => {
  if (!user) {
    console.log('⚠️ formatUserForChat received null/undefined user');
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

    // IMPORTANT: DO NOT emit any socket events here
    // Notifications will be sent only when the first message is sent
    
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
    const { page = 1, limit = 40 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userIdStr = userId.toString();

    const chats = await WieChat.find({
      participants: userIdStr,
      isActive: true,
      $and: [
        { deletedFor: { $ne: userIdStr } },
        { 
          $or: [
            { 'messages.0': { $exists: true } }, // Has at least one message
            { lastMessage: { $exists: true, $ne: null } } // Or has lastMessage
          ]
        }
      ],
      $or: [
        { type: 'direct' },
        { type: 'request', status: 'accepted' },
        { type: 'request', status: 'pending', 'participants.0': userIdStr }
      ]
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const participantIds = chats.map(chat => 
      chat.participants.find(id => id !== userId.toString())
    );

    const participants = await getWieUsersByIds(participantIds);
    
    const participantMap = new Map(participants.map(p => [p.id, p]));

    const chatsWithDetails = chats.map(chat => {
      const otherParticipantId = chat.participants.find(id => id !== userId.toString());
      const participant = participantMap.get(otherParticipantId);

      let lastMessage = chat.lastMessage;
      let filteredMessages = chat.messages || [];
      
      if (chat.clearedBy && chat.clearedBy.length > 0) {
        const userClearRecord = chat.clearedBy.find(item => item.user === userId.toString());
        
        if (userClearRecord) {
          const clearTime = new Date(userClearRecord.clearedAt);
          filteredMessages = chat.messages.filter(msg => 
            new Date(msg.createdAt || msg.timestamp) > clearTime
          );
          
          if (lastMessage && new Date(lastMessage.timestamp) <= clearTime) {
            lastMessage = null;
          }
        }
      }

      const unreadCount = filteredMessages.filter(
        msg => 
          msg.sender !== userId.toString() &&
          !msg.readBy?.some(id => id === userId.toString())
      ).length || 0;
      
      const formattedParticipant = formatUserForChat(participant);
      
      return {
        _id: chat._id,
        participant: formattedParticipant,
        lastMessage: lastMessage || null,
        unreadCount: unreadCount,
        type: chat.type,
        status: chat.status,
        updatedAt: chat.updatedAt
      };
    });

    // Filter out chats without messages after applying clear filter
    const chatsWithMessages = chatsWithDetails.filter(chat => chat.lastMessage !== null);

    const totalChats = await WieChat.countDocuments({
      participants: userId.toString(),
      deletedFor: { $ne: userId.toString() },
      isActive: true,
      $or: [
        { 'messages.0': { $exists: true } },
        { lastMessage: { $exists: true, $ne: null } }
      ]
    });

    res.status(200).json({
      success: true,
      chats: chatsWithMessages,
      totalChats,
      page: parseInt(page),
      pages: Math.ceil(totalChats / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error in getWieUserChats:', error);
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

    // Check if this is a pending request and sender is not the requester
    if (chat.type === 'request' && chat.status === 'pending') {
      const isRequester = chat.participants[0] === userIdStr;
      if (!isRequester) {
        return res.status(403).json({
          success: false,
          message: 'Cannot send messages to pending request'
        });
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

    // Get receiver info for sender's chat list update
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
    const receiverOnline = isUserOnline(receiverId);
    const receiverViewingChat = receiverOnline && 
      (await new Promise((resolve) => {
        try {
          const io = getIO();
          const sockets = io.sockets.sockets;
          for (const [socketId, socket] of sockets) {
            if (socket.userId === receiverId) {
              resolve(socket.rooms.has(chatId.toString()));
              return;
            }
          }
          resolve(false);
        } catch {
          resolve(false);
        }
      }));

    const message = {
      sender: userIdStr,
      content: content.trim(),
      readBy: receiverViewingChat ? [userIdStr, receiverId] : [userIdStr], 
      isRead: receiverViewingChat,
      deliveredTo: receiverOnline ? [receiverId] : [],
      timestamp: new Date()
    };

    chat.messages.push(message);
    chat.lastMessage = {
      content: content.trim(),
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

    const messageDataForSender = {
      _id: savedMessage._id.toString(),
      content: savedMessage.content,
      sender: userIdStr,
      timestamp: savedMessage.timestamp,
      createdAt: savedMessage.timestamp,
      readBy: savedMessage.readBy,
      deliveredTo: savedMessage.deliveredTo || [],
      isRead: savedMessage.isRead,
      isSender: true,
      receiverOnline
    };

    const messageDataForReceiver = {
      _id: savedMessage._id.toString(),
      content: savedMessage.content,
      sender: userIdStr,
      timestamp: savedMessage.timestamp,
      createdAt: savedMessage.timestamp,
      readBy: savedMessage.readBy,
      deliveredTo: savedMessage.deliveredTo || [],
      isRead: savedMessage.isRead,
      isSender: false
    };

    // Send HTTP response first
    res.status(201).json({
      success: true,
      message: messageDataForSender,
      chatId: chat._id
    });

    // Handle socket emissions after response
    setImmediate(() => {
      try {
        const io = getIO();
        
        // Emit to chat room
        io.to(chatId.toString()).emit('new-message', {
          chatId: chatId.toString(),
          message: messageDataForReceiver,
          sender: userIdStr,
          timestamp: new Date(),
          autoRead: receiverViewingChat
        });

        // IMPORTANT: Only send notifications to receiver if this is a message
        // This includes first message which triggers request notification
        const notificationData = {
          chatId: chatId.toString(),
          message: {
            _id: savedMessage._id.toString(),
            content: content.trim(),
            sender: userIdStr,
            senderName: senderInfo?.name || 'Someone',
            senderImage: senderInfo?.profile_picture || null,
            timestamp: new Date(),
            deliveredTo: savedMessage.deliveredTo || [],
            isRead: savedMessage.isRead
          },
          lastMessage: {
            content: content.trim(),
            sender: userIdStr,
            timestamp: new Date(),
            readBy: savedMessage.readBy,
            isRead: savedMessage.isRead
          },
          participant: {
            _id: senderInfo?.id || userIdStr,
            name: senderInfo?.name || 'Someone',
            profile_picture: senderInfo?.profile_picture || null,
            email: senderInfo?.email || '',
            bio: senderInfo?.bio || null,
            is_verified: senderInfo?.is_verified || false
          },
          type: chat.type || 'direct',
          status: chat.status || 'accepted',
          unreadCount: receiverViewingChat ? 0 : 1,
          timestamp: new Date(),
          isFirstMessage: isFirstMessage,
          autoRead: receiverViewingChat
        };

        // Send notification to receiver
        io.to(receiverId).emit('new-message-notification', notificationData);

        // Update receiver's chat list
        io.to(receiverId).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: {
            content: content.trim(),
            sender: userIdStr,
            timestamp: new Date(),
            readBy: savedMessage.readBy,
            isRead: savedMessage.isRead
          },
          participant: {
            _id: senderInfo?.id || userIdStr,
            name: senderInfo?.name || 'Someone',
            profile_picture: senderInfo?.profile_picture || null,
            email: senderInfo?.email || '',
            bio: senderInfo?.bio || null,
            is_verified: senderInfo?.is_verified || false
          },
          type: chat.type || 'direct',
          status: chat.status || 'accepted',
          unreadCount: receiverViewingChat ? 0 : 1,
          isFirstMessage: isFirstMessage
        });

        // Update sender's chat list
        io.to(userIdStr).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: {
            content: content.trim(),
            sender: userIdStr,
            timestamp: new Date(),
            readBy: savedMessage.readBy,
            isRead: savedMessage.isRead
          },
          participant: {
            _id: receiverInfo?.id || receiverId,
            name: receiverInfo?.name || 'Someone',
            profile_picture: receiverInfo?.profile_picture || null,
            email: receiverInfo?.email || '',
            bio: receiverInfo?.bio || null,
            is_verified: receiverInfo?.is_verified || false
          },
          type: chat.type || 'direct',
          status: chat.status || 'accepted',
          unreadCount: 0,
          isFirstMessage: isFirstMessage
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
      // First check socket status (real-time)
      const socketStatus = getUserOnlineStat(otherParticipantId);
      const isSocketOnline = socketStatus.isOnline;
      
      // Then get user data from database
      participant = await getWieUserById(otherParticipantId);
      
      if (participant) {
        // Priority: Socket status > Database status
        if (isSocketOnline) {
          finalIsOnline = true;
          lastSeenAt = new Date().toISOString();
        } else {
          // User not in socket, check database
          // If database shows online but no socket, they're actually offline
          finalIsOnline = false;
          lastSeenAt = participant.last_seen_at;
        }
      }
    } catch (error) {
      console.error('Error fetching participant:', error);
    }

    let filteredMessages = chat.messages;

    // Filter by cleared messages
    if (chat.clearedBy && chat.clearedBy.length > 0) {
      const userClearRecord = chat.clearedBy.find(item => item.user === userIdStr);
      
      if (userClearRecord) {
        filteredMessages = chat.messages.filter(
          msg => new Date(msg.createdAt || msg.timestamp) > new Date(userClearRecord.clearedAt)
        );
      }
    }

    // Filter deleted messages
    filteredMessages = filteredMessages.filter(msg => {
      if (msg.deletedForEveryone) return false;
      if (msg.deletedFor && msg.deletedFor.includes(userIdStr)) return false;
      return true;
    });

    const totalMessages = filteredMessages.length;
    const startIndex = Math.max(0, totalMessages - (parseInt(page) * parseInt(limit)));
    const endIndex = totalMessages - ((parseInt(page) - 1) * parseInt(limit));
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    const messagesWithAllFields = paginatedMessages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp || msg.createdAt,
      createdAt: msg.createdAt || msg.timestamp,
      readBy: msg.readBy || [],
      isRead: msg.isRead || false,
      deliveredTo: msg.deliveredTo || [],
      deletedForEveryone: msg.deletedForEveryone || false
    }));

    const response = {
      success: true,
      chat: {
        _id: chat._id,
        type: chat.type,
        status: chat.status,
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
  } catch (error) {
    console.error('Error in getWieChatMessages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
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
    message: 'Only the recipient can accept'
  });
}

if (chat.type !== 'request' || chat.status !== 'pending') {
  return res.status(400).json({
    success: false,
    message: 'Not a pending request'
  });
}

chat.status = 'accepted';
chat.acceptedBy = userId.toString();
chat.acceptedAt = new Date();
await chat.save();

res.status(200).json({
  success: true,
  message: 'Message request accepted'
});
} catch (error) {
res.status(500).json({
success: false,
message: 'Failed to accept request'
});
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
// Mark messages as read
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

    // Find all unread messages from other participant
    const unreadMessageIds = [];
    let updated = false;

    chat.messages.forEach(msg => {
      if (msg.sender !== userIdStr && !msg.readBy.includes(userIdStr)) {
        msg.readBy.push(userIdStr);
        msg.isRead = true;
        unreadMessageIds.push(msg._id.toString());
        updated = true;
      }
    });

    if (updated) {
      await chat.save();

      // Emit socket event to sender
      try {
        const io = getIO();
        const otherParticipant = chat.participants.find(p => p !== userIdStr);
        
        io.to(otherParticipant).emit('messages-read', {
          chatId: chatId.toString(),
          userId: userIdStr,
          messageIds: unreadMessageIds,
          readBy: userIdStr
        });
      } catch (socketError) {
        // Silent fail
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      markedCount: unreadMessageIds.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
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
        messageCount: request.messages?.length || 0
      };
    });

    res.status(200).json({
      success: true,
      requests: requestsWithDetails
    });
  } catch (error) {
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
      await chat.save();

      try {
        const io = getIO();
        io.to(userIdStr).emit('messages-deleted-for-me', {
          chatId: chatId.toString(),
          messageIds,
          deletedBy: userIdStr
        });
      } catch (socketError) {
        // Silent fail
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
export const deleteMessagesForEveryone = async (
  req, res) => {
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
      // Update last message if any of deleted messages was the last one
      if (chat.lastMessage && messageIds.includes(chat.lastMessage._id?.toString())) {
        const visibleMessages = chat.messages.filter(m => !m.deletedForEveryone);
        if (visibleMessages.length > 0) {
          const lastMsg = visibleMessages[visibleMessages.length - 1];
          chat.lastMessage = {
            content: lastMsg.content,
            sender: lastMsg.sender,
            timestamp: lastMsg.timestamp
          };
        } else {
          chat.lastMessage = null;
        }
      }

      await chat.save();

      try {
        const io = getIO();
        io.to(chatId.toString()).emit('messages-deleted-for-everyone', {
          chatId: chatId.toString(),
          messageIds,
          deletedBy: userIdStr
        });
      } catch (socketError) {
        // Silent fail
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages deleted for everyone'
    });
  } catch (error) {
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