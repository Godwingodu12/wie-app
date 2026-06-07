import express from 'express';
import {
  getGroupBookings,
  getEventStatistics,
  verifyTicketQR,
  getEventFeedback,
  exportBookings,
} from '../controllers/adminController';
import { authenticate, isAdmin } from '../middleware/auth';
import { triggerEventCancellationRefunds,createHostLinkedAccount, triggerEventCompletion, getLedgerByTicket} from '../controllers/settlementController';
const router: express.Router = express.Router();
// Admin routes - require admin/organization role
router.get('/group/:groupId/bookings', authenticate, isAdmin, getGroupBookings);
router.get('/event/:ticketId/statistics', authenticate, isAdmin, getEventStatistics);
router.post('/verify-qr', authenticate, isAdmin, verifyTicketQR);
router.get('/event/:ticketId/feedback', authenticate, isAdmin, getEventFeedback);
router.get('/export-bookings', authenticate, isAdmin, exportBookings);
router.post('/settlements/event-cancel-refund', authenticate, triggerEventCancellationRefunds);
router.post('/settlements/host/create-linked-account', authenticate, createHostLinkedAccount);
router.post('/settlements/event/:ticketId/complete',   authenticate, triggerEventCompletion);
router.get('/settlements/ledger/:ticketId',            authenticate, getLedgerByTicket);
export default router;
