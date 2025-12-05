import express from 'express';
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
  getBookedSeats
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router: express.Router = express.Router();
router.post('/create-seated', authenticate, createSeatedBooking);
router.get('/booked-seats/:ticketId', authenticate, getBookedSeats);
router.post('/register-free', authenticate, registerFreeEvent);
router.post('/create', authenticate, createBooking);
router.get('/check-booking/:ticketId', authenticate, checkUserBooking);
router.post('/verify-payment', authenticate, verifyPayment);
router.get('/my-bookings', authenticate, getUserBookings);
router.get('/cancellation-stats', authenticate, getUserCancellationStats);
router.get('/:bookingId', authenticate, getBookingById);
router.post('/:bookingId/cancel', authenticate, cancelBooking);
router.get('/:bookingId/refund/track', authenticate, trackRefund);

export default router;
