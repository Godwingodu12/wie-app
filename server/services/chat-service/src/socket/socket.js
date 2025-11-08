import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

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

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.error('❌ No token provided in socket handshake');
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Support multiple token formats
      socket.userId = decoded.id || decoded.userId || decoded._id;
      
      if (!socket.userId) {
        console.error('❌ No userId found in decoded token:', decoded);
        return next(new Error('Authentication error: Invalid token format'));
      }
      
      console.log('✅ Socket authenticated for user:', socket.userId);
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.userId, '| Socket ID:', socket.id);
    // Store user's socket connection (handle multiple devices)
    const existingSocketId = userSockets.get(socket.userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log('⚠️ User has multiple connections, updating...');
    }
    userSockets.set(socket.userId, socket.id);
    // Emit online status
    socket.broadcast.emit('user-online', { userId: socket.userId });
    // Join user's personal room
    socket.join(socket.userId);
    console.log(`📥 User ${socket.userId} joined personal room`);
    // Handle join chat room
    socket.on('join-chat', (chatId) => {
      console.log(`📥 User ${socket.userId} joining chat: ${chatId}`);
      socket.join(chatId);
      socket.emit('joined-chat', { chatId }); // Confirm to client
    });
    // Handle leave chat room
    socket.on('leave-chat', (chatId) => {
      console.log(`📤 User ${socket.userId} leaving chat: ${chatId}`);
      socket.leave(chatId);
      socket.emit('left-chat', { chatId }); // Confirm to client
    });
    // Handle typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
      console.log(`⌨️ User ${socket.userId} typing in chat ${chatId}: ${isTyping}`);
      socket.to(chatId).emit('user-typing', {
        userId: socket.userId,
        chatId,
        isTyping
      });
    });
    // Handle message read status
    socket.on('mark-read', ({ chatId, messageIds }) => {
      socket.to(chatId).emit('messages-read', {
        userId: socket.userId,
        chatId,
        messageIds
      });
    });
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('🔌 User disconnected:', socket.userId, '| Reason:', reason);
      // Only remove if this is the current socket for this user
      if (userSockets.get(socket.userId) === socket.id) {
        userSockets.delete(socket.userId);
        // Emit offline status
        socket.broadcast.emit('user-offline', { userId: socket.userId });
      }
    });
    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error for user', socket.userId, ':', error);
    });
  });
  console.log('✅ Socket.IO initialized');
  return io;
};
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
export const emitToUser = (userId, event, data) => {
  const socketId = userSockets.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    console.log(`✅ Emitted ${event} to user ${userId}`);
    return true;
  }
  console.warn(`⚠️ Cannot emit ${event} - user ${userId} not connected`);
  return false;
};
export const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
    console.log(`✅ Emitted ${event} to chat ${chatId}`);
    return true;
  }
  console.warn(`⚠️ Cannot emit ${event} - Socket.IO not initialized`);
  return false;
};
export const isUserOnline = (userId) => {
  return userSockets.has(userId);
};
export const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};