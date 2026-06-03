import express from "express";
import {
  registerFreeEvent,
  createBooking,
  verifyPayment,
  getUserBookings,
  getBookingById,
  cancelBooking,
  checkUserBooking,
  getUserCancellationStats,
  trackRefund,
  createSeatedBooking,
  countUnread,
  markAsRead,
  getBookedSeats,
  getDailyBookingStats,
  getMonthlyBookingStats,
  getTicketTypeStats,
  getUserCancelledBookings,
  getUserRehostedBookings,
  getEventUserResponse, cancelPendingBooking
} from "../controllers/bookingController";
import { authenticate } from "../middleware/auth";
const router: express.Router = express.Router();
router.post("/create-seated", authenticate, createSeatedBooking);
router.get("/booked-seats/:ticketId", authenticate, getBookedSeats);
router.post("/register-free", authenticate, registerFreeEvent);
router.post("/create", authenticate, createBooking);
router.get("/check-booking/:ticketId", authenticate, checkUserBooking);
router.post("/verify-payment", authenticate, verifyPayment);
router.get("/my-bookings", authenticate, getUserBookings);
router.get("/cancellation-stats", authenticate, getUserCancellationStats);
router.get("/my-cancelled-bookings", authenticate, getUserCancelledBookings);
router.get("/my-rehosted-bookings", authenticate, getUserRehostedBookings);
router.get("/:bookingId/event-response", authenticate, getEventUserResponse);
router.get("/unread-count", authenticate, countUnread);
router.post("/mark-read", authenticate, markAsRead);
router.get("/:bookingId", authenticate, getBookingById);
router.post("/:bookingId/cancel", authenticate, cancelBooking);
router.get("/:bookingId/refund/track", authenticate, trackRefund);
router.get("/stats/daily/:ticketId", getDailyBookingStats);
router.get("/stats/monthly/:ticketId", getMonthlyBookingStats);
router.get("/stats/ticket-types/:ticketId", getTicketTypeStats);
router.delete("/pending/:bookingId", authenticate, cancelPendingBooking);
export default router;
