import { prisma } from '../config/db';
import { SettlementService } from '../services/settlementService';
import RazorpayService from '../config/razorpay';
import { getTicketById, getGroupById, updateTicketStats } from '../clients/ticketServiceClient';
import { getUserById } from '../clients/userServiceClient';
import { generateQRCode } from '../utils/qrGenerator';
import { createNotification } from '../utils/notificationHelper';
import { BookingModel, PaymentTransactionModel } from '../models';
// Calculate pricing
const calculatePricing = (pricePerTicket, quantity) => {
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
export const registerFreeEvent = async (req, res) => {
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
                in: ['CONFIRMED', 'PENDING'] // Changed from $in to in
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
        await updateTicketStats(ticketId, 'totalBookings', 1);
        await updateTicketStats(ticketId, 'totalTicketsSold', quantity);
        // ✅ FIX: Convert booking.id to string
        await createNotification({
            userId,
            type: 'booking_confirmed',
            title: 'Registration Confirmed! 🎉',
            message: `Your registration for ${ticket.event_name} is confirmed`,
            bookingId: String(booking.id), // Convert to string
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
    }
    catch (error) {
        console.error('❌ Error registering for free event:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Create Booking
export const createBooking = async (req, res) => {
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
        const razorpay = RazorpayService.getInstance(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
        const razorpayOrder = await RazorpayService.createOrder(razorpay, pricing.totalAmount, 'INR', bookingId, {
            bookingId: booking.id,
            userId,
            ticketId,
            eventName: ticket.event_name,
            platformFee: pricing.platformFee,
            organizationAmount: pricing.subtotal,
        });
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
            bookingId: String(booking.id), ticketId,
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
    }
    catch (error) {
        console.error('❌ Error creating booking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Check if user has already booked a specific event
export const checkUserBooking = async (req, res) => {
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
    }
    catch (error) {
        console.error('❌ Error checking booking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const verifyPayment = async (req, res) => {
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
        const isValid = RazorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, process.env.RAZORPAY_KEY_SECRET);
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
        const razorpay = RazorpayService.getInstance(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
        const paymentDetails = await RazorpayService.getPaymentDetails(razorpay, razorpayPaymentId);
        // Generate QR code
        const qrCode = await generateQRCode({
            bookingId: booking.bookingId,
            userId: booking.userId,
            ticketId: booking.ticketId,
            eventName: booking.eventDetails.eventName,
            eventDate: booking.eventDetails.eventDate,
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
            webhookData: paymentDetails,
        });
        // Update ticket stats
        await updateTicketStats(booking.ticketId, 'totalBookings', 1);
        await updateTicketStats(booking.ticketId, 'totalTicketsSold', booking.quantity);
        await updateTicketStats(booking.ticketId, 'revenue', parseFloat(booking.totalAmount.toString()));
        // Send notifications
        await createNotification({
            userId,
            type: 'booking_confirmed',
            title: 'Booking Confirmed! 🎉',
            message: `Your booking for ${booking.eventDetails.eventName} is confirmed`,
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
        const { organizationAmount, platformFee } = SettlementService.calculateSettlement(parseFloat(booking.totalAmount.toString()), 1, // ₹1 per ticket
        booking.quantity);
        await SettlementService.createSettlement({
            bookingId: booking.id,
            organizationAmount,
            platformFee,
            bankDetails: booking.eventDetails.settlementBankDetails,
        });
        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                booking: updatedBooking,
                qrCode,
            },
        });
    }
    catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get User Bookings
export const getUserBookings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { status, limit = 50, skip = 0 } = req.query;
        const result = await BookingModel.findByUserId(userId, {
            status: status,
            limit: parseInt(limit),
            skip: parseInt(skip),
        });
        res.json({
            success: true,
            data: {
                bookings: result.bookings,
                total: result.total,
                limit: parseInt(limit),
                skip: parseInt(skip),
            },
        });
    }
    catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get Booking by ID
export const getBookingById = async (req, res) => {
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
    }
    catch (error) {
        console.error('❌ Error fetching booking:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
export const cancelBooking = async (req, res) => {
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
            const refundAmount = parseFloat(booking.totalAmount.toString());
            console.log('💵 Processing refund for booking:', {
                bookingId: booking.bookingId,
                totalAmount: booking.totalAmount,
                refundAmount: refundAmount,
                paymentId: booking.razorpayPaymentId,
            });
            try {
                const razorpay = RazorpayService.getInstance(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
                // ✅ Step 1: Verify payment exists and is captured
                console.log('🔍 Verifying payment status...');
                const paymentDetails = await RazorpayService.getPaymentDetails(razorpay, booking.razorpayPaymentId.trim());
                console.log('💰 Payment verification:', {
                    id: paymentDetails.id,
                    status: paymentDetails.status,
                    amount: paymentDetails.amount / 100, // Convert to rupees
                    captured: paymentDetails.captured,
                    method: paymentDetails.method,
                });
                // Check if payment is refundable
                if (paymentDetails.status !== 'captured' || !paymentDetails.captured) {
                    throw new Error(`Payment cannot be refunded. Status: ${paymentDetails.status}`);
                }
                // ✅ Step 2: Initiate refund
                console.log('💸 Initiating refund...');
                const refund = await RazorpayService.initiateRefund(razorpay, booking.razorpayPaymentId.trim(), refundAmount, {
                    booking_id: booking.bookingId,
                    reason: cancellationReason || 'Booking cancelled',
                });
                console.log('✅ Refund created:', {
                    refundId: refund.id,
                    status: refund.status,
                    amount: refund.amount / 100,
                });
                // ✅ Step 3: Update booking with refund info
                await BookingModel.update(bookingId, {
                    refundAmount: refundAmount,
                    refundStatus: 'PROCESSING',
                });
                // ✅ Step 4: Log refund transaction
                try {
                    await PaymentTransactionModel.create({
                        bookingId: booking.id,
                        razorpayOrderId: booking.razorpayOrderId || `refund_${booking.razorpayPaymentId}`,
                        razorpayPaymentId: booking.razorpayPaymentId,
                        amount: refundAmount,
                        currency: 'INR',
                        status: 'PROCESSING',
                        method: 'refund',
                        webhookData: {
                            refund: {
                                id: refund.id,
                                status: refund.status,
                                amount: refund.amount,
                            },
                            refundInitiatedAt: new Date().toISOString(),
                        },
                    });
                }
                catch (txError) {
                    console.error('⚠️ Failed to create refund transaction log:', txError);
                    // Don't fail the refund if logging fails
                }
                // ✅ Step 5: Notify user
                await createNotification({
                    userId,
                    type: 'refund_initiated',
                    title: 'Refund Initiated',
                    message: `Refund of ₹${refundAmount} (including ₹${booking.platformFee} platform fee) has been initiated. It will be credited within 5-7 business days.`,
                    bookingId: String(booking.id),
                    ticketId: booking.ticketId,
                });
                console.log('✅ Refund process completed successfully');
            }
            catch (refundError) {
                console.error('❌ Refund failed:', {
                    error: refundError.message,
                    bookingId: booking.bookingId,
                    amount: refundAmount,
                });
                // Mark refund as failed
                await BookingModel.update(bookingId, {
                    refundStatus: 'FAILED',
                    refundAmount: refundAmount,
                });
                // Notify user about manual refund
                await createNotification({
                    userId,
                    type: 'refund_failed',
                    title: 'Refund Processing',
                    message: `Your booking has been cancelled. Refund of ₹${refundAmount} will be processed manually. Booking ID: ${booking.bookingId}`,
                    bookingId: String(booking.id),
                    ticketId: booking.ticketId,
                });
                console.error('📋 Manual Refund Required:', {
                    bookingId: booking.bookingId,
                    userId: booking.userId,
                    paymentId: booking.razorpayPaymentId,
                    amount: refundAmount,
                    platformFee: booking.platformFee,
                    ticketAmount: parseFloat(booking.subtotal.toString()),
                    error: refundError.message,
                });
            }
        }
        // Update ticket stats (always update, regardless of refund status)
        try {
            await updateTicketStats(booking.ticketId, 'totalBookings', -1);
            await updateTicketStats(booking.ticketId, 'totalTicketsSold', -booking.quantity);
            // If payment was completed, also update revenue
            if (booking.paymentStatus === 'COMPLETED') {
                await updateTicketStats(booking.ticketId, 'revenue', -parseFloat(booking.totalAmount.toString()));
            }
        }
        catch (statsError) {
            console.error('❌ Error updating ticket stats:', statsError);
            // Don't fail the cancellation if stats update fails
        }
        // Get user's cancellation stats
        let cancellationStats;
        try {
            cancellationStats = await BookingModel.getUserCancellationStats(userId);
        }
        catch (statsError) {
            console.error('❌ Error getting cancellation stats:', statsError);
            cancellationStats = { totalCancellations: 0, totalCancelledTickets: 0 };
        }
        // Send cancellation notification
        await createNotification({
            userId,
            type: 'booking_cancelled',
            title: 'Booking Cancelled',
            message: `Your booking for ${booking.eventDetails.eventName} has been cancelled successfully`,
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
    }
    catch (error) {
        console.error('❌ Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel booking'
        });
    }
};
// Get user's cancellation statistics
export const getUserCancellationStats = async (req, res) => {
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
    }
    catch (error) {
        console.error('❌ Error fetching cancellation stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=bookingController.js.map