import * as reportService from '../services/report.service.js';

export const reportUser = async (req, res) => {
  try {
    const reporterId = req.user._id || req.user.id;
    const { userId, reportType, reason, chatId, messageIds } = req.body;

    if (!userId || !reportType || !reason) {
      return res.status(400).json({
        success: false,
        message: 'User ID, report type, and reason are required'
      });
    }

    if (!['harassment', 'spam', 'inappropriate', 'threat', 'other'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }

    const result = await reportService.reportUser(
      reporterId.toString(),
      userId,
      { reportType, reason, chatId, messageIds }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('Report user error:', error);
    
    if (error.message === 'You have already reported this user recently') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await reportService.getMyReports(userId.toString(), page, limit);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports'
    });
  }
};