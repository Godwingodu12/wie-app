import express from 'express';
import { getLiveEvents,getActiveGroups,getTicket,getGroup,getNearbyEvents,getCategoryBasedEvents,getFilteredEvents,getInitialEvents,getEventsByName,getEventsByLocation,
  getPopularEvents,getCancelledEventsController, getRehostedEventsController
  } from '../controllers/ticket.controller';
const router: express.Router = express.Router();
router.get('/live-events', getLiveEvents);
router.get('/get-active-groups', getActiveGroups);
router.get('/event/:ticketId', getTicket);
router.get('/group/:groupId', getGroup);
router.get('/nearby-events', getNearbyEvents);
router.get('/category-events', getCategoryBasedEvents);
router.get('/filtered-events', getFilteredEvents);
router.get('/initial-events', getInitialEvents);
router.get('/search-by-name', getEventsByName);
router.get('/search-by-location', getEventsByLocation);
router.get('/popular-events', getPopularEvents);
router.get('/cancelled-events', getCancelledEventsController);
router.get('/rehosted-events',  getRehostedEventsController);
export default router;
