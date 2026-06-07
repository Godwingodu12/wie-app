import { Request, Response } from 'express';
import { BookingModel } from '../models/booking.model';
import { InteractionModel } from '../models/interaction.model';
import { verifyQRCode } from '../utils/qrGenerator';
import { createNotification } from '../utils/notificationHelper';
import { Booking } from '../generated/prisma';
// Get All Bookings for a Group/Event
export const getGroupBookings = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const {
      ticketId,
      status,
      startDate,
      endDate,
      limit = 100,
      skip = 0,
    } = req.query;

    const options: any = {
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
    };

    if (ticketId) {
      options.ticketId = ticketId as string;
    }

    if (status) {
      options.status = status as any;
    }

    if (startDate) {
      options.startDate = new Date(startDate as string);
    }

    if (endDate) {
      options.endDate = new Date(endDate as string);
    }

    const result = await BookingModel.findByGroupId(groupId, options);

    // Calculate statistics
    const stats = await BookingModel.getGroupStatistics(groupId);

    res.json({
      success: true,
      data: {
        bookings: result.bookings,
        total: result.total,
        stats: {
          totalBookings: stats._count,
          totalRevenue: stats._sum.totalAmount || 0,
          totalTicketsSold: stats._sum.quantity || 0,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching group bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Event Statistics
export const getEventStatistics = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    // Booking statistics
    const bookingStats = await BookingModel.getTicketStatistics(ticketId);

    // Interaction statistics
    const interactionStats = await InteractionModel.getTicketStatistics(ticketId);

    // Payment method breakdown
    const bookings = await BookingModel.findByTicketId(ticketId);
    
    const paymentMethods = bookings
      .filter((b) => b.bookingStatus === 'CONFIRMED' && b.paymentMethod)
      .reduce((acc: any, booking) => {
        const method = booking.paymentMethod || 'unknown';
        if (!acc[method]) {
          acc[method] = {
            count: 0,
            totalAmount: 0,
          };
        }
        acc[method].count += 1;
        acc[method].totalAmount += parseFloat(booking.totalAmount.toString());
        return acc;
      }, {});

    // Daily booking trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = bookings.filter(
      (b) =>
        b.bookingStatus === 'CONFIRMED' &&
        new Date(b.createdAt) >= thirtyDaysAgo
    );

    const dailyBookings = recentBookings.reduce((acc: any, booking) => {
      const date = new Date(booking.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          bookings: 0,
          revenue: 0,
          tickets_sold: 0,
        };
      }
      acc[date].bookings += 1;
      acc[date].revenue += parseFloat(booking.totalAmount.toString());
      acc[date].tickets_sold += booking.quantity;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        bookingStats,
        interactionStats,
        paymentMethods,
        dailyBookings: Object.values(dailyBookings).sort(
          (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching event statistics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Verify Ticket QR Code
export const verifyTicketQR = async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body;
    const verifiedBy = req.user?.id;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required',
      });
    }

    // Verify QR code data
    const parsedData = verifyQRCode(qrData);

    if (!parsedData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format',
      });
    }

    const { bookingId } = parsedData;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code data',
      });
    }

    // Find booking
    const booking = await BookingModel.findByBookingId(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.bookingStatus !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not confirmed',
      });
    }

    if (booking.isVerified) {
      return res.json({
        success: true,
        message: 'Ticket already verified',
        data: {
          booking,
          alreadyVerified: true,
          verifiedAt: booking.verifiedAt,
        },
      });
    }

    // Mark as verified
    const updatedBooking = await BookingModel.verify(booking.id, verifiedBy || 'system');

    // Send notification
    await createNotification({
      userId: booking.userId,
      type: 'ticket_verified',
      title: 'Ticket Verified ✅',
      message: `Your ticket for ${(booking.eventDetails as any).eventName} has been verified`,
      bookingId: booking.id,
      ticketId: booking.ticketId,
    });

    res.json({
      success: true,
      message: 'Ticket verified successfully',
      data: {
        booking: updatedBooking,
        alreadyVerified: false,
      },
    });
  } catch (error: any) {
    console.error('❌ Error verifying ticket:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Feedback for Event
export const getEventFeedback = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const result = await InteractionModel.getFeedback(ticketId, {
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
    });

    res.json({
      success: true,
      data: {
        feedback: result.feedback,
        total: result.total,
        averageRating: result.averageRating,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching event feedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Export Bookings to CSV
export const exportBookings = async (req: Request, res: Response) => {
  try {
    const { groupId, ticketId } = req.query;

    if (!groupId && !ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Either groupId or ticketId is required',
      });
    }

    let bookings: Booking[] = []; // Fixed: Explicitly type as Booking[]

    if (ticketId) {
      bookings = await BookingModel.findByTicketId(ticketId as string);
    } else if (groupId) {
      const result = await BookingModel.findByGroupId(groupId as string, {
        limit: 10000, // Large limit for export
      });
      bookings = result.bookings;
    }

    // Convert to CSV format
    const headers = [
      'Booking ID',
      'User ID',
      'Event Name',
      'Ticket Type',
      'Quantity',
      'Price Per Ticket',
      'Subtotal',
      'Tax',
      'Platform Fee',
      'Total Amount',
      'Currency',
      'Payment Status',
      'Payment Method',
      'Booking Status',
      'User Name',
      'User Email',
      'User Phone',
      'Event Date',
      'Event Time',
      'Venue',
      'Is Verified',
      'Verified At',
      'Created At',
    ];

    const rows = bookings.map((b) => {
      const userDetails = b.userDetails as any;
      const eventDetails = b.eventDetails as any;

      return [
        b.bookingId,
        b.userId,
        eventDetails?.eventName || '',
        b.ticketType,
        b.quantity,
        b.pricePerTicket,
        b.subtotal,
        b.tax,
        b.platformFee,
        b.totalAmount,
        b.currency,
        b.paymentStatus,
        b.paymentMethod || '',
        b.bookingStatus,
        userDetails?.name || '',
        userDetails?.email || '',
        userDetails?.phone || '',
        eventDetails?.eventDate || '',
        eventDetails?.eventTime || '',
        eventDetails?.venue || '',
        b.isVerified ? 'Yes' : 'No',
        b.verifiedAt ? new Date(b.verifiedAt).toISOString() : '',
        new Date(b.createdAt).toISOString(),
      ];
    });

    // Escape fields that contain commas or quotes
    const escapeCSV = (field: any) => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((r) => r.map(escapeCSV).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bookings-${Date.now()}.csv`
    );
    res.send(csvContent);
  } catch (error: any) {
    console.error('❌ Error exporting bookings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Booking Analytics
export const getBookingAnalytics = async (req: Request, res: Response) => {
  try {
    const { groupId, ticketId, startDate, endDate } = req.query;

    if (!groupId && !ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Either groupId or ticketId is required',
      });
    }

    let bookings: Booking[] = []; // Fixed: Explicitly type as Booking[]

    if (ticketId) {
      bookings = await BookingModel.findByTicketId(ticketId as string);
    } else if (groupId) {
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);

      const result = await BookingModel.findByGroupId(groupId as string, options);
      bookings = result.bookings;
    }

    // Filter by date range if provided
    const filteredBookings = bookings.filter((b) => {
      const createdAt = new Date(b.createdAt);
      if (startDate && createdAt < new Date(startDate as string)) return false;
      if (endDate && createdAt > new Date(endDate as string)) return false;
      return true;
    });

    // Calculate analytics
    const totalBookings = filteredBookings.length;
    const confirmedBookings = filteredBookings.filter(
      (b) => b.bookingStatus === 'CONFIRMED'
    ).length;
    const cancelledBookings = filteredBookings.filter(
      (b) => b.bookingStatus === 'CANCELLED'
    ).length;
    const pendingBookings = filteredBookings.filter(
      (b) => b.bookingStatus === 'PENDING'
    ).length;

    const totalRevenue = filteredBookings
      .filter((b) => b.bookingStatus === 'CONFIRMED')
      .reduce((sum, b) => sum + parseFloat(b.totalAmount.toString()), 0);

    const totalTicketsSold = filteredBookings
      .filter((b) => b.bookingStatus === 'CONFIRMED')
      .reduce((sum, b) => sum + b.quantity, 0);

    const averageOrderValue =
      confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0;

    // Payment method distribution
    const paymentMethodDistribution = filteredBookings
      .filter((b) => b.bookingStatus === 'CONFIRMED' && b.paymentMethod)
      .reduce((acc: any, b) => {
        const method = b.paymentMethod || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});

    // Hourly distribution
    const hourlyDistribution = filteredBookings.reduce((acc: any, b) => {
      const hour = new Date(b.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Conversion rate
    const conversionRate =
      totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          pendingBookings,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalTicketsSold,
          averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        },
        paymentMethodDistribution,
        hourlyDistribution,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching booking analytics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get Top Events by Revenue
export const getTopEventsByRevenue = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { limit = 10 } = req.query;

    const result = await BookingModel.findByGroupId(groupId, {
      limit: 10000, // Get all bookings
    });

    // Group by ticketId and calculate revenue
    const eventRevenue = result.bookings
      .filter((b) => b.bookingStatus === 'CONFIRMED')
      .reduce((acc: any, b) => {
        if (!acc[b.ticketId]) {
          acc[b.ticketId] = {
            ticketId: b.ticketId,
            eventName: (b.eventDetails as any)?.eventName || 'Unknown',
            totalRevenue: 0,
            totalBookings: 0,
            totalTickets: 0,
          };
        }
        acc[b.ticketId].totalRevenue += parseFloat(b.totalAmount.toString());
        acc[b.ticketId].totalBookings += 1;
        acc[b.ticketId].totalTickets += b.quantity;
        return acc;
      }, {});

    // Sort by revenue and take top N
    const topEvents = Object.values(eventRevenue)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: {
        topEvents,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching top events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
