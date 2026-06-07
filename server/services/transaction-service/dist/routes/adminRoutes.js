import express from 'express';
import { getGroupBookings, getEventStatistics, verifyTicketQR, getEventFeedback, exportBookings, } from '../controllers/adminController';
import { authenticate, isAdmin } from '../middleware/auth';
const router = express.Router();
// Admin routes - require admin/organization role
router.get('/group/:groupId/bookings', authenticate, isAdmin, getGroupBookings);
router.get('/event/:ticketId/statistics', authenticate, isAdmin, getEventStatistics);
router.post('/verify-qr', authenticate, isAdmin, verifyTicketQR);
router.get('/event/:ticketId/feedback', authenticate, isAdmin, getEventFeedback);
router.get('/export-bookings', authenticate, isAdmin, exportBookings);
export default router;
//# sourceMappingURL=adminRoutes.js.map