import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'event_created',
      'group_updated',
      'event_hosted',
      'event_recovered',
      'event_invite',
      'event_cancelled',
      'event_completed',
      'event_updated',
      'ticket_purchased',
      'ticket_cancelled',
      'message_received',
      'follow_request',
      'follow_accepted',
      'comment',
      'like',
      'mention',
      'system',
      'booking_confirmed',
      'payment_success',
      'payment_failed',
      'payment_processing',
      'booking_cancelled',
      'refund_initiated',
      'refund_processing',
      'refund_completed',
      'refund_failed',
      'event_reminder',
      'ticket_verified',
      'qr_code_generated'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  // Optional references
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Additional metadata
  eventName: String,
  link: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  bookingId: {
    type: String,
    ref: 'Booking'
  }
}, {
  timestamps: true
});
// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
