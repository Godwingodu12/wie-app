import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db';
import { SettlementService } from '../services/settlementService';
import RazorpayService from '../config/razorpay';
import { getTicketById, getGroupById, updateTicketStats } from '../clients/ticketServiceClient';
import { getUserById } from '../clients/userServiceClient';
import { generateQRCode } from '../utils/qrGenerator';
import { createNotification } from '../utils/notificationHelper';
import { BookingModel, PaymentTransactionModel } from '../models';
// Helper to safely update ticket stats
async function safeUpdateTicketStats(
  ticketId: string, 
  field: 'like' | 'share' | 'totalBookings' | 'totalTicketsSold' | 'revenue', 
  value: number
) {
  try {
    await updateTicketStats(ticketId, field, value);
    console.log(`✅ Successfully updated ${field}`);
  } catch (error: any) {
    console.error(`⚠️ Warning: Could not update ticket ${field}:`, error.message);
  }
}
// Calculate pricing
const calculatePricing = (
  pricePerTicket: number,
  quantity: number
): {
  subtotal: number;
  tax: number;
  platformFee: number;
  totalAmount: number;
} => {
  const subtotal = pricePerTicket * quantity;
  const taxPercentage = parseFloat(process.env.TAX_PERCENTAGE || '18');
  const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '2');

  const tax = (subtotal * taxPercentage) / 100;
  const platformFee = (subtotal * platformFeePercentage) / 100;
  const totalAmount = subtotal + tax + platformFee;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};
export const registerFreeEvent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId, ticketTypeId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!ticketId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'ticketId and quantity are required',
      });
    }
    const existingBooking = await BookingModel.findOne({
      userId,
      ticketId,
      bookingStatus: {
        in: ['CONFIRMED', 'PENDING']  // Changed from $in to in
      }
    });
    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event',
      });
    }
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.payment_type !== 'free') {
      return res.status(400).json({
        success: false,
        message: 'This is a paid event. Use the booking endpoint instead.',
      });
    }

    const user = await getUserById(userId);

    const rawBank = ticket.banking_details?.[0];
    const settlementBankDetails = rawBank
      ? {
          bank_acc_holder: rawBank.bank_acc_holder || '',
          bank_acc_no: rawBank.bank_acc_no || '',
          bank_ifsc: rawBank.bank_ifsc || '',
          bank_acc_type: rawBank.bank_acc_type || '',
        }
      : undefined;

    const bookingId = `FR${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const booking = await BookingModel.create({
      bookingId,
      userId,
      ticketId,
      groupId: ticket.groupId,
      ticketType: ticketTypeId || 'Free Entry',
      quantity,
      pricePerTicket: 0,
      subtotal: 0,
      tax: 0,
      platformFee: 0,
      totalAmount: 0,
      currency: 'INR',
      userDetails: {
        name: user.name || '',
        email: user.email || '',
        phone: user.contactNo || '',
      },
      eventDetails: {
        eventName: ticket.event_name,
        eventDate: ticket.event_dates[0]?.start_date || '',
        eventTime: ticket.event_dates[0]?.start_time || '',
        venue: ticket.venue || ticket.location || '',
        location: ticket.location || '',
        settlementBankDetails,
      },
    });

    const qrCode = await generateQRCode({
      bookingId: booking.bookingId,
      userId: booking.userId,
      ticketId: booking.ticketId,
      eventName: ticket.event_name,
      eventDate: ticket.event_dates[0]?.start_date || '',
      quantity: booking.quantity,
    });

    const confirmedBooking = await BookingModel.update(booking.id, {
      paymentStatus: 'COMPLETED',
      bookingStatus: 'CONFIRMED',
      qrCode,
    });
    await safeUpdateTicketStats(ticketId, 'totalBookings', 1);
    await safeUpdateTicketStats(ticketId, 'totalTicketsSold', quantity);
    await createNotification({
      userId,
      type: 'booking_confirmed',
      title: 'Registration Confirmed!',
      message: `Your registration for ${ticket.event_name} is confirmed`,
      bookingId: String(booking.id),
      ticketId,
      link: `/bookings/${booking.id}`,
    });
    res.status(201).json({
      success: true,
      message: 'Free event registration successful',
      data: {
        booking: confirmedBooking,
        qrCode,
      },
    });
  } catch (error: any) {
    console.error('❌ Error registering for free event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Create Booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId, ticketTypeId, quantity } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    // Validate input
    if (!ticketId || !ticketTypeId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'ticketId, ticketTypeId, and quantity are required',
      });
    }
    // Fetch ticket details
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    // Check if event is free
    if (ticket.payment_type === 'free') {
      return res.status(400).json({
        success: false,
        message: 'This is a free event. Use the free registration endpoint instead.',
      });
    }
    // Find ticket type
    const ticketType = ticket.ticket_types.find((tt) => tt._id === ticketTypeId);
    if (!ticketType) {
      return res.status(404).json({ success: false, message: 'Ticket type not found' });
    }
    // Check capacity
    if (ticketType.max_capacity) {
      const totalBooked = await BookingModel.countBookedTickets(ticketId, ticketType.ticket_type);

      if (totalBooked + quantity > ticketType.max_capacity) {
        return res.status(400).json({
          success: false,
          message: `Only ${ticketType.max_capacity - totalBooked} tickets available`,
        });
      }
    }
    // Get user details
    const user = await getUserById(userId);
    // Calculate pricing WITH PLATFORM FEE
    const subtotal = ticketType.ticket_price * quantity;
    const platformFee = parseFloat(process.env.PLATFORM_FEE_PER_TICKET || '1') * quantity;
    const tax = 0; // No tax
    const totalAmount = subtotal + platformFee;
    const pricing = {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };
    // Get group details for settlement tracking
    const group = await getGroupById(ticket.groupId);
    // Generate booking ID
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    // Store admin's bank details for settlement
    const settlementBankDetails = ticket.banking_details && ticket.banking_details.length > 0
      ? ticket.banking_details[0]
      : {
          bank_acc_holder: group.primary_bank_acc_holder || 'N/A',
          bank_acc_no: group.primary_bank_acc_no || 'N/A',
          bank_ifsc: group.primary_bank_ifsc || 'N/A',
          bank_acc_type: group.primary_bank_acc_type || 'N/A',
        };
    // ✅ CHECK: Maximum 50 tickets per user per event
    const userExistingBookings = await prisma.booking.aggregate({
      where: {
        userId,
        ticketId,
        bookingStatus: { in: ['CONFIRMED', 'PENDING'] },
      },
      _sum: {
        quantity: true,
      },
    });
    const totalUserTickets = userExistingBookings._sum.quantity || 0;
    if (totalUserTickets + quantity > 50) {
      return res.status(400).json({
        success: false,
        message: `You can only book a maximum of 50 tickets per event. You have already booked ${totalUserTickets} tickets.`,
      });
    }
    // Create booking using model
    const booking = await BookingModel.create({
      bookingId,
      userId,
      ticketId,
      groupId: ticket.groupId,
      ticketType: ticketType.ticket_type,
      quantity,
      pricePerTicket: ticketType.ticket_price,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      platformFee: pricing.platformFee,
      totalAmount: pricing.totalAmount,
      currency: 'INR',
      userDetails: {
        name: user.name || '',
        email: user.email || '',
        phone: user.contactNo || '',
      },
      eventDetails: {
        eventName: ticket.event_name,
        eventDate: ticket.event_dates[0]?.start_date || '',
        eventTime: ticket.event_dates[0]?.start_time || '',
        venue: ticket.venue || ticket.location || '',
        location: ticket.location || '',
        settlementBankDetails, // Store for settlement tracking
        groupName: group.name || '',
      },
    });
    // Create Razorpay order using WIE platform's credentials
    const razorpay = RazorpayService.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );

    const razorpayOrder = await RazorpayService.createOrder(
      razorpay,
      pricing.totalAmount,
      'INR',
      bookingId,
      {
        bookingId: booking.id,
        userId,
        ticketId,
        eventName: ticket.event_name,
        platformFee: pricing.platformFee,
        organizationAmount: pricing.subtotal,
      }
    );
    // Update booking with Razorpay order ID
    await BookingModel.update(booking.id, {
      razorpayOrderId: razorpayOrder.id,
    });
    // Create payment transaction log
    await PaymentTransactionModel.create({
      bookingId: booking.id,
      razorpayOrderId: razorpayOrder.id,
      amount: pricing.totalAmount,
      currency: 'INR',
      status: 'PENDING',
    });
    // Send notification
    await createNotification({
      userId,
      type: 'booking_pending',
      title: 'Booking Created',
      message: `Your booking for ${ticket.event_name} is pending payment`,
      bookingId: String(booking.id),      ticketId,
      link: `/bookings/${booking.id}`,
    });
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          id: booking.id,
          bookingId: booking.bookingId,
          subtotal: booking.subtotal,
          platformFee: booking.platformFee,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
        },
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Create Seated Booking
export const createSeatedBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId, selectedSeats } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!ticketId || !selectedSeats || selectedSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ticketId and selectedSeats are required',
      });
    }

    // Fetch ticket details
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if event is free
    if (ticket.payment_type === 'free') {
      return res.status(400).json({
        success: false,
        message: 'This is a free event. Use the free registration endpoint instead.',
      });
    }
    if (!ticket.seating_layout || !ticket.seating_layout.seats) {
      return res.status(400).json({
        success: false,
        message: 'This event does not have a seating layout',
      });
    }
    const existingBookings = await BookingModel.findByTicketId(ticketId);
    const bookedSeats = existingBookings
      .filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
      .flatMap(b => {
        const seatDetails = b.seatDetails as any;
        return seatDetails?.selectedSeats || [];
      });
    const unavailableSeats = selectedSeats.filter((seat: string) => bookedSeats.includes(seat));
    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seats already booked: ${unavailableSeats.join(', ')}`,
      });
    }
    const user = await getUserById(userId);
    let subtotal = 0;
    const seatDetails: any[] = [];
    const seatingLayout = ticket.seating_layout;
    if (!seatingLayout) {
      return res.status(400).json({
        success: false,
        message: 'Seating layout is not available',
      });
    }
    selectedSeats.forEach((seatId: string) => {
      const seat = seatingLayout.seats.find((s: any) => s.seatId === seatId);
      if (seat) {
        // ✅ Use price directly from seat
        const seatPrice = seat.price || 0;
        subtotal += seatPrice;
        seatDetails.push({
          seatId: seat.seatId,
          row: seat.row,
          column: seat.column,
          ticketType: seat.ticketTypeName || 'Unknown',
          ticketTypeId: seat.ticketTypeId,
          price: seatPrice,
          color: seat.ticketTypeColor,
        });
      }
    });
    const quantity = selectedSeats.length;
    const platformFee = parseFloat(process.env.PLATFORM_FEE_PER_TICKET || '1') * quantity;
    const tax = 0;
    const totalAmount = subtotal + platformFee;

    const pricing = {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    };

    // Get group details
    const group = await getGroupById(ticket.groupId);

    // Generate booking ID
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Get settlement bank details
    const settlementBankDetails = ticket.banking_details && ticket.banking_details.length > 0
      ? ticket.banking_details[0]
      : {
          bank_acc_holder: group.primary_bank_acc_holder || 'N/A',
          bank_acc_no: group.primary_bank_acc_no || 'N/A',
          bank_ifsc: group.primary_bank_ifsc || 'N/A',
          bank_acc_type: group.primary_bank_acc_type || 'N/A',
        };
    // Create booking
    const booking = await BookingModel.create({
      bookingId,
      userId,
      ticketId,
      groupId: ticket.groupId,
      ticketType: 'Seated',
      quantity,
      pricePerTicket: subtotal / quantity,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      platformFee: pricing.platformFee,
      totalAmount: pricing.totalAmount,
      currency: 'INR',
      userDetails: {
        name: user.name || '',
        email: user.email || '',
        phone: user.contactNo || '',
      },
      eventDetails: {
        eventName: ticket.event_name,
        eventDate: ticket.event_dates[0]?.start_date || '',
        eventTime: ticket.event_dates[0]?.start_time || '',
        venue: ticket.venue || ticket.location || '',
        location: ticket.location || '',
        settlementBankDetails,
        groupName: group.name || '',
      },
      selectedSeats, // Add this line
      seatDetails: {
        selectedSeats,
        seats: seatDetails,
      },
    });
    // Create Razorpay order
    const razorpay = RazorpayService.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );

    const razorpayOrder = await RazorpayService.createOrder(
      razorpay,
      pricing.totalAmount,
      'INR',
      bookingId,
      {
        bookingId: booking.id,
        userId,
        ticketId,
        eventName: ticket.event_name,
        platformFee: pricing.platformFee,
        organizationAmount: pricing.subtotal,
        seatedBooking: true,
        seatCount: quantity,
      }
    );

    // Update booking with Razorpay order ID
    await BookingModel.update(booking.id, {
      razorpayOrderId: razorpayOrder.id,
    });

    // Create payment transaction log
    await PaymentTransactionModel.create({
      bookingId: booking.id,
      razorpayOrderId: razorpayOrder.id,
      amount: pricing.totalAmount,
      currency: 'INR',
      status: 'PENDING',
    });

    // Send notification
    await createNotification({
      userId,
      type: 'booking_pending',
      title: 'Booking Created',
      message: `Your booking for ${ticket.event_name} is pending payment`,
      bookingId: String(booking.id),
      ticketId,
      link: `/bookings/${booking.id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Seated booking created successfully',
      data: {
        booking: {
          id: booking.id,
          bookingId: booking.bookingId,
          subtotal: booking.subtotal,
          platformFee: booking.platformFee,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          seatDetails: seatDetails,
        },
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating seated booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get booked seats for an event
export const getBookedSeats = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const bookings = await BookingModel.findByTicketId(ticketId);
    
    const bookedSeats = bookings
      .filter(b => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
      .flatMap(b => {
        // Access seatDetails from JSON field
        const seatDetails = b.seatDetails as any;
        return seatDetails?.selectedSeats || [];
      });

    res.json({
      success: true,
      data: { bookedSeats },
    });
  } catch (error: any) {
    console.error('❌ Error fetching booked seats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Check if user has already booked a specific event
export const checkUserBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const existingBooking = await BookingModel.findOne({
      userId,
      ticketId,
      bookingStatus: {
        in: ['CONFIRMED', 'PENDING']
      }
    });

    res.json({
      success: true,
      hasBooked: !!existingBooking,
      booking: existingBooking || null,
    });
  } catch (error: any) {
    console.error('❌ Error checking booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters',
      });
    }

    // Find booking
    const booking = await BookingModel.findByRazorpayOrderId(razorpayOrderId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // ✅ Verify signature using WIE platform's Razorpay secret
    const isValid = RazorpayService.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET!
    );

    if (!isValid) {
      await BookingModel.update(booking.id, {
        paymentStatus: 'FAILED',
        bookingStatus: 'CANCELLED',
      });

      await PaymentTransactionModel.updateByRazorpayOrderId(razorpayOrderId, {
        status: 'FAILED',
        errorDescription: 'Invalid payment signature',
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // ✅ Fetch payment details using WIE platform's Razorpay credentials
    const razorpay = RazorpayService.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );

    const paymentDetails = await RazorpayService.getPaymentDetails(
      razorpay,
      razorpayPaymentId
    );

    // Generate QR code
    const qrCode = await generateQRCode({
      bookingId: booking.bookingId,
      userId: booking.userId,
      ticketId: booking.ticketId,
      eventName: (booking.eventDetails as any).eventName,
      eventDate: (booking.eventDetails as any).eventDate,
      quantity: booking.quantity,
    });

    // Update booking as confirmed
    const updatedBooking = await BookingModel.update(booking.id, {
      paymentStatus: 'COMPLETED',
      bookingStatus: 'CONFIRMED',
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: paymentDetails.method,
      qrCode,
    });

    // Update transaction log
    await PaymentTransactionModel.updateByRazorpayOrderId(razorpayOrderId, {
      status: 'COMPLETED',
      razorpayPaymentId,
      method: paymentDetails.method,
      bank: paymentDetails.bank || undefined,
      wallet: paymentDetails.wallet || undefined,
      vpa: paymentDetails.vpa || undefined,
      email: paymentDetails.email || undefined,
      contact: paymentDetails.contact ? String(paymentDetails.contact) : undefined,
      webhookData: paymentDetails as any,
    });

    // Update ticket stats
    await safeUpdateTicketStats(booking.ticketId, 'totalBookings', 1);
    await safeUpdateTicketStats(booking.ticketId, 'totalTicketsSold', booking.quantity);
    const ticketRevenue = parseFloat(booking.subtotal.toString());
    await safeUpdateTicketStats(booking.ticketId, 'revenue', ticketRevenue);
    // Send notifications
    await createNotification({
      userId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed! 🎉',
      message: `Your booking for ${(booking.eventDetails as any).eventName} is confirmed`,
      bookingId: String(booking.id),
      ticketId: booking.ticketId,
      link: `/bookings/${booking.id}`,
    });

    await createNotification({
      userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Payment of ₹${booking.totalAmount} received successfully`,
      bookingId: String(booking.id),
      ticketId: booking.ticketId,
    });
    // ✅ Create settlement record
    const { organizationAmount, platformFee } = SettlementService.calculateSettlement(
      parseFloat(booking.totalAmount.toString()),
      1, // ₹1 per ticket
      booking.quantity
    );

    await SettlementService.createSettlement({
      bookingId: booking.id,
      organizationAmount,
      platformFee,
      bankDetails: (booking.eventDetails as any).settlementBankDetails,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        booking: updatedBooking,
        qrCode,
      },
    });
  } catch (error: any) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get User Bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, limit = 50, skip = 0 } = req.query;

    const result = await BookingModel.findByUserId(userId, {
      status: status as any,
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
    });

    res.json({
      success: true,
      data: {
        bookings: result.bookings,
        total: result.total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error: any) {
    console.error('❌ Error fetching booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }
    // Cancel booking and increment cancellation count
    const updatedBooking = await BookingModel.cancel(bookingId, cancellationReason);
    // If payment was completed, initiate refund
    if (booking.paymentStatus === 'COMPLETED' && booking.razorpayPaymentId) {
      const ticketAmount = parseFloat(booking.subtotal.toString());
      const refundAmount = parseFloat(ticketAmount.toFixed(2)); // Ensure 2 decimal places
      try {
        const razorpay = RazorpayService.getInstance(
          process.env.RAZORPAY_KEY_ID!,
          process.env.RAZORPAY_KEY_SECRET!
        );
        
        // Get payment details to fetch UPI/payment info
        const paymentDetails = await RazorpayService.getPaymentDetails(
          razorpay,
          booking.razorpayPaymentId.trim()
        );

        console.log('💳 Payment Details:', {
          id: paymentDetails.id,
          status: paymentDetails.status,
          method: paymentDetails.method,
          amount: parseFloat((paymentDetails.amount / 100).toFixed(2)),
          captured: paymentDetails.captured,
          vpa: paymentDetails.vpa || paymentDetails.upi?.vpa,
        });

        if (paymentDetails.status !== 'captured' || !paymentDetails.captured) {
          throw new Error(`Payment cannot be refunded. Status: ${paymentDetails.status}`);
        }

        // Initiate refund with payment method info
        const refund = await RazorpayService.initiateRefund(
          razorpay,
          booking.razorpayPaymentId.trim(),
          refundAmount,
          { 
            booking_id: booking.bookingId,
            reason: (cancellationReason || 'Booking cancelled').substring(0, 512),
            ticket_amount: parseFloat(ticketAmount.toFixed(2)),
            platform_fee_retained: parseFloat(booking.platformFee.toString()),
          }
        );

        console.log('✅ Refund initiated successfully:', {
          refundId: refund.id,
          status: refund.status,
          amount: parseFloat((refund.amount / 100).toFixed(2)),
          paymentMethod: paymentDetails.method,
          vpa: paymentDetails.vpa || paymentDetails.upi?.vpa,
        });

        // Update booking with refund info
        await BookingModel.update(bookingId, {
          refundAmount: refundAmount,
          refundStatus: 'PROCESSING',
          refundId: refund.id,
          refundInitiatedAt: new Date(),
        });

        // Log refund transaction with payment method details
        await PaymentTransactionModel.create({
          bookingId: booking.id,
          razorpayOrderId: booking.razorpayOrderId || `refund_${booking.razorpayPaymentId}`,
          razorpayPaymentId: booking.razorpayPaymentId,
          amount: refundAmount,
          currency: 'INR',
          status: 'PROCESSING',
          method: 'refund',
          refundId: refund.id,
          vpa: paymentDetails.vpa || paymentDetails.upi?.vpa || undefined,
          webhookData: {
            refund: {
              id: refund.id,
              status: refund.status,
              amount: parseFloat((refund.amount / 100).toFixed(2)), // Convert to rupees with 2 decimals
              amount_in_paise: refund.amount,
              speed: refund.speed,
            },
            original_payment: {
              id: paymentDetails.id,
              method: paymentDetails.method,
              vpa: paymentDetails.vpa || paymentDetails.upi?.vpa,
              amount: parseFloat((paymentDetails.amount / 100).toFixed(2)), // Convert to rupees with 2 decimals
              amount_in_paise: paymentDetails.amount,
            },
            refundInitiatedAt: new Date().toISOString(),
            ticketAmount: parseFloat(ticketAmount.toFixed(2)),
            platformFeeRetained: parseFloat(booking.platformFee.toString()),
            totalAmountPaid: parseFloat(booking.totalAmount.toString()),
          } as any,
        });

        await createNotification({
          userId,
          type: 'refund_initiated',
          title: 'Refund Initiated',
          message: `Refund of ₹${refundAmount.toFixed(2)} has been initiated to your ${paymentDetails.method === 'upi' ? 'UPI' : paymentDetails.method} account. Platform fee of ₹${parseFloat(booking.platformFee.toString()).toFixed(2)} is non-refundable. Amount will be credited within 5-7 business days.`,
          bookingId: String(booking.id),
          ticketId: booking.ticketId,
        });

      } catch (refundError: any) {
        console.error('❌ Refund initiation failed:', {
          error: refundError.message,
          bookingId: booking.bookingId,
          amount: refundAmount,
        });
        
        await BookingModel.update(bookingId, {
          refundStatus: 'FAILED',
          refundAmount: refundAmount,
        });
        
        await createNotification({
          userId,
          type: 'refund_failed',
          title: 'Refund Processing',
          message: `Your booking has been cancelled. Refund of ₹${refundAmount.toFixed(2)} will be processed manually within 5-7 business days.`,
          bookingId: String(booking.id),
          ticketId: booking.ticketId,
        });
      }
    }
    // Update ticket stats (always update, regardless of refund status)
    try {
      // Update ticket stats (always update, regardless of refund status)
      await safeUpdateTicketStats(booking.ticketId, 'totalBookings', -1);
      await safeUpdateTicketStats(booking.ticketId, 'totalTicketsSold', -booking.quantity);
      const ticketRevenue = parseFloat(booking.subtotal.toString());
      await safeUpdateTicketStats(booking.ticketId, 'revenue', -ticketRevenue);
    } catch (statsError) {
      console.error('❌ Error updating ticket stats:', statsError);
      // Don't fail the cancellation if stats update fails
    }

    // Get user's cancellation stats
    let cancellationStats;
    try {
      cancellationStats = await BookingModel.getUserCancellationStats(userId);
    } catch (statsError) {
      console.error('❌ Error getting cancellation stats:', statsError);
      cancellationStats = { totalCancellations: 0, totalCancelledTickets: 0 };
    }

    // Send cancellation notification
    await createNotification({
      userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for ${(booking.eventDetails as any).eventName} has been cancelled successfully`,
      bookingId: String(booking.id),
      ticketId: booking.ticketId,
    });
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { 
        booking: updatedBooking,
        cancellationStats,
        refundStatus: booking.paymentStatus === 'COMPLETED' ? 
          (updatedBooking.refundStatus || 'PROCESSING') : 
          'NOT_APPLICABLE',
      },
    });
  } catch (error: any) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to cancel booking'
    });
  }
};
// Get user's cancellation statistics
export const getUserCancellationStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const stats = await BookingModel.getUserCancellationStats(userId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Error fetching cancellation stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const trackRefund = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const result = await BookingModel.getRefundDetails(bookingId);
    if (!result.booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (result.booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({
      success: true,
      data: {
        booking: result.booking,
        refundTransactions: result.refundTransactions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
