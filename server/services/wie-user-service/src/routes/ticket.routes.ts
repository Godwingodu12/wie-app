import express from 'express';
import {
  getLiveEvents,
  getActiveGroups,
  getTicket,
  getGroup,
} from '../controllers/ticket.controller';
const router: express.Router = express.Router();
// PUBLIC routes - No authentication required
router.get('/live-events', getLiveEvents);
router.get('/groups', getActiveGroups);
router.get('/ticket/:ticketId', getTicket);
router.get('/group/:groupId', getGroup);

export default router;