import express from 'express';
import {
  registerFreeEvent,
  createBooking,
  verifyPayment,
  getUserBookings,
  getBookingById,
  cancelBooking,
  checkUserBooking,getUserCancellationStats,trackRefund
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
const router: express.Router = express.Router();
// User routes
router.post('/register-free', authenticate, registerFreeEvent);
router.post('/create', authenticate, createBooking);
router.get('/check-booking/:ticketId', authenticate, checkUserBooking);
router.post('/verify-payment', authenticate, verifyPayment);
router.get('/my-bookings', authenticate, getUserBookings);
router.get('/:bookingId', authenticate, getBookingById);
router.post('/:bookingId/cancel', authenticate, cancelBooking);
router.get('/cancellation-stats', authenticate, getUserCancellationStats);
router.get('/:bookingId/refund/track', authenticate, trackRefund);
export default router;
