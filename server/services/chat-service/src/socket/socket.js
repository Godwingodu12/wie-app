import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

let io;
const userSockets = new Map(); // Map userId to socket.id

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error('❌ No token provided in socket handshake');
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.userId || decoded._id;
      
      if (!socket.userId) {
        console.error('❌ No userId found in decoded token:', decoded);
        return next(new Error('Authentication error: Invalid token format'));
      }
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });

  io.on('connection', async (socket) => {        
    // Store user's socket connection
    userSockets.set(socket.userId, socket.id);
    
    // Emit online status to all other users
    socket.broadcast.emit('user-online', { userId: socket.userId });
    
    // Join user's personal room
    socket.join(socket.userId);

    // Send initial unread counts immediately when user connects
    try {
      if (!mongoose.Types.ObjectId.isValid(socket.userId)) {
        // If not a valid ObjectId, skip unread counts for the 'Chat' model
        return;
      }

      const Chat = mongoose.model('Chat');
      const userId = new mongoose.Types.ObjectId(socket.userId);
      
      // FIXED: Use aggregation to calculate unread counts more efficiently
      const unreadCounts = await Chat.aggregate([
        {
          $match: {
            participants: userId,
            isActive: true
          }
        },
        {
          $project: {
            _id: 1,
            unreadCount: {
              $size: {
                $filter: {
                  input: '$messages',
                  as: 'msg',
                  cond: {
                    $and: [
                      { $ne: ['$$msg.sender', userId] },
                      { $not: { $in: [userId, '$$msg.readBy'] } }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $match: {
            unreadCount: { $gt: 0 }
          }
        }
      ]);
      
      const unreadCountsMap = {};
      unreadCounts.forEach(chat => {
        unreadCountsMap[chat._id.toString()] = chat.unreadCount;
      });      
      // Send unread counts immediately on connection
      socket.emit('unread-counts', unreadCountsMap);
    } catch (error) {
      console.error('❌ Error sending initial unread counts:', error);
    }
    // Handle explicit request for unread counts
    socket.on('request-unread-counts', async () => {
      try {
        if (!mongoose.Types.ObjectId.isValid(socket.userId)) return;

        const Chat = mongoose.model('Chat');
        const userId = new mongoose.Types.ObjectId(socket.userId);
        
        const unreadCounts = await Chat.aggregate([
          {
            $match: {
              participants: userId,
              isActive: true
            }
          },
          {
            $project: {
              _id: 1,
              unreadCount: {
                $size: {
                  $filter: {
                    input: '$messages',
                    as: 'msg',
                    cond: {
                      $and: [
                        { $ne: ['$$msg.sender', userId] },
                        { $not: { $in: [userId, '$$msg.readBy'] } }
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            $match: {
              unreadCount: { $gt: 0 }
            }
          }
        ]);
        
        const unreadCountsMap = {};
        unreadCounts.forEach(chat => {
          unreadCountsMap[chat._id.toString()] = chat.unreadCount;
        });
        
        socket.emit('unread-counts', unreadCountsMap);
      } catch (error) {
        console.error('❌ Error fetching unread counts:', error);
      }
    });

    // Handle join chat room
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      socket.emit('joined-chat', { chatId });
    });

    // Handle leave chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('user-typing', {
        userId: socket.userId,
        chatId,
        isTyping
      });
    });
    socket.on('mark-read', async ({ chatId, messageIds }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(socket.userId)) return;
        if (!mongoose.Types.ObjectId.isValid(chatId)) return;

        const Chat = mongoose.model('Chat');
        const userId = new mongoose.Types.ObjectId(socket.userId);
        const chatObjectId = new mongoose.Types.ObjectId(chatId);
        const messageObjectIds = messageIds.map(id => new mongoose.Types.ObjectId(id));
        let retries = 3;
        let success = false;
        let updatedChat = null;
        while (retries > 0 && !success) {
          try {
            updatedChat = await Chat.findOneAndUpdate(
              { 
                _id: chatObjectId,
                'messages._id': { $in: messageObjectIds }
              },
              { 
                $addToSet: { 
                  'messages.$[elem].readBy': userId
                },
                $set: {
                  'messages.$[elem].isRead': true
                }
              },
              {
                arrayFilters: [{ 'elem._id': { $in: messageObjectIds } }],
                new: true
              }
            );
            success = true;
          } catch (err) {
            if (err.name === 'VersionError' && retries > 1) {
              retries--;
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              throw err;
            }
          }
        }
        socket.to(chatId).emit('messages-read', {
          chatId,
          messageIds,
          readBy: socket.userId
        });
        if (updatedChat) {
          const unreadCount = updatedChat.messages.filter(
            msg => 
              msg.sender.toString() !== userId.toString() &&
              !msg.readBy.some(id => id.toString() === userId.toString())
          ).length;
          socket.emit('chat-unread-update', {
            chatId,
            unreadCount
          });
        }
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });
    socket.on('disconnect', (reason) => {
      console.log('❌ User disconnected:', socket.userId, 'Reason:', reason);
      if (userSockets.get(socket.userId) === socket.id) {
        userSockets.delete(socket.userId);
        socket.broadcast.emit('user-offline', { userId: socket.userId });
      }
    });
    socket.on('error', (error) => {
      console.error('❌ Socket error for user', socket.userId, ':', error);
    });
  });

  return io;
};
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit to specific user (personal room)
export const emitToUser = (userId, event, data) => {
  if (!io) {
    return false;
  }
  
  const userIdString = userId.toString();
  const socketId = userSockets.get(userIdString);
  
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
  
  io.to(userIdString).emit(event, data);
  
  return true;
};

export const emitToMultipleUsers = (userIds, event, data) => {
  if (!io) {
    console.warn(`⚠️ Cannot emit ${event} - Socket.IO not initialized`);
    return false;
  }

  userIds.forEach(userId => {
    emitToUser(userId, event, data);
  });

  return true;
};

// Emit to chat room (all participants)
export const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId.toString()).emit(event, data);
    return true;
  }
  return false;
};

export const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

export const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};
