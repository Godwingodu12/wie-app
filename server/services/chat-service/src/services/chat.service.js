import Chat from '../models/chat.model.js';
import { getUserFromAuthService, getFollowersFromAuthService } from '../rabbit/consumerConnections.js';
import { isChannelAvailable } from '../rabbit/connection.js';
import { getIO, emitToChat } from '../socket/socket.js';
import mongoose from 'mongoose';

// Get chat suggestions (followers)
export const getChatSuggestions = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    
    if (!isChannelAvailable()) {
      console.warn('⚠️ RabbitMQ not available, returning empty suggestions');
      return res.status(200).json({
        success: true,
        suggestions: [],
        message: 'Service temporarily unavailable'
      });
    }

    try {
      const followersData = await getFollowersFromAuthService(userId);
      let followers = [];
      if (followersData?.followers) {
        followers = followersData.followers;
      } else if (Array.isArray(followersData)) {
        followers = followersData;
      }

      return res.status(200).json({
        success: true,
        suggestions: followers
      });
    } catch (rabbitError) {
      console.error('❌ RabbitMQ error:', rabbitError);
      return res.status(200).json({
        success: true,
        suggestions: [],
        message: 'Unable to fetch suggestions at this time'
      });
    }
  } catch (error) {
    console.error('❌ Error in getChatSuggestions:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search users for chat
export const searchUsersForChat = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
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
        message: 'User ID not found in token'
      });
    }

    if (!isChannelAvailable()) {
      console.warn('⚠️ RabbitMQ not available');
      return res.status(200).json({
        success: true,
        users: [],
        message: 'Search service temporarily unavailable'
      });
    }

    try {
      const result = await getUserFromAuthService({
        action: 'search',
        query: query.trim(),
        excludeUserId: userId.toString()
      });
      
      let users = [];
      
      if (Array.isArray(result)) {
        users = result;
      } else if (result?.users && Array.isArray(result.users)) {
        users = result.users;
      } else if (result?.data && Array.isArray(result.data)) {
        users = result.data;
      }

      const formattedUsers = users.map(user => ({
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        organisation_type: user.organisation_type,
        role: user.role,
        bio: user.bio
      }));

      return res.status(200).json({
        success: true,
        users: formattedUsers,
        count: formattedUsers.length
      });
    } catch (rabbitError) {
      console.error('❌ RabbitMQ search error:', rabbitError);
      return res.status(200).json({
        success: true,
        users: [],
        message: 'Search temporarily unavailable'
      });
    }
  } catch (error) {
    console.error('❌ Error in searchUsersForChat:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create or get existing chat
export const createOrGetChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id || req.user.id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required'
      });
    }

    if (participantId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself'
      });
    }

    const participant = await getUserFromAuthService({ userId: participantId });
    if (!participant || participant.error) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    let chat = await Chat.findOne({
      participants: { 
        $all: [userId, participantId],
        $size: 2
      },
      isActive: true,
      'messages.0': { $exists: true }
    }).lean();

    if (chat) {
      if (chat.deletedFor && chat.deletedFor.some(id => id.toString() === userId.toString())) {
        await Chat.updateOne(
          { _id: chat._id },
          { $pull: { deletedFor: userId } }
        );
        chat.deletedFor = chat.deletedFor.filter(id => id.toString() !== userId.toString());
      }

      return res.status(200).json({
        success: true,
        chat: {
          ...chat,
          participant
        },
        isNew: false
      });
    }

    let emptyChat = await Chat.findOne({
      participants: { 
        $all: [userId, participantId],
        $size: 2
      },
      isActive: true,
      messages: { $size: 0 }
    });

    if (emptyChat) {
      return res.status(200).json({
        success: true,
        chat: {
          ...emptyChat.toObject(),
          participant
        },
        isNew: false,
        isEmpty: true
      });
    }
    
    chat = await Chat.create({
      participants: [userId, participantId],
      messages: [],
      isActive: true
    });

    res.status(201).json({
      success: true,
      chat: {
        ...chat.toObject(),
        participant
      },
      isNew: true,
      isEmpty: true
    });
  } catch (error) {
    console.error('❌ Error creating/getting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create or get chat'
    });
  }
};
// Get all user's chats
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 40 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const chats = await Chat.find({
      participants: userId,
      deletedFor: { $ne: userId },
      isActive: true
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipantId = chat.participants.find(
          id => id.toString() !== userId.toString()
        );

        let participant = null;
        try {
          participant = await getUserFromAuthService({ 
            userId: otherParticipantId.toString() 
          });
        } catch (error) {
          console.error('Error fetching participant:', error);
        }

        // ADDED: Check if user cleared this chat
        let lastMessage = chat.lastMessage;
        let filteredMessages = chat.messages || [];
        
        if (chat.clearedBy && chat.clearedBy.length > 0) {
          const userClearRecord = chat.clearedBy.find(
            item => item.user.toString() === userId.toString()
          );
          
          if (userClearRecord) {
            const clearTime = new Date(userClearRecord.clearedAt);
            
            // Filter messages after clear time
            filteredMessages = chat.messages.filter(msg => 
              new Date(msg.createdAt || msg.timestamp) > clearTime
            );
            
            // If last message was before clear time, don't show it
            if (lastMessage && new Date(lastMessage.timestamp) <= clearTime) {
              lastMessage = null;
            }
          }
        }

        // CHANGED: Calculate unread count from filtered messages only
        const unreadCount = filteredMessages.filter(
          msg => 
            msg.sender.toString() !== userId.toString() &&
            !msg.readBy?.some(id => id.toString() === userId.toString())
        ).length || 0;
        
        return {
          _id: chat._id,
          participant: participant && !participant.error ? participant : null,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount,
          updatedAt: chat.updatedAt
        };
      })
    );

    const totalChats = await Chat.countDocuments({
      participants: userId,
      deletedFor: { $ne: userId },
      isActive: true
    });

    res.status(200).json({
      success: true,
      chats: chatsWithDetails,
      totalChats,
      page: parseInt(page),
      pages: Math.ceil(totalChats / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats'
    });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const userId = req.user._id || req.user.id;

    if (!chatId || !content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID and message content are required'
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }

    let senderInfo = null;
    try {
      senderInfo = await getUserFromAuthService({ userId: userId.toString() });
    } catch (error) {
      console.error('Error fetching sender info:', error);
      senderInfo = { 
        _id: userId.toString(),
        name: 'Someone', 
        image: null 
      };
    }

    const receiverId = chat.participants.find(
      id => id.toString() !== userId.toString()
    );
    
    const { isUserOnline } = await import('../socket/socket.js');
    const receiverOnline = isUserOnline(receiverId);
    const receiverViewingChat = receiverOnline && 
      (await new Promise((resolve) => {
        try {
          const io = getIO();
          const sockets = io.sockets.sockets;
          for (const [socketId, socket] of sockets) {
            if (socket.userId === receiverId.toString()) {
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
      sender: userId,
      content: content.trim(),
      readBy: receiverViewingChat ? [userId, receiverId] : [userId], 
      isRead: receiverViewingChat,
      deliveredTo: receiverOnline ? [receiverId] : [],
      timestamp: new Date()
    };
    
    chat.messages.push(message);
    chat.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: new Date()
    };
    
    if (chat.deletedFor && chat.deletedFor.length > 0) {
      chat.deletedFor = chat.deletedFor.filter(
        id => id.toString() !== receiverId.toString()
      );
    }
    
    chat.updatedAt = new Date();
    await chat.save();
    
    const savedMessage = chat.messages[chat.messages.length - 1];
    
    const messageDataForSender = {
      _id: savedMessage._id.toString(), // CHANGED: Ensure string
      content: savedMessage.content,
      sender: userId.toString(),
      timestamp: savedMessage.timestamp,
      createdAt: savedMessage.timestamp,
      readBy: savedMessage.readBy.map(id => id.toString()),
      deliveredTo: savedMessage.deliveredTo?.map(id => id.toString()) || [],
      isRead: savedMessage.isRead,
      isSender: true,
      receiverOnline
    };
    
    const messageDataForReceiver = {
      _id: savedMessage._id.toString(), // CHANGED: Ensure string
      content: savedMessage.content,
      sender: userId.toString(),
      timestamp: savedMessage.timestamp,
      createdAt: savedMessage.timestamp,
      readBy: savedMessage.readBy.map(id => id.toString()),
      deliveredTo: savedMessage.deliveredTo?.map(id => id.toString()) || [],
      isRead: savedMessage.isRead,
      isSender: false
    };
    
    // CHANGED: Send HTTP response FIRST before socket emissions
    res.status(201).json({
      success: true,
      message: messageDataForSender,
      chatId: chat._id
    });
    
    // CHANGED: Then emit socket events (non-blocking)
    setImmediate(() => {
      try {
        const io = getIO();
        
        // Emit to chat room (receiver)
        io.to(chatId.toString()).emit('new-message', {
          chatId: chatId.toString(),
          message: messageDataForReceiver,
          sender: userId.toString(),
          timestamp: new Date(),
          autoRead: receiverViewingChat
        });

        const notificationData = {
          chatId: chatId.toString(),
          message: {
            _id: savedMessage._id.toString(),
            content: content.trim(),
            sender: userId.toString(),
            senderName: senderInfo?.name || 'Someone',
            senderImage: senderInfo?.image || null,
            timestamp: new Date(),
            deliveredTo: savedMessage.deliveredTo?.map(id => id.toString()) || [],
            isRead: savedMessage.isRead
          },
          lastMessage: {
            content: content.trim(),
            sender: userId.toString(),
            timestamp: new Date()
          },
          participant: {
            _id: senderInfo?._id || userId.toString(),
            name: senderInfo?.name || 'Someone',
            image: senderInfo?.image || null,
            email: senderInfo?.email || ''
          },
          unreadCount: receiverViewingChat ? 0 : 1,
          timestamp: new Date(),
          isFirstMessage: chat.messages.length === 1,
          autoRead: receiverViewingChat
        };

        io.to(receiverId.toString()).emit('new-message-notification', notificationData);

        io.to(receiverId.toString()).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: {
            content: content.trim(),
            sender: userId.toString(),
            timestamp: new Date()
          },
          unreadCount: receiverViewingChat ? 0 : 1,
          participant: {
            _id: senderInfo?._id || userId.toString(),
            name: senderInfo?.name || 'Someone',
            image: senderInfo?.image || null
          },
          isFirstMessage: chat.messages.length === 1
        });

        // Emit to sender (for confirmation)
        io.to(userId.toString()).emit('new-message', {
          chatId: chatId.toString(),
          message: messageDataForSender,
          sender: userId.toString(),
          timestamp: new Date(),
          autoRead: false
        });

      } catch (socketError) {
        console.error('Socket emit failed:', socketError.message);
      }
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    const { page = 1, limit = 50 } = req.query;
    
    // Fetch chat WITHOUT lean() to allow modifications
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    
    // Get other participant info
    const otherParticipantId = chat.participants.find(
      id => id.toString() !== userId.toString()
    );
    
    let participant = null;
    try {
      participant = await getUserFromAuthService({ 
        userId: otherParticipantId.toString() 
      });
    } catch (error) {
      // Silent fail
    }
    
    // ADDED: Filter messages based on when user cleared the chat
    let filteredMessages = chat.messages;
    
    if (chat.clearedBy && chat.clearedBy.length > 0) {
      const userClearRecord = chat.clearedBy.find(
        item => item.user.toString() === userId.toString()
      );
      
      if (userClearRecord) {
        // Only show messages sent after the user cleared the chat
        filteredMessages = chat.messages.filter(
          msg => new Date(msg.createdAt || msg.timestamp) > new Date(userClearRecord.clearedAt)
        );
      }
    }
    
    // Mark messages as read BEFORE returning (only filtered messages)
    let updated = false;
    const unreadMessageIds = [];
    
    filteredMessages.forEach(msg => {
      // Find the actual message in chat.messages to update it
      const actualMsg = chat.messages.find(m => m._id.toString() === msg._id.toString());
      
      if (actualMsg && 
          actualMsg.sender.toString() !== userId.toString() && 
          !actualMsg.readBy.some(id => id.toString() === userId.toString())) {
        actualMsg.readBy.push(userId);
        actualMsg.isRead = true;
        unreadMessageIds.push(actualMsg._id);
        updated = true;
      }
    });
    
    // Save changes if any
    if (updated) {
      try {
        await chat.save();
        
        // Emit read receipts after successful save
        try {
          const io = getIO();
          emitToChat(chatId, 'messages-read', {
            chatId,
            userId: userId.toString(),
            messageIds: unreadMessageIds.map(id => id.toString()),
            readBy: userId.toString()
          });
          
          // Also emit to other participant's personal room
          io.to(otherParticipantId.toString()).emit('messages-read', {
            chatId,
            userId: userId.toString(),
            messageIds: unreadMessageIds.map(id => id.toString()),
            readBy: userId.toString()
          });
        } catch (socketError) {
          // Silent fail
        }
      } catch (saveError) {
        // If save fails, still return messages but log error
      }
    }
    
    // Paginate FILTERED messages (latest first approach)
    const totalMessages = filteredMessages.length;
    const startIndex = Math.max(0, totalMessages - (parseInt(page) * parseInt(limit)));
    const endIndex = totalMessages - ((parseInt(page) - 1) * parseInt(limit));
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    // Convert to plain objects to ensure all fields are sent
    const messagesWithAllFields = paginatedMessages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp || msg.createdAt,
      createdAt: msg.createdAt || msg.timestamp,
      readBy: msg.readBy || [],
      isRead: msg.isRead || false,
      deliveredTo: msg.deliveredTo || []
    }));
    
    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        participant: participant && !participant.error ? participant : null
      },
      messages: messagesWithAllFields,
      totalMessages,
      page: parseInt(page),
      pages: Math.ceil(totalMessages / parseInt(limit)),
      hasMore: startIndex > 0
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};
export const clearChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    
    // CHANGED: Instead of deleting messages, mark when user cleared their view
    if (!chat.clearedBy) {
      chat.clearedBy = [];
    }
    
    // Remove existing clear record for this user if any
    chat.clearedBy = chat.clearedBy.filter(
      item => item.user.toString() !== userId.toString()
    );
    
    // Add new clear record
    chat.clearedBy.push({
      user: userId,
      clearedAt: new Date()
    });
    
    await chat.save();
    
    // CHANGED: Only notify the user who cleared, not others
    try {
      const io = getIO();
      // Emit to the specific user's socket only
      const userSockets = await io.in(chatId.toString()).fetchSockets();
      for (const socket of userSockets) {
        if (socket.data?.userId?.toString() === userId.toString()) {
          socket.emit('chat-cleared', {
            chatId: chatId.toString(),
            clearedBy: userId.toString()
          });
        }
      }
    } catch (socketError) {
      console.error('Socket emit failed:', socketError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat cleared successfully for you'
    });
  } catch (error) {
    console.error('❌ Error clearing chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat'
    });
  }
};
export const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    
    const messageIndex = chat.messages.findIndex(
      msg => msg._id.toString() === messageId
    );
    
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    const message = chat.messages[messageIndex];
    
    // Only sender can delete their own message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }
    
    // Remove the message
    chat.messages.splice(messageIndex, 1);
    
    // Update lastMessage if needed
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
    
    // Notify other participant
    try {
      const io = getIO();
      io.to(chatId.toString()).emit('message-deleted', {
        chatId: chatId.toString(),
        messageId: messageId,
        deletedBy: userId.toString(),
        lastMessage: chat.lastMessage
      });
    } catch (socketError) {
      console.error('Socket emit failed:', socketError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      lastMessage: chat.lastMessage
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    
    // Add user to deletedFor array
    if (!chat.deletedFor.some(id => id.toString() === userId.toString())) {
      chat.deletedFor.push(userId);
    }
    
    // If both participants have deleted, remove the chat completely
    if (chat.deletedFor.length === chat.participants.length) {
      await Chat.deleteOne({ _id: chatId });
      
      // Notify all participants that chat is completely deleted
      try {
        const io = getIO();
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit('chat-deleted', {
            chatId: chatId.toString(),
            deletedBy: userId.toString(),
            permanent: true
          });
        });
      } catch (socketError) {
        console.error('Socket emit failed:', socketError.message);
      }
    } else {
      // Just mark as deleted for this user
      await chat.save();
      
      // Notify this user only
      try {
        const io = getIO();
        io.to(userId.toString()).emit('chat-deleted', {
          chatId: chatId.toString(),
          deletedBy: userId.toString(),
          permanent: false
        });
      } catch (socketError) {
        console.error('Socket emit failed:', socketError.message);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat'
    });
  }
};
export const clearAndDeleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id || req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    
    const otherParticipantId = chat.participants.find(
      id => id.toString() !== userId.toString()
    );
    
    // CHANGED: Instead of deleting, mark as cleared AND deleted for this user
    
    // 1. Add to clearedBy array
    if (!chat.clearedBy) {
      chat.clearedBy = [];
    }
    chat.clearedBy = chat.clearedBy.filter(
      item => item.user.toString() !== userId.toString()
    );
    chat.clearedBy.push({
      user: userId,
      clearedAt: new Date()
    });
    
    // 2. Add to deletedFor array
    if (!chat.deletedFor) {
      chat.deletedFor = [];
    }
    if (!chat.deletedFor.some(id => id.toString() === userId.toString())) {
      chat.deletedFor.push(userId);
    }
    
    await chat.save();
    
    // CHANGED: Only emit to the user who deleted, not to other participant
    try {
      const io = getIO();
      
      // Only notify the user who performed the action
      io.to(userId.toString()).emit('chat-deleted', {
        chatId: chatId.toString(),
        deletedBy: userId.toString()
      });
      
      // DO NOT emit to other participant - they should still see the chat
      
    } catch (socketError) {
      console.error('Socket emit failed:', socketError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat cleared and hidden for you'
    });
  } catch (error) {
    console.error('❌ Error in clearAndDeleteChat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear and delete chat'
    });
  }
};
