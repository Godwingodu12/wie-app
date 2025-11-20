import express from 'express';
import { getLiveEvents,getActiveGroups,getTicket,getGroup,getNearbyEvents,getCategoryBasedEvents } from '../controllers/ticket.controller';
const router: express.Router = express.Router();
// PUBLIC routes - No authentication required
router.get('/live-events', getLiveEvents);
router.get('/get-active-groups', getActiveGroups);
router.get('/event/:ticketId', getTicket);
router.get('/group/:groupId', getGroup);
router.get('/nearby-events', getNearbyEvents);
router.get('/category-events', getCategoryBasedEvents);
export default router;
