import Report from '../models/report.model.js';

export const reportUser = async (reporterId, reportedId, data) => {
  if (reporterId === reportedId) {
    throw new Error('Cannot report yourself');
  }

  // Check if already reported recently (within 24 hours)
  const recentReport = await Report.findOne({
    reporterId,
    reportedId,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  if (recentReport) {
    throw new Error('You have already reported this user recently');
  }

  const report = await Report.create({
    reporterId,
    reportedId,
    reportType: data.reportType,
    reason: data.reason,
    chatId: data.chatId,
    messageIds: data.messageIds || [],
    status: 'pending'
  });

  return {
    success: true,
    message: 'Report submitted successfully. Our team will review it.',
    reportId: report._id
  };
};

export const getMyReports = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find({ reporterId: userId })
      .select('reportedId reportType reason status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments({ reporterId: userId })
  ]);

  return {
    reports,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};