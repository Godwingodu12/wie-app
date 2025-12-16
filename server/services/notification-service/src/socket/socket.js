import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
let io;
const userSockets = new Map(); 
export const initializeSocket = (server) => {
  const allowedOrigins = [
    ...(process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
      : []),
    ...(process.env.USER_CORS_ORIGIN
      ? process.env.USER_CORS_ORIGIN.split(',').map(origin => origin.trim()) 
      : [])
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          console.warn(`⚠️ Socket CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    path: '/socket.io/'
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
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      return next(new Error(`Authentication error: ${error.message}`));
    }
  });
  io.on('connection', (socket) => {
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
    // Handle join chat room
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      socket.emit('joined-chat', { chatId }); // Confirm to client
    });
    // Handle leave chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      socket.emit('left-chat', { chatId }); // Confirm to client
    });
    // Handle typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
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
    return true;
  }
  console.warn(`⚠️ Cannot emit ${event} - user ${userId} not connected`);
  return false;
};
export const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
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
