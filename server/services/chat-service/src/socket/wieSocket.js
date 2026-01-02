import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { updateUserOnlineStatus } from '../grpc/wieUserClient.js';
let wieIO;
const userSockets = new Map();

export const initializeWieSocket = (server) => {
  wieIO = new Server(server, {
    path: '/wie-socket.io',
    cors: {
      origin: [
        process.env.USER_CORS_ORIGIN || 'http://localhost:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ],
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  wieIO.use((socket, next) => {
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
  wieIO.on('connection', async (socket) => {
    userSockets.set(socket.userId, socket.id);
    socket.join(socket.userId);

    // Update user online status in database
    try {
      await updateUserOnlineStatus(socket.userId, true);      
      // Broadcast to all connected clients
      socket.broadcast.emit('user-status-change', {
        userId: socket.userId,
        isOnline: true,
        last_seen_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to update online status:', error);
    }

    try {
      const WieChat = mongoose.model('WieChat');
      const userId = new mongoose.Types.ObjectId(socket.userId);      
      const unreadCounts = await WieChat.aggregate([
        {
          $match: {
            participants: userId.toString(),
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
                      { $ne: ['$$msg.sender', userId.toString()] },
                      { $not: { $in: [userId.toString(), '$$msg.readBy'] } }
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
      // Silent fail
    }

    socket.on('request-unread-counts', async () => {
      try {
        const WieChat = mongoose.model('WieChat');
        const userId = new mongoose.Types.ObjectId(socket.userId);
        
        const unreadCounts = await WieChat.aggregate([
          {
            $match: {
              participants: userId.toString(),
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
                        { $ne: ['$$msg.sender', userId.toString()] },
                        { $not: { $in: [userId.toString(), '$$msg.readBy'] } }
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
        // Silent fail
      }
    });

    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      socket.emit('joined-chat', { chatId });
    });

    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
    });

    socket.on('typing', ({ chatId, isTyping }) => {
      socket.to(chatId).emit('user-typing', {
        userId: socket.userId,
        chatId,
        isTyping
      });
    });

    socket.on('mark-read', async ({ chatId, messageIds }) => {
      try {
        const WieChat = mongoose.model('WieChat');
        const userId = socket.userId;
        const chatObjectId = new mongoose.Types.ObjectId(chatId);
        const messageObjectIds = messageIds.map(id => new mongoose.Types.ObjectId(id));

        let retries = 3;
        let success = false;
        let updatedChat = null;

        while (retries > 0 && !success) {
          try {
            updatedChat = await WieChat.findOneAndUpdate(
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
              msg.sender !== userId &&
              !msg.readBy.some(id => id === userId)
          ).length;

          socket.emit('chat-unread-update', {
            chatId,
            unreadCount
          });
        }
      } catch (error) {
        // Silent fail
      }
    });
    socket.on('disconnect', async (reason) => {      
      if (userSockets.get(socket.userId) === socket.id) {
        userSockets.delete(socket.userId);
        
        try {
          // Update user status to offline via gRPC
          await updateUserOnlineStatus(socket.userId, false);
          
          // Broadcast to all connected clients
          socket.broadcast.emit('user-status-change', {
            userId: socket.userId,
            isOnline: false,
            last_seen_at: new Date().toISOString()
          });
          
          console.log(`👋 User ${socket.userId} disconnected: ${reason}`);
        } catch (error) {
          console.error('❌ Failed to update offline status:', error);
        }
      }
    });
    socket.on('error', (error) => {
      // Silent fail
    });
  });

  return wieIO;
};

export const getIO = () => {
  if (!wieIO) {
    throw new Error('WIE Socket.IO not initialized');
  }
  return wieIO;
};

export const emitToUser = (userId, event, data) => {
  if (!wieIO) {
    return false;
  }
  
  const userIdString = userId.toString();
  const socketId = userSockets.get(userIdString);
  
  if (socketId) {
    wieIO.to(socketId).emit(event, data);
  }
  
  wieIO.to(userIdString).emit(event, data);
  
  return true;
};

export const emitToMultipleUsers = (userIds, event, data) => {
  if (!wieIO) {
    return false;
  }

  userIds.forEach(userId => {
    emitToUser(userId, event, data);
  });

  return true;
};

export const emitToChat = (chatId, event, data) => {
  if (wieIO) {
    wieIO.to(chatId.toString()).emit(event, data);
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
export const getUserOnlineStat = (userId) => {
  return {
    isOnline: userSockets.has(userId.toString()),
    socketId: userSockets.get(userId.toString())
  };
};