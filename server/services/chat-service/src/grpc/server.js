import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import WieChat from '../models/wiechat.model.js';
import * as blockService from '../services/block.service.js';
import * as reportService from '../services/report.service.js';
import { invalidatePermissionCache } from '../services/permission.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/chat.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
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
        success: false,
        message_id: '',
        chat_id: '',
        error: 'sender_id, receiver_id and content are required',
      });
    }

    let metadata = {};
    try { metadata = JSON.parse(metadata_json || '{}'); } catch { }

    // Find or create chat
    let chat = await WieChat.findOne({
      participants: { $all: [sender_id, receiver_id] },
      type: { $in: ['direct', 'request'] },
      isActive: true,
    });

    if (!chat) {
      chat = new WieChat({
        participants: [sender_id, receiver_id],
        type: 'direct',
        status: 'accepted',
        createdBy: sender_id,
        messages: [],
        unreadCounts: { [sender_id]: 0, [receiver_id]: 0 },
        isActive: true,
        deletedFor: [],
        clearedBy: [],
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
      if (parsedMeta.text) displayContent = parsedMeta.text;
      else if (parsedMeta.senderLabel) displayContent = parsedMeta.senderLabel;
    } catch { }

    const messageObj = {
      sender: sender_id,
      content,                          // full JSON stored in message
      messageType: message_type || 'flux_mention',
      readBy: [sender_id],
      isRead: false,
      deliveredTo: [],
      timestamp: new Date(),
      metadata,
    };

    chat.messages.push(messageObj);
    chat.lastMessage = {
      content: displayContent,      // plain text stored for preview
      sender: sender_id,
      timestamp: new Date(),
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
        chatId: chat._id.toString(),
        message: {
          _id: savedMsg._id.toString(),
          sender: sender_id,
          content,
          messageType: message_type || 'flux_mention',
          timestamp: savedMsg.timestamp,
          readBy: [sender_id],
          deliveredTo: [],
          isRead: false,
          metadata,
        },
        sender: sender_id,
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
        chatId: chat._id.toString(),
        message: enrichedPayload.message,
        lastMessage: {
          content: displayContent,
          sender: sender_id,
          timestamp: new Date(),
          messageType: message_type,
        },
        unreadCount: chat.unreadCounts[receiver_id] || 1,
        participant: { _id: sender_id },
        type: 'direct',
        status: 'accepted',
        timestamp: new Date(),
      });

      io.to(receiver_id).emit('chat-unread-update', {
        chatId: chat._id.toString(),
        unreadCount: chat.unreadCounts[receiver_id] || 1,
      });

      // ── Emit new-message-notification to SENDER as well ──
      // This is critical: sender needs to see the message in their open chat window
      io.to(sender_id).emit('new-message-notification', {
        chatId: chat._id.toString(),
        message: enrichedPayload.message,
        lastMessage: {
          content: displayContent,
          sender: sender_id,
          timestamp: new Date(),
          messageType: message_type,
        },
        unreadCount: 0,  // sender has 0 unread
        participant: { _id: receiver_id },
        type: 'direct',
        status: 'accepted',
        timestamp: new Date(),
        isSender: true,  // flag so ChatContext knows this is the sender's copy
      });

      // ── Also emit direct new-message to sender (catches if sender is in the chat room) ──
      io.to(sender_id).emit('new-message', enrichedPayload);
    } catch (socketErr) {
      console.error('Socket emit failed in gRPC sendSystemMessage:', socketErr.message);
    }

    callback(null, {
      success: true,
      message_id: savedMsg._id.toString(),
      chat_id: chat._id.toString(),
      error: '',
    });
  } catch (err) {
    console.error('sendSystemMessage gRPC error:', err);
    callback(null, {
      success: false,
      message_id: '',
      chat_id: '',
      error: err.message,
    });
  }
};

// ── GetChatByParticipants
const getChatByParticipants = async (call, callback) => {
  try {
    const { user_id_one, user_id_two } = call.request;

    const chat = await WieChat.findOne({
      participants: { $all: [user_id_one, user_id_two] },
      isActive: true,
    }).lean();

    if (!chat) {
      return callback(null, { success: false, chat_id: '', error: 'Chat not found' });
    }

    callback(null, { success: true, chat_id: chat._id.toString(), error: '' });
  } catch (err) {
    callback(null, { success: false, chat_id: '', error: err.message });
  }
};

const blockUserGrpc = async (call, callback) => {
  try {
    const { blocker_id, blocked_id } = call.request;

    if (!blocker_id || !blocked_id) {
      return callback(null, { success: false, error: 'blocker_id and blocked_id are required' });
    }

    await blockService.blockUser(blocker_id, blocked_id);
    invalidatePermissionCache(blocker_id, blocked_id);

    // Emit real-time block events
    try {
      const io = getIO();
      const chats = await WieChat.find({
        participants: { $all: [blocker_id, blocked_id] }
      }).select('_id').lean();
      const chatIds = chats.map(c => c._id.toString());

      io.to(blocked_id).emit('user-blocked-you', {
        blockerId: blocker_id,
        chatIds,
        timestamp: new Date().toISOString()
      });
      io.to(blocker_id).emit('you-blocked-user', {
        blockedId: blocked_id,
        chatIds,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.error('Socket emit failed in blockUserGrpc:', socketError);
    }

    callback(null, { success: true, error: '' });
  } catch (err) {
    console.error('blockUserGrpc error:', err);
    const isAlreadyBlocked = err.message === 'User is already blocked';
    callback(null, {
      success: false,
      error: isAlreadyBlocked ? err.message : 'Failed to block user'
    });
  }
};

const unblockUserGrpc = async (call, callback) => {
  try {
    const { blocker_id, unblocked_id } = call.request;

    if (!blocker_id || !unblocked_id) {
      return callback(null, { success: false, error: 'blocker_id and unblocked_id are required' });
    }

    await blockService.unblockUser(blocker_id, unblocked_id);
    invalidatePermissionCache(blocker_id, unblocked_id);

    // Restore chat visibility
    await WieChat.updateMany(
      { participants: { $all: [blocker_id, unblocked_id] } },
      { $pull: { deletedFor: unblocked_id } }
    );

    // Emit real-time unblock events
    try {
      const io = getIO();
      const chats = await WieChat.find({
        participants: { $all: [blocker_id, unblocked_id] }
      }).select('_id').lean();
      const chatIds = chats.map(c => c._id.toString());

      io.to(unblocked_id).emit('user-unblocked-you', {
        unblockerId: blocker_id,
        chatIds,
        timestamp: new Date().toISOString()
      });
      io.to(blocker_id).emit('you-unblocked-user', {
        unblockedId: unblocked_id,
        chatIds,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.error('Socket emit failed in unblockUserGrpc:', socketError);
    }

    callback(null, { success: true, error: '' });
  } catch (err) {
    console.error('unblockUserGrpc error:', err);
    callback(null, {
      success: false,
      error: err.message === 'User is not blocked' ? err.message : 'Failed to unblock user'
    });
  }
};

const checkBlockStatusGrpc = async (call, callback) => {
  try {
    const { current_user_id, other_user_id } = call.request;

    if (!current_user_id || !other_user_id) {
      return callback(null, {
        success: false,
        i_blocked_them: false,
        they_blocked_me: false,
        error: 'current_user_id and other_user_id are required'
      });
    }

    const [iBlockedThem, theyBlockedMe] = await Promise.all([
      blockService.isBlockedByUser(current_user_id, other_user_id),
      blockService.isBlockedByUser(other_user_id, current_user_id)
    ]);

    callback(null, {
      success: true,
      i_blocked_them: iBlockedThem,
      they_blocked_me: theyBlockedMe,
      error: ''
    });
  } catch (err) {
    console.error('checkBlockStatusGrpc error:', err);
    callback(null, {
      success: false,
      i_blocked_them: false,
      they_blocked_me: false,
      error: 'Failed to check block status'
    });
  }
};

const reportUserGrpc = async (call, callback) => {
  try {
    const { reporter_id, reported_id, report_type, reason, chat_id, message_ids } = call.request;

    if (!reporter_id || !reported_id || !report_type || !reason) {
      return callback(null, {
        success: false,
        report_id: '',
        error: 'reporter_id, reported_id, report_type, and reason are required'
      });
    }

    const validTypes = ['harassment', 'spam', 'inappropriate', 'threat', 'other'];
    if (!validTypes.includes(report_type)) {
      return callback(null, {
        success: false,
        report_id: '',
        error: `Invalid report_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    let parsedMessageIds = [];
    try {
      parsedMessageIds = message_ids ? JSON.parse(message_ids) : [];
    } catch {
      parsedMessageIds = [];
    }

    const result = await reportService.reportUser(
      reporter_id,
      reported_id,
      { reportType: report_type, reason, chatId: chat_id || null, messageIds: parsedMessageIds }
    );

    callback(null, {
      success: result.success ?? true,
      report_id: result.reportId?.toString() ?? '',
      error: ''
    });
  } catch (err) {
    console.error('reportUserGrpc error:', err);
    callback(null, {
      success: false,
      report_id: '',
      error: err.message === 'You have already reported this user recently'
        ? err.message
        : 'Failed to submit report'
    });
  }
};

// Start server 
export const startChatGrpcServer = (port = 50056) => {
  const server = new grpc.Server();

  server.addService(chatProto.ChatService.service, {
    SendSystemMessage: sendSystemMessage,
    GetChatByParticipants: getChatByParticipants,
    BlockUser: blockUserGrpc,
    UnblockUser: unblockUserGrpc,
    CheckBlockStatus: checkBlockStatusGrpc,
    ReportUser: reportUserGrpc,
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
