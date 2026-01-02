import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: String,
    required: true,
    index: true
  },
  reportedId: {
    type: String,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['harassment', 'spam', 'inappropriate', 'threat', 'other'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  chatId: {
    type: String,
    index: true
  },
  messageIds: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'action_taken', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: String
  },
  reviewedAt: {
    type: Date
  },
  actionTaken: {
    type: String
  }
}, {
  timestamps: true
});

reportSchema.index({ reporterId: 1, reportedId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;