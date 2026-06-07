import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import WieChat from '../models/wiechat.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/chat.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs:    String,
  enums:    String,
  defaults: true,
  oneofs:   true,
});

const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

// SendSystemMessage 
const sendSystemMessage = async (call, callback) => {
  try {
    const {
      sender_id,
      receiver_id,
      message_type,
      content,
      metadata_json,
    } = call.request;

    if (!sender_id || !receiver_id || !content) {
      return callback(null, {
        success:    false,
        message_id: '',
        chat_id:    '',
        error:      'sender_id, receiver_id and content are required',
      });
    }

    let metadata = {};
    try { metadata = JSON.parse(metadata_json || '{}'); } catch {}

    // Find or create chat
    let chat = await WieChat.findOne({
      participants: { $all: [sender_id, receiver_id] },
      type:         { $in: ['direct', 'request'] },
      isActive:     true,
    });

    if (!chat) {
      chat = new WieChat({
        participants: [sender_id, receiver_id],
        type:         'direct',
        status:       'accepted',
        createdBy:    sender_id,
        messages:     [],
        unreadCounts: { [sender_id]: 0, [receiver_id]: 0 },
        isActive:     true,
        deletedFor:   [],
        clearedBy:    [],
      });
    }

    // Remove from deletedFor if needed
    if (chat.deletedFor?.includes(receiver_id)) {
      chat.deletedFor = chat.deletedFor.filter(id => id !== receiver_id);
    }

// Parse the JSON content to extract display text for lastMessage preview
    let displayContent = content;
    let parsedMeta = {};
    try {
      parsedMeta = JSON.parse(content);
      // Use plain text for lastMessage preview, keep full JSON in message body
      if (parsedMeta.text)        displayContent = parsedMeta.text;
      else if (parsedMeta.senderLabel) displayContent = parsedMeta.senderLabel;
    } catch {}

    const messageObj = {
      sender:      sender_id,
      content,                          // full JSON stored in message
      messageType: message_type || 'flux_mention',
      readBy:      [sender_id],
      isRead:      false,
      deliveredTo: [],
      timestamp:   new Date(),
      metadata,
    };

    chat.messages.push(messageObj);
    chat.lastMessage = {
      content:     displayContent,      // plain text stored for preview
      sender:      sender_id,
      timestamp:   new Date(),
      messageType: message_type,
    };
    chat.updatedAt = new Date();

    // Increment unread for receiver
    if (!chat.unreadCounts) chat.unreadCounts = {};
    chat.unreadCounts[receiver_id] = (chat.unreadCounts[receiver_id] || 0) + 1;
    chat.markModified('unreadCounts');

    await chat.save();

    const savedMsg = chat.messages[chat.messages.length - 1];

    // Emit socket event to receiver
    try {
      const { getIO } = await import('../socket/wieSocket.js');
      const io = getIO();

      const socketPayload = {
        chatId:  chat._id.toString(),
        message: {
          _id:         savedMsg._id.toString(),
          sender:      sender_id,
          content,
          messageType: message_type || 'flux_mention',
          timestamp:   savedMsg.timestamp,
          readBy:      [sender_id],
          deliveredTo: [],
          isRead:      false,
          metadata,
        },
        sender:    sender_id,
        timestamp: new Date(),
      };

      // Build enriched payload that includes full message metadata
      const enrichedPayload = {
        ...socketPayload,
        message: {
          ...socketPayload.message,
          messageType: message_type || 'flux_mention',  // ensure correct type
        },
      };

      // ── Emit to the chat room (both participants if joined) ──
      io.to(chat._id.toString()).emit('new-message', enrichedPayload);

      // ── Emit new-message-notification to RECEIVER ──
      io.to(receiver_id).emit('new-message-notification', {
        chatId:      chat._id.toString(),
        message:     enrichedPayload.message,
        lastMessage: {
          content:     displayContent,
          sender:      sender_id,
          timestamp:   new Date(),
          messageType: message_type,
        },
        unreadCount: chat.unreadCounts[receiver_id] || 1,
        participant: { _id: sender_id },
        type:        'direct',
        status:      'accepted',
        timestamp:   new Date(),
      });

      io.to(receiver_id).emit('chat-unread-update', {
        chatId:      chat._id.toString(),
        unreadCount: chat.unreadCounts[receiver_id] || 1,
      });

      // ── Emit new-message-notification to SENDER as well ──
      // This is critical: sender needs to see the message in their open chat window
      io.to(sender_id).emit('new-message-notification', {
        chatId:      chat._id.toString(),
        message:     enrichedPayload.message,
        lastMessage: {
          content:     displayContent,
          sender:      sender_id,
          timestamp:   new Date(),
          messageType: message_type,
        },
        unreadCount: 0,  // sender has 0 unread
        participant: { _id: receiver_id },
        type:        'direct',
        status:      'accepted',
        timestamp:   new Date(),
        isSender:    true,  // flag so ChatContext knows this is the sender's copy
      });

      // ── Also emit direct new-message to sender (catches if sender is in the chat room) ──
      io.to(sender_id).emit('new-message', enrichedPayload);
    } catch (socketErr) {
      console.error('Socket emit failed in gRPC sendSystemMessage:', socketErr.message);
    }

    callback(null, {
      success:    true,
      message_id: savedMsg._id.toString(),
      chat_id:    chat._id.toString(),
      error:      '',
    });
  } catch (err) {
    console.error('sendSystemMessage gRPC error:', err);
    callback(null, {
      success:    false,
      message_id: '',
      chat_id:    '',
      error:      err.message,
    });
  }
};

// ── GetChatByParticipants ──────────────────────────────────────
const getChatByParticipants = async (call, callback) => {
  try {
    const { user_id_one, user_id_two } = call.request;

    const chat = await WieChat.findOne({
      participants: { $all: [user_id_one, user_id_two] },
      isActive:     true,
    }).lean();

    if (!chat) {
      return callback(null, { success: false, chat_id: '', error: 'Chat not found' });
    }

    callback(null, { success: true, chat_id: chat._id.toString(), error: '' });
  } catch (err) {
    callback(null, { success: false, chat_id: '', error: err.message });
  }
};

// ── Start server 
export const startChatGrpcServer = (port = 50056) => {
  const server = new grpc.Server();

  server.addService(chatProto.ChatService.service, {
    SendSystemMessage:      sendSystemMessage,
    GetChatByParticipants:  getChatByParticipants,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('❌ Failed to bind Chat gRPC server:', error);
        return;
      }
      console.log(`✅ Chat gRPC server running on port ${boundPort}`);
    }
  );

  return server;
};
