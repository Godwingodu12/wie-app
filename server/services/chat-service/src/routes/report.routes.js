import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/report', authenticateToken, reportController.reportUser);
router.get('/my-reports', authenticateToken, reportController.getMyReports);

export default router;