import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { SettlementService } from '../services/settlementService';
import RazorpayService from '../config/razorpay';
import { getTicketById, getGroupById, updateTicketStats } from '../clients/ticketServiceClient';
import { updateTicketCancellation, getEventDates,getCancelledEvents } from '../grpc/ticketClient';
import { getUserById } from '../clients/userServiceClient';
import { generateQRCode } from '../utils/qrGenerator';
import { createNotification } from '../utils/notificationHelper';
import { LedgerModel } from '../models/ledger.model';
import { BookingModel, PaymentTransactionModel } from '../models';
async function safeUpdateTicketStats(
  ticketId: string,
  field: 'like' | 'share' | 'totalBookings' | 'totalTicketsSold' | 'revenue',
  value: number
) {
  try {
    await updateTicketStats(ticketId, field, value);
  } catch (error: any) {
    console.error(`⚠️ Could not update ticket ${field}:`, error.message);
  }
}

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

    // Prevent duplicate registration
    const existingBooking = await BookingModel.findOne({
      userId,
      ticketId,
      bookingStatus: { in: ['CONFIRMED', 'PENDING'] },
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

    const bookingId = `FR${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Free event — all amounts are 0, no platform fee
    const booking = await BookingModel.create({
      bookingId,
      userId,
      ticketId,
      groupId:        ticket.groupId,
      ticketType:     ticketTypeId || 'Free Entry',
      quantity,
      pricePerTicket: 0,
      subtotal:       0,
      tax:            0,
      platformFee:    0,   // ✅ no fee for free events
      totalAmount:    0,
      currency:       'INR',
      userDetails: {
        name:  user.name     || '',
        email: user.email    || '',
        phone: user.contactNo || '',
      },
      eventDetails: {
        eventName: ticket.event_name,
        eventDate: ticket.event_dates[0]?.start_date || '',
        eventTime: ticket.event_dates[0]?.start_time || '',
        venue:     ticket.venue || ticket.location   || '',
        location:  ticket.location                   || '',
      },
    });

    // Generate QR and confirm immediately (no payment needed)
    const qrCode = await generateQRCode({
      bookingId: booking.bookingId,
      userId:    booking.userId,
      ticketId:  booking.ticketId,
      eventName: ticket.event_name,
      eventDate: ticket.event_dates[0]?.start_date || '',
      quantity:  booking.quantity,
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
      type:      'booking_confirmed',
      title:     'Registration Confirmed!',
      message:   `Your registration for ${ticket.event_name} is confirmed`,
      bookingId: String(booking.id),
      ticketId,
      link:      `/bookings/${booking.id}`,
    });

    res.status(201).json({
      success: true,
      message: 'Free event registration successful',
      data: { booking: confirmedBooking, qrCode },
    });
  } catch (error: any) {
    console.error('❌ Error registering for free event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId, ticketTypeId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!ticketId || !ticketTypeId || !quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'ticketId, ticketTypeId, and quantity are required',
      });
    }

    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.payment_type === 'free') {
      return res.status(400).json({
        success: false,
        message: 'This is a free event. Use the free registration endpoint instead.',
      });
    }

    const ticketType = ticket.ticket_types.find((tt: any) => tt._id === ticketTypeId);
    if (!ticketType) {
      return res.status(404).json({ success: false, message: 'Ticket type not found' });
    }

    // Check capacity
    if (ticketType.max_capacity) {
      const totalBooked = await BookingModel.countBookedTickets(
        ticketId,
        ticketType.ticket_type
      );
      if (totalBooked + quantity > ticketType.max_capacity) {
        return res.status(400).json({
          success: false,
          message: `Only ${ticketType.max_capacity - totalBooked} tickets available`,
        });
      }
    }

    // Check 50 ticket limit per user per event
    const userExistingBookings = await prisma.booking.aggregate({
      where: {
        userId,
        ticketId,
        bookingStatus: { in: ['CONFIRMED', 'PENDING'] },
      },
      _sum: { quantity: true },
    });
    const totalUserTickets = userExistingBookings._sum.quantity || 0;
    if (totalUserTickets + quantity > 50) {
      return res.status(400).json({
        success: false,
        message: `Maximum 50 tickets per event. You have already booked ${totalUserTickets}.`,
      });
    }

    const user  = await getUserById(userId);
    const group = await getGroupById(ticket.groupId);

    // ── Pricing: host gets full ticket value, WIE charges flat fee on top ────
    // subtotal     = ticket price × qty  → goes to host 100%
    // platformFee  = ₹1 × qty           → wie keeps
    // totalAmount  = subtotal + fee      → user pays this
    const subtotal      = parseFloat((ticketType.ticket_price * quantity).toFixed(2));
    const platformFee   = parseFloat(
      (parseFloat(process.env.PLATFORM_FEE_PER_TICKET || '1') * quantity).toFixed(2)
    );
    const totalAmount   = parseFloat((subtotal + platformFee).toFixed(2));

    const settlementBankDetails =
      ticket.banking_details && ticket.banking_details.length > 0
        ? ticket.banking_details[0]
        : {
            bank_acc_holder: group.primary_bank_acc_holder || 'N/A',
            bank_acc_no:     group.primary_bank_acc_no     || 'N/A',
            bank_ifsc:       group.primary_bank_ifsc        || 'N/A',
            bank_acc_type:   group.primary_bank_acc_type    || 'N/A',
          };

    const bookingId = `BK${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const booking = await BookingModel.create({
      bookingId,
      userId,
      ticketId,
      groupId:        ticket.groupId,
      ticketType:     ticketType.ticket_type,
      quantity,
      pricePerTicket: ticketType.ticket_price,
      subtotal,       // ✅ pure ticket value — host's 100% share
      tax:            0,
      platformFee,    // ✅ ₹1 × qty — wie's flat fee
      totalAmount,    // ✅ what user pays
      currency:       'INR',
      userDetails: {
        name:  user.name      || '',
        email: user.email     || '',
        phone: user.contactNo || '',
      },
      eventDetails: {
        eventName:            ticket.event_name,
        eventDate:            ticket.event_dates[0]?.start_date || '',
        eventTime:            ticket.event_dates[0]?.start_time || '',
        venue:                ticket.venue || ticket.location   || '',
        location:             ticket.location                   || '',
        settlementBankDetails,
        groupName:            group.name || '',
      },
    });

    // Create Razorpay order for totalAmount (what user pays)
    const razorpay = RazorpayService.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );

    const razorpayOrder = await RazorpayService.createOrder(
      razorpay,
      totalAmount,
      'INR',
      bookingId,
      {
        bookingId:          booking.id,
        userId,
        ticketId,
        eventName:          ticket.event_name,
        platformFee,
        organizationAmount: subtotal,  // host's share stored in notes
      }
    );

    await BookingModel.update(booking.id, {
      razorpayOrderId: razorpayOrder.id,
    });

    await PaymentTransactionModel.create({
      bookingId:       booking.id,
      razorpayOrderId: razorpayOrder.id,
      amount:          totalAmount,
      currency:        'INR',
      status:          'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          id:          booking.id,
          bookingId:   booking.bookingId,
          subtotal:    booking.subtotal,     // ₹ host's share
          platformFee: booking.platformFee,  // ₹1 × qty
          totalAmount: booking.totalAmount,  // user pays this
          currency:    booking.currency,
        },
        razorpayOrder: {
          id:       razorpayOrder.id,
          amount:   razorpayOrder.amount,    // in paise
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

    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.payment_type === 'free') {
      return res.status(400).json({
        success: false,
        message: 'This is a free event. Use the free registration endpoint instead.',
      });
    }

    if (!ticket.seating_layout?.seats) {
      return res.status(400).json({
        success: false,
        message: 'This event does not have a seating layout',
      });
    }

    // Check seat availability
    const existingBookings = await BookingModel.findByTicketId(ticketId);
    const bookedSeats = existingBookings
      .filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
      .flatMap((b) => (b.seatDetails as any)?.selectedSeats || []);

    const unavailableSeats = selectedSeats.filter((seat: string) =>
      bookedSeats.includes(seat)
    );
    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seats already booked: ${unavailableSeats.join(', ')}`,
      });
    }

    const user  = await getUserById(userId);
    const group = await getGroupById(ticket.groupId);

    // Build seat details and calculate subtotal from seat prices
    let subtotal = 0;
    const seatDetails: any[] = [];

    selectedSeats.forEach((seatId: string) => {
      const seat = ticket.seating_layout.seats.find((s: any) => s.seatId === seatId);
      if (seat) {
        const seatPrice = seat.price || 0;
        subtotal += seatPrice;
        seatDetails.push({
          seatId:       seat.seatId,
          row:          seat.row,
          column:       seat.column,
          ticketType:   seat.ticketTypeName  || 'Unknown',
          ticketTypeId: seat.ticketTypeId,
          price:        seatPrice,
          color:        seat.ticketTypeColor || '',
        });
      }
    });

    const quantity    = selectedSeats.length;
    subtotal          = parseFloat(subtotal.toFixed(2));
    const platformFee = parseFloat(
      (parseFloat(process.env.PLATFORM_FEE_PER_TICKET || '1') * quantity).toFixed(2)
    );
    const totalAmount = parseFloat((subtotal + platformFee).toFixed(2));

    const settlementBankDetails =
      ticket.banking_details && ticket.banking_details.length > 0
        ? ticket.banking_details[0]
        : {
            bank_acc_holder: group.primary_bank_acc_holder || 'N/A',
            bank_acc_no:     group.primary_bank_acc_no     || 'N/A',
            bank_ifsc:       group.primary_bank_ifsc        || 'N/A',
            bank_acc_type:   group.primary_bank_acc_type    || 'N/A',
          };

    const bookingId = `BK${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const booking = await BookingModel.create({
      bookingId,
      userId,
      ticketId,
      groupId:        ticket.groupId,
      ticketType:     'Seated',
      quantity,
      pricePerTicket: quantity > 0 ? parseFloat((subtotal / quantity).toFixed(2)) : 0,
      subtotal,       // ✅ sum of seat prices — host's 100% share
      tax:            0,
      platformFee,    // ✅ ₹1 × seats — wie's flat fee
      totalAmount,    // ✅ user pays this
      currency:       'INR',
      userDetails: {
        name:  user.name      || '',
        email: user.email     || '',
        phone: user.contactNo || '',
      },
      eventDetails: {
        eventName:            ticket.event_name,
        eventDate:            ticket.event_dates[0]?.start_date || '',
        eventTime:            ticket.event_dates[0]?.start_time || '',
        venue:                ticket.venue || ticket.location   || '',
        location:             ticket.location                   || '',
        settlementBankDetails,
        groupName:            group.name || '',
      },
      selectedSeats,
      seatDetails: { selectedSeats, seats: seatDetails },
    });

    const razorpay = RazorpayService.getInstance(
      process.env.RAZORPAY_KEY_ID!,
      process.env.RAZORPAY_KEY_SECRET!
    );

    const razorpayOrder = await RazorpayService.createOrder(
      razorpay,
      totalAmount,
      'INR',
      bookingId,
      {
        bookingId:          booking.id,
        userId,
        ticketId,
        eventName:          ticket.event_name,
        platformFee,
        organizationAmount: subtotal,
        seatedBooking:      true,
        seatCount:          quantity,
      }
    );

    await BookingModel.update(booking.id, { razorpayOrderId: razorpayOrder.id });

    await PaymentTransactionModel.create({
      bookingId:       booking.id,
      razorpayOrderId: razorpayOrder.id,
      amount:          totalAmount,
      currency:        'INR',
      status:          'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Seated booking created successfully',
      data: {
        booking: {
          id:          booking.id,
          bookingId:   booking.bookingId,
          subtotal:    booking.subtotal,
          platformFee: booking.platformFee,
          totalAmount: booking.totalAmount,
          currency:    booking.currency,
          seatDetails,
        },
        razorpayOrder: {
          id:       razorpayOrder.id,
          amount:   razorpayOrder.amount,
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
export const getBookedSeats = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const bookings = await BookingModel.findByTicketId(ticketId);
    const bookedSeats = bookings
      .filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
      .flatMap((b) => (b.seatDetails as any)?.selectedSeats || []);

    res.json({ success: true, data: { bookedSeats } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
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
      bookingStatus: { in: ['CONFIRMED', 'PENDING'] },
    });

    res.json({
      success: true,
      hasBooked: !!existingBooking,
      booking:   existingBooking || null,
    });
  } catch (error: any) {
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

    const booking = await BookingModel.findByRazorpayOrderId(razorpayOrderId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Verify Razorpay signature
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
        status:           'FAILED',
        errorDescription: 'Invalid payment signature',
      });
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

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
      userId:    booking.userId,
      ticketId:  booking.ticketId,
      eventName: (booking.eventDetails as any).eventName,
      eventDate: (booking.eventDetails as any).eventDate,
      quantity:  booking.quantity,
    });

    // Confirm booking
    const updatedBooking = await BookingModel.update(booking.id, {
      paymentStatus:    'COMPLETED',
      bookingStatus:    'CONFIRMED',
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod:    paymentDetails.method,
      qrCode,
    });

    await PaymentTransactionModel.updateByRazorpayOrderId(razorpayOrderId, {
      status:           'COMPLETED',
      razorpayPaymentId,
      method:           paymentDetails.method,
      bank:             paymentDetails.bank    || undefined,
      wallet:           paymentDetails.wallet  || undefined,
      vpa:              paymentDetails.vpa     || undefined,
      email:            paymentDetails.email   || undefined,
      contact:          paymentDetails.contact ? String(paymentDetails.contact) : undefined,
      webhookData:      paymentDetails as any,
    });

    // Update ticket stats
    await safeUpdateTicketStats(booking.ticketId, 'totalBookings', 1);
    await safeUpdateTicketStats(booking.ticketId, 'totalTicketsSold', booking.quantity);
    await safeUpdateTicketStats(
      booking.ticketId,
      'revenue',
      parseFloat(booking.subtotal.toString()) // only ticket value (host's share) as revenue
    );

    // Notifications
    await createNotification({
      userId,
      type:      'booking_confirmed',
      title:     'Booking Confirmed!',
      message:   `Your booking for ${(booking.eventDetails as any).eventName} is confirmed`,
      bookingId: String(booking.id),
      ticketId:  booking.ticketId,
      link:      `/bookings/${booking.id}`,
    });

    await createNotification({
      userId,
      type:      'payment_success',
      title:     'Payment Successful',
      message:   `Payment of ₹${booking.totalAmount} received successfully`,
      bookingId: String(booking.id),
      ticketId:  booking.ticketId,
    });

    // ── ESCROW: Hold funds until event completes 
    // subtotal = host's 100% ticket value
    // platformFee = wie's flat ₹1 × qty (already stored in booking)
    const organizationAmount = parseFloat(booking.subtotal.toString());
    const platformFee        = parseFloat(booking.platformFee.toString());
    const totalPaid          = parseFloat(booking.totalAmount.toString());

    // Get host's Razorpay linked account (non-blocking if missing)
    let hostRazorpayAccountId: string | undefined;
    try {
      const hostAccount = await prisma.hostLinkedAccount.findUnique({
        where: { group_id: booking.groupId },
      });
      hostRazorpayAccountId = hostAccount?.razorpay_account_id ?? undefined;
    } catch {
      // Host may not have linked account yet — that's ok
    }

    await SettlementService.createEscrowEntry({
      bookingId:            String(booking.id),
      ticketId:             booking.ticketId,
      groupId:              booking.groupId,
      totalAmount:          totalPaid,
      organizationAmount,   // ✅ host's 100% share
      platformFee,          // ✅ wie's flat fee
      bankDetails: (booking.eventDetails as any).settlementBankDetails || {
        bank_acc_holder: process.env.WIE_BANK_ACC_HOLDER || 'WIE Platform',
        bank_acc_no:     process.env.WIE_BANK_ACC_NO     || '',
        bank_ifsc:       process.env.WIE_BANK_IFSC       || '',
        bank_acc_type:   process.env.WIE_BANK_ACC_TYPE   || 'current',
      },
      status:               'HELD',
      host_razorpay_account_id: hostRazorpayAccountId,
    });

    // Record in internal ledger
    await LedgerModel.recordPayment({
      bookingId:   String(booking.id),
      ticketId:    booking.ticketId,
      groupId:     booking.groupId,
      totalAmount: totalPaid,
      platformFee,
      hostAmount:  organizationAmount,
      referenceId: razorpayPaymentId,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { booking: updatedBooking, qrCode },
    });
  } catch (error: any) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, limit = 50, skip = 0 } = req.query;

    const result = await BookingModel.findByUserId(userId, {
      status: status as any,
      limit:  parseInt(limit as string),
      skip:   parseInt(skip as string),
    });

    res.json({
      success: true,
      data: {
        bookings: result.bookings,
        total:    result.total,
        limit:    parseInt(limit as string),
        skip:     parseInt(skip as string),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
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

    res.json({ success: true, data: { booking } });
  } catch (error: any) {
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

    // Validate 4-hour cancellation window
    try {
      const eventDates = await getEventDates(booking.ticketId);
      if (eventDates?.start_date) {
        const eventStartDate = new Date(eventDates.start_date);
        if (eventDates.start_time) {
          const [h, m, s] = eventDates.start_time.split(':');
          eventStartDate.setHours(parseInt(h), parseInt(m), parseInt(s || '0'));
        } else {
          eventStartDate.setHours(0, 0, 0, 0);
        }

        const now                = new Date();
        const fourHoursBefore    = new Date(eventStartDate.getTime() - 4 * 60 * 60 * 1000);
        const hoursUntilEvent    = (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilEvent < 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot cancel. The event has already started or passed.',
          });
        }

        if (now > fourHoursBefore) {
          return res.status(400).json({
            success: false,
            message: `Cannot cancel. Must cancel at least 4 hours before event. ${hoursUntilEvent.toFixed(1)} hours remaining.`,
            hoursUntilEvent: parseFloat(hoursUntilEvent.toFixed(1)),
          });
        }
      }
    } catch (dateErr: any) {
      console.error('❌ Could not fetch event dates:', dateErr.message);
      return res.status(500).json({
        success: false,
        message: 'Unable to verify event timing. Please try again.',
      });
    }

    // Cancel the booking
    const updatedBooking = await BookingModel.cancel(bookingId, cancellationReason);

    const subtotal    = parseFloat(booking.subtotal.toString());
    const platformFee = parseFloat(booking.platformFee.toString());
    const totalPaid   = parseFloat(booking.totalAmount.toString());

    // User cancellation: refund full totalAmount (subtotal + platform fee)
    // Platform fee IS refunded on user cancellation (host didn't cancel)
    const isPaidBooking =
      totalPaid > 0 &&
      booking.paymentStatus === 'COMPLETED' &&
      !!booking.razorpayPaymentId;

    if (isPaidBooking) {
      // ✅ Refund totalAmount — user gets everything back on self-cancellation
      const refundAmount = totalPaid;

      try {
        const razorpay = RazorpayService.getInstance(
          process.env.RAZORPAY_KEY_ID!,
          process.env.RAZORPAY_KEY_SECRET!
        );

        const paymentDetails = await RazorpayService.getPaymentDetails(
          razorpay,
          booking.razorpayPaymentId!.trim()
        );

        if (paymentDetails.status !== 'captured') {
          throw new Error(`Payment not captured. Status: ${paymentDetails.status}`);
        }

        const paidInRupees = parseFloat((paymentDetails.amount / 100).toFixed(2));
        if (refundAmount > paidInRupees) {
          throw new Error(
            `Refund ₹${refundAmount} exceeds payment ₹${paidInRupees}`
          );
        }

        const refund = await RazorpayService.initiateRefund(
          razorpay,
          booking.razorpayPaymentId!.trim(),
          refundAmount,
          {
            booking_id: booking.bookingId,
            reason:     cancellationReason || 'Booking cancelled by user',
          }
        );

        await BookingModel.update(bookingId, {
          refundAmount,
          refundStatus:      'PROCESSING',
          refundId:          refund.id,
          refundInitiatedAt: new Date(),
        });

        await PaymentTransactionModel.create({
          bookingId:         booking.id,
          razorpayOrderId:   booking.razorpayOrderId || `refund_${booking.bookingId}`,
          razorpayPaymentId: booking.razorpayPaymentId ?? undefined,
          amount:            refundAmount,
          currency:          'INR',
          status:            'PROCESSING',
          method:            'refund',
          refundId:          refund.id,
          webhookData: {
            refundId:             refund.id,
            refundStatus:         refund.status,
            refundAmountRupees:   refundAmount,
            subtotalRefunded:     subtotal,
            platformFeeRefunded:  platformFee,  // ✅ platform fee also refunded
            originalPaymentId:    paymentDetails.id,
            cancelledBy:          'user',
          } as any,
        });

        // Update escrow — cancel it so host doesn't get paid
        await SettlementService.markEscrowAsRefunding(booking.ticketId);

        // Record refund in ledger
        await LedgerModel.recordRefund({
          bookingId:   String(booking.id),
          ticketId:    booking.ticketId,
          groupId:     booking.groupId,
          amount:      refundAmount,
          referenceId: refund.id,
          reason:      cancellationReason || 'Cancelled by user',
        });

        await createNotification({
          userId,
          type:      'refund_initiated',
          title:     'Refund Initiated',
          message:   `Full refund of ₹${refundAmount.toFixed(2)} has been initiated. Will be credited within 5–7 business days.`,
          bookingId: String(booking.id),
          ticketId:  booking.ticketId,
        });

      } catch (refundErr: any) {
        console.error('❌ Refund failed:', refundErr.message);

        await BookingModel.update(bookingId, {
          refundStatus: 'FAILED',
          refundAmount: totalPaid,
        });

        await createNotification({
          userId,
          type:      'refund_failed',
          title:     'Refund Will Be Processed Manually',
          message:   `Your booking was cancelled. Refund of ₹${totalPaid.toFixed(2)} will be processed manually within 5–7 business days.`,
          bookingId: String(booking.id),
          ticketId:  booking.ticketId,
        });
      }
    } else {
      // Free event or unpaid booking
      await createNotification({
        userId,
        type:      'booking_cancelled',
        title:     'Registration Cancelled',
        message:   `Your registration for ${(booking.eventDetails as any).eventName} has been cancelled.`,
        bookingId: String(booking.id),
        ticketId:  booking.ticketId,
      });
    }

    // Update ticket stats
    await safeUpdateTicketStats(booking.ticketId, 'totalBookings', -1);
    await safeUpdateTicketStats(booking.ticketId, 'totalTicketsSold', -booking.quantity);
    if (subtotal > 0) {
      await safeUpdateTicketStats(booking.ticketId, 'revenue', -subtotal);
    }
    await updateTicketCancellation(booking.ticketId, 1).catch(console.error);

    const cancellationStats = await BookingModel.getUserCancellationStats(userId).catch(
      () => ({ totalCancellations: 0, totalCancelledTickets: 0 })
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking:          updatedBooking,
        cancellationStats,
        refundStatus:     isPaidBooking
          ? (updatedBooking.refundStatus || 'PROCESSING')
          : 'NOT_APPLICABLE',
      },
    });
  } catch (error: any) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getUserCancellationStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const stats = await BookingModel.getUserCancellationStats(userId);
    res.json({ success: true, data: stats });
  } catch (error: any) {
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
        booking:            result.booking,
        refundTransactions: result.refundTransactions,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getDailyBookingStats = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'ticketId is required',
      });
    }

    const dailyStats = await BookingModel.getDailyBookingStats(ticketId);

    res.json({
      success: true,
      data: dailyStats,
    });
  } catch (error: any) {
    console.error('❌ Error fetching daily booking stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch daily booking stats',
    });
  }
};
export const getMonthlyBookingStats = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { startDate, endDate } = req.query;
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'ticketId is required',
      });
    }

    const stats = await BookingModel.getMonthlyBookingStats(
      ticketId,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Error fetching monthly booking stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch monthly booking stats',
    });
  }
};
export const getTicketTypeStats = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'ticketId is required',
      });
    }
    const typeStats = await BookingModel.getTicketTypeStats(ticketId);
    res.json({
      success: true,
      data: typeStats,
    });
  } catch (error: any) {
    console.error('❌ Error fetching ticket type stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch ticket type stats',
    });
  }
};

export const getUserCancelledBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // GetCancelledEvents returns ALL cancelled tickets/sub-events globally
    let cancelledTicketIds = new Set<string>();
    let cancelledEventMeta: Record<string, { cancellation_reason: string; cancelled_at: string; event_name: string }> = {};

    try {
      const cancelledEvents = await getCancelledEvents();
      cancelledEvents.forEach((ev) => {
        cancelledTicketIds.add(ev.eventId);
        cancelledEventMeta[ev.eventId] = {
          cancellation_reason: ev.cancellation_reason || 'Event cancelled by host',
          cancelled_at:        ev.cancelled_at,
          event_name:          ev.event_name,
        };
      });
    } catch (grpcErr: any) {
      // Non-fatal — gRPC might be unavailable, fall back to DB-only
      console.warn('⚠️ getUserCancelledBookings: gRPC getCancelledEvents failed:', grpcErr.message);
    }

    // Step 2: Fetch ALL bookings for this user (confirmed + cancelled) 
    const { bookings: allUserBookings } = await BookingModel.findByUserId(userId, {
      limit: 200,
    });

    // Step 3: Find bookings whose ticket is admin-cancelled but booking row 
    const staleBookings = allUserBookings.filter(
      (b) =>
        cancelledTicketIds.has(b.ticketId) &&
        (b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING')
    );

    // ── Step 4: Auto-fix stale bookings — mark them as CANCELLED with the reason ──
    if (staleBookings.length > 0) {
      console.log(`🔄 Auto-fixing ${staleBookings.length} stale booking(s) for userId ${userId}`);
      await Promise.all(
        staleBookings.map((b) => {
          const meta = cancelledEventMeta[b.ticketId];
          return BookingModel.update(b.id, {
            bookingStatus:      'CANCELLED',
            cancellationReason: meta?.cancellation_reason || 'Event cancelled by host',
            cancelledAt:        meta?.cancelled_at ? new Date(meta.cancelled_at) : new Date(),
            // Mark refund as PENDING if paid event and no refund started yet
            ...(parseFloat(b.subtotal.toString()) > 0 && !b.refundStatus
              ? { refundStatus: 'PENDING', refundAmount: parseFloat(b.subtotal.toString()) }
              : {}),
          });
        })
      );
    }

    // ── Step 5: Now fetch all CANCELLED bookings for this user (fresh after fix) ──
    const { bookings: cancelledBookings } = await BookingModel.findByUserId(userId, {
      status: 'CANCELLED' as any,
      limit: 200,
    });

    // ── Step 6: Build response, enriching with gRPC metadata where available ──
    const result = cancelledBookings.map((b) => {
      const grpcMeta = cancelledEventMeta[b.ticketId];

      // Detect admin vs user cancellation
      const isAdminCancelled =
        b.cancellationReason?.toLowerCase().includes('event cancelled') ||
        b.cancellationReason?.toLowerCase().includes('cancelled by host') ||
        cancelledTicketIds.has(b.ticketId); // also detect via gRPC cross-ref

      // Use gRPC event name as fallback if eventDetails is stale
      const eventDetails = b.eventDetails as any;
      const enrichedEventDetails = {
        ...eventDetails,
        eventName: eventDetails?.eventName || grpcMeta?.event_name || 'Unknown Event',
      };

      return {
        id:                  b.id,
        bookingId:           b.bookingId,
        userId:              b.userId,
        ticketId:            b.ticketId,
        groupId:             b.groupId,
        ticketType:          b.ticketType,
        quantity:            b.quantity,
        subtotal:            parseFloat(b.subtotal.toString()),
        platformFee:         parseFloat(b.platformFee.toString()),
        totalAmount:         parseFloat(b.totalAmount.toString()),
        currency:            b.currency,
        bookingStatus:       b.bookingStatus,
        paymentStatus:       b.paymentStatus,
        paymentMethod:       b.paymentMethod,
        eventDetails:        enrichedEventDetails,
        userDetails:         b.userDetails,
        qrCode:              b.qrCode,
        isVerified:          b.isVerified,
        // Cancellation
        cancellationReason:  b.cancellationReason || grpcMeta?.cancellation_reason,
        cancelledAt:         b.cancelledAt || (grpcMeta?.cancelled_at ? new Date(grpcMeta.cancelled_at) : null),
        cancelledBy:         isAdminCancelled ? 'host' : 'user',
        isAdminCancelled,
        // Refund
        refundAmount:        b.refundAmount ? parseFloat(b.refundAmount.toString()) : null,
        refundStatus:        b.refundStatus,
        refundId:            b.refundId,
        refundInitiatedAt:   b.refundInitiatedAt,
        refundProcessedAt:   b.refundProcessedAt,
        createdAt:           b.createdAt,
        updatedAt:           b.updatedAt,
      };
    });

    const pendingRefunds   = result.filter(b => b.refundStatus === 'PENDING' || b.refundStatus === 'PROCESSING').length;
    const completedRefunds = result.filter(b => b.refundStatus === 'COMPLETED').length;

    return res.json({
      success: true,
      data: {
        cancelledBookings: result,
        count:             result.length,
        pendingRefunds,
        completedRefunds,
        autoFixed:         staleBookings.length,
      },
    });
  } catch (error: any) {
    console.error('❌ getUserCancelledBookings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
