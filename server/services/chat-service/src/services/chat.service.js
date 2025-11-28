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

        const unreadCount = chat.messages?.filter(
          msg => 
            msg.sender.toString() !== userId.toString() &&
            !msg.readBy?.some(id => id.toString() === userId.toString())
        ).length || 0;
        
        return {
          _id: chat._id,
          participant: participant && !participant.error ? participant : null,
          lastMessage: chat.lastMessage || null,
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
              // Check if this socket is in the chat room
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
        readBy: receiverViewingChat ? [userId, receiverId] : [userId], // FIXED: Auto-mark as read if viewing
        isRead: receiverViewingChat, // FIXED: Set isRead if receiver is viewing
        deliveredTo: receiverOnline ? [receiverId] : [],
        timestamp: new Date()
      };
      chat.messages.push(message);
      chat.lastMessage = {
        content: content.trim(),
        sender: userId,
        timestamp: new Date()
      };
      chat.deletedFor = [];
      chat.updatedAt = new Date();
      await chat.save();
      const savedMessage = chat.messages[chat.messages.length - 1];
      const messageDataForSender = {
        _id: savedMessage._id,
        content: savedMessage.content,
        sender: userId.toString(),
        timestamp: savedMessage.timestamp,
        createdAt: savedMessage.timestamp,
        readBy: savedMessage.readBy.map(id => id.toString()),
        deliveredTo: savedMessage.deliveredTo?.map(id => id.toString()) || [],
        isRead: savedMessage.isRead, // FIXED: Include actual read status
        isSender: true,
        receiverOnline
      };
      const messageDataForReceiver = {
        _id: savedMessage._id,
        content: savedMessage.content,
        sender: userId.toString(),
        timestamp: savedMessage.timestamp,
        createdAt: savedMessage.timestamp,
        readBy: savedMessage.readBy.map(id => id.toString()),
        deliveredTo: savedMessage.deliveredTo?.map(id => id.toString()) || [],
        isRead: savedMessage.isRead, // FIXED: Include actual read status
        isSender: false
      };
      try {
        const io = getIO();
        
        io.to(chatId.toString()).emit('new-message', {
          chatId: chatId.toString(),
          message: messageDataForReceiver,
          sender: userId.toString(),
          timestamp: new Date(),
          autoRead: receiverViewingChat // FIXED: Tell client message was auto-read
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
            isRead: savedMessage.isRead // FIXED: Include read status
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
          unreadCount: receiverViewingChat ? 0 : 1, // FIXED: 0 if viewing, 1 if not
          timestamp: new Date(),
          isFirstMessage: chat.messages.length === 1,
          autoRead: receiverViewingChat // FIXED: Inform about auto-read
        };

        io.to(receiverId.toString()).emit('new-message-notification', notificationData);

        io.to(receiverId.toString()).emit('chat-list-update', {
          chatId: chatId.toString(),
          lastMessage: {
            content: content.trim(),
            sender: userId.toString(),
            timestamp: new Date()
          },
          unreadCount: receiverViewingChat ? 0 : 1, // FIXED: Correct unread count
          participant: {
            _id: senderInfo?._id || userId.toString(),
            name: senderInfo?.name || 'Someone',
            image: senderInfo?.image || null
          },
          isFirstMessage: chat.messages.length === 1
        });

      } catch (socketError) {
        console.error('Socket emit failed:', socketError.message);
      }
      res.status(201).json({
        success: true,
        message: messageDataForSender,
        chatId: chat._id
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
    
    // Mark messages as read BEFORE returning
    let updated = false;
    const unreadMessageIds = [];
    
    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== userId.toString() && 
          !msg.readBy.some(id => id.toString() === userId.toString())) {
        msg.readBy.push(userId);
        msg.isRead = true;
        unreadMessageIds.push(msg._id);
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
    
    // Paginate messages (latest first approach)
    const totalMessages = chat.messages.length;
    const startIndex = Math.max(0, totalMessages - (parseInt(page) * parseInt(limit)));
    const endIndex = totalMessages - ((parseInt(page) - 1) * parseInt(limit));
    const paginatedMessages = chat.messages.slice(startIndex, endIndex);
    
    // CRITICAL FIX: Convert to plain objects to ensure all fields are sent
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
    
    // Clear all messages
    chat.messages = [];
    chat.lastMessage = null;
    await chat.save();
    
    // Notify other participant
    try {
      const io = getIO();
      io.to(chatId.toString()).emit('chat-cleared', {
        chatId: chatId.toString(),
        clearedBy: userId.toString()
      });
    } catch (socketError) {
      console.error('Socket emit failed:', socketError.message);
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat cleared successfully'
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
    await Chat.deleteOne({ _id: chatId });
    try {
      const io = getIO();
      io.to(userId.toString()).emit('chat-deleted', {
        chatId: chatId.toString(),
        deletedBy: userId.toString()
      });
      io.to(otherParticipantId.toString()).emit('chat-deleted', {
        chatId: chatId.toString(),
        deletedBy: userId.toString()
      });
      // Emit to chat room
      emitToChat(chatId, 'chat-deleted', {
        chatId: chatId.toString(),
        deletedBy: userId.toString()
      });
    } catch (socketError) {
      // Silent fail
    }
    res.status(200).json({
      success: true,
      message: 'Chat permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete chat'
    });
  }
};
