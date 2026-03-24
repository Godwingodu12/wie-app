import express from "express";
import {
  getLiveEvents,
  getActiveGroups,
  getTicket,
  getGroup,
  getNearbyEvents,
  getCategoryBasedEvents,
  getFilteredEvents,
  getInitialEvents,
  getEventsByName,
  getEventsByLocation,
  getPopularEvents,
  getCategoryBasedPopularEvents,
  getCancelledEventsController,
  getRehostedEventsController,
  getAllEventsWithDistance,
  saveUserLocation,
  getSavedUserLocation,
} from "../controllers/ticket.controller";
const router: express.Router = express.Router();
router.get("/live-events", getLiveEvents);
router.get("/get-active-groups", getActiveGroups);
router.get("/event/:ticketId", getTicket);
router.get("/group/:groupId", getGroup);
router.get("/nearby-events", getNearbyEvents);
router.get("/all-events", getAllEventsWithDistance);
router.get("/category-events", getCategoryBasedEvents);
router.post("/user-location", saveUserLocation);
router.get("/user-location", getSavedUserLocation);
router.get("/filtered-events", getFilteredEvents);
router.get("/initial-events", getInitialEvents);
router.get("/search-by-name", getEventsByName);
router.get("/search-by-location", getEventsByLocation);
router.get("/popular-events", getPopularEvents);
router.get("/category-popular-events", getCategoryBasedPopularEvents);
router.get("/cancelled-events", getCancelledEventsController);
router.get("/rehosted-events", getRehostedEventsController);
export default router;
