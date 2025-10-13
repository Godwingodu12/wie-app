import mongoose from 'mongoose';

const ticketLikeSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  userId: {
    type: String, // Since you're using microservices
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for faster queries
ticketLikeSchema.index({ ticketId: 1, userId: 1 }, { unique: true });

// Index for counting likes per ticket
ticketLikeSchema.index({ ticketId: 1 });

export default mongoose.model('TicketLike', ticketLikeSchema);