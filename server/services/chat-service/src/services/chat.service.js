import Chat from '../models/chat.model.js';
import { getUserFromAuthService, getFollowersFromAuthService } from '../rabbit/consumerConnections.js';
import { isChannelAvailable } from '../rabbit/connection.js';
import { getIO, emitToChat } from '../socket/socket.js';
// Get chat suggestions (followers)
export const getChatSuggestions = async (req, res) => {
  try {
    // Extract userId from token - support both formats
    const userId = req.user?.userId || req.user?.id;    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    // Check if RabbitMQ is available
    if (!isChannelAvailable()) {
      console.warn('⚠️ RabbitMQ not available, returning empty suggestions');
      return res.status(200).json({
        success: true,
        suggestions: [],
        message: 'Service temporarily unavailable'
      });
    }

    try {
      // Get followers from auth-service
      const followersData = await getFollowersFromAuthService(userId);
      // Handle different response formats
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

    // Check if RabbitMQ is available
    if (!isChannelAvailable()) {
      console.warn('⚠️ RabbitMQ not available');
      return res.status(200).json({
        success: true,
        users: [],
        message: 'Search service temporarily unavailable'
      });
    }

    try {
      // Search users via RabbitMQ
      const result = await getUserFromAuthService({
        action: 'search',
        query: query.trim(),
        excludeUserId: userId.toString() // FIXED: Ensure it's a string
      });
      // FIXED: Handle different response formats
      let users = [];
      
      if (Array.isArray(result)) {
        users = result;
      } else if (result?.users && Array.isArray(result.users)) {
        users = result.users;
      } else if (result?.data && Array.isArray(result.data)) {
        users = result.data;
      }

      // Format users to ensure consistent structure
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
    // Verify participant exists and is active
    const participant = await getUserFromAuthService({ userId: participantId });
    if (!participant || participant.error) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { 
        $all: [userId, participantId],
        $size: 2
      },
      isActive: true
    }).lean();
    if (chat) {
      // Remove from deletedFor if it was soft deleted
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
    // Create new chat
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
      isNew: true
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
    const { page = 1, limit = 20 } = req.query;

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

    // Get participant details for each chat
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

        // Calculate unread count
        const unreadCount = chat.messages?.filter(
          msg => 
            msg.sender.toString() !== userId.toString() &&
            !msg.readBy?.some(id => id.toString() === userId.toString())
        ).length || 0;

        return {
          _id: chat._id,
          participant: participant && !participant.error ? participant : null,
          lastMessage: chat.lastMessage || null,
          unreadCount,
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
    // Verify user is a participant
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    // Add message
    const message = {
      sender: userId,
      content: content.trim(),
      readBy: [userId],
      isRead: false
    };
    chat.messages.push(message);
    // Update last message
    chat.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: new Date()
    };
    // Remove from deletedFor for both participants (restore chat if deleted)
    chat.deletedFor = [];
    await chat.save();
    const savedMessage = chat.messages[chat.messages.length - 1];
    // SOCKET.IO: Emit real-time message to all participants in the chat
    try {
      const io = getIO();
      emitToChat(chatId, 'new-message', {
        chatId,
        message: savedMessage,
        sender: userId
      });
    } catch (socketError) {
      console.error('⚠️ Socket emit failed:', socketError.message);
      // Continue even if socket fails
    }
    res.status(201).json({
      success: true,
      message: savedMessage,
      chatId: chat._id
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
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
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    // Verify user is a participant
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    // Mark messages as read
    let updated = false;
    const readMessageIds = [];
    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== userId.toString() && 
          !msg.readBy.some(id => id.toString() === userId.toString())) {
        msg.readBy.push(userId);
        msg.isRead = true;
        readMessageIds.push(msg._id);
        updated = true;
      }
    });
    if (updated) {
      await chat.save();
      // SOCKET.IO: Emit read receipts
      try {
        const io = getIO();
        emitToChat(chatId, 'messages-read', {
          chatId,
          userId,
          messageIds: readMessageIds
        });
      } catch (socketError) {
        console.error('⚠️ Socket emit failed:', socketError.message);
      }
    }
    // Get participant info
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
    // Paginate messages (latest first approach)
    const totalMessages = chat.messages.length;
    const startIndex = Math.max(0, totalMessages - (parseInt(page) * parseInt(limit)));
    const endIndex = totalMessages - ((parseInt(page) - 1) * parseInt(limit));
    const paginatedMessages = chat.messages.slice(startIndex, endIndex);
    res.status(200).json({
      success: true,
      chat: {
        _id: chat._id,
        participant: participant && !participant.error ? participant : null
      },
      messages: paginatedMessages,
      totalMessages,
      page: parseInt(page),
      pages: Math.ceil(totalMessages / parseInt(limit)),
      hasMore: startIndex > 0
    });
  } catch (error) {
    console.error('❌ Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};
// Delete chat (soft delete)
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
    // Verify user is a participant
    if (!chat.participants.some(id => id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat'
      });
    }
    // Soft delete for this user
    if (!chat.deletedFor.some(id => id.toString() === userId.toString())) {
      chat.deletedFor.push(userId);
      await chat.save();
    }
    // If both participants deleted, permanently delete the chat
    if (chat.deletedFor.length === chat.participants.length) {
      await Chat.deleteOne({ _id: chatId });
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
