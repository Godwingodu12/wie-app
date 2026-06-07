import { listenExchangeQueue } from '../rabbit/consumer.js';
import { getWieUsersByIds }    from '../grpc/wieUserClient.js';
import { getCancelledEventInfo, getTicketDetails } from '../grpc/ticketClient.js';
import { sendEventCancellationEmail } from '../utils/emailSender.js';
import { sendEventCancellationSMS }   from '../utils/smsSender.js';
import { createNotificationInternal as createNotification } from '../controllers/notification.controller.js';

const EXCHANGE_NAME = 'wie.events';
const ROUTING_KEY   = 'event.cancelled';
const QUEUE_NAME    = 'wie.notification.event.cancelled';

const BOOKING_CANCELLED_QUEUE   = 'wie.notification.booking.event.cancelled';
const BOOKING_CANCELLED_ROUTING = 'event.booking.cancelled';

export const startBookingCancellationUpdateConsumer = async () => {
  try {
    await listenExchangeQueue(
      EXCHANGE_NAME,               // reuse 'wie.events'
      BOOKING_CANCELLED_ROUTING,
      BOOKING_CANCELLED_QUEUE,
      handleBookingCancellationUpdate
    );
  } catch (err) {
    console.error('❌ [BookingCancellationUpdateConsumer] Failed to start:', err.message);
  }
};

const handleBookingCancellationUpdate = async (payload) => {
  const {
    eventId,
    cancellationReason = '',
    refundPercentage   = 100,
    cancellationTier   = 'full_refund',
    isHostCancellation = true,
    bookings           = [],
  } = payload;

  if (!bookings.length) return { success: true, updated: 0 };

  // Import Notification model
  const Notification = (await import('../models/notification.model.js')).default;

  const results = await Promise.allSettled(
    bookings.map(async (booking) => {
      const {
        userId, bookingId, id: bId,
        eventName, subtotal, platformFee, quantity, ticketType,
        ticketId: bookingTicketId,    // ← the ticketId stored on the booking (may be sub-event ID)
        parentTicketId,               // ← parent ticket ID if sub-event
      } = booking;

      const computedRefund = parseFloat(
        ((parseFloat(subtotal || '0') * refundPercentage) / 100).toFixed(2)
      );

      const refundLine = computedRefund > 0
        ? ` A refund of ₹${computedRefund.toFixed(2)} (${refundPercentage}%) will be credited within 5–7 business days.`
        : '';
      const reasonLine = cancellationReason ? ` Reason: ${cancellationReason}.` : '';

      const newTitle   = `Event Cancelled: ${eventName}`;
      const newMessage = `"${eventName}" has been cancelled by the host.${reasonLine}${refundLine}`;

      const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

      // Use parentTicketId if available (sub-event booking), else bookingTicketId, else eventId
      const resolvedTicketId =
        (isValidObjectId(parentTicketId) ? parentTicketId : null) ||
        (isValidObjectId(bookingTicketId) ? bookingTicketId : null) ||
        (isValidObjectId(eventId) ? eventId : null);

      const resolvedBookingId = String(bookingId || bId || '');

      // Upsert: update existing booking_confirmed / payment_success notification
      const existingNotif = await Notification.findOne({
        userId:    String(userId),
        bookingId: resolvedBookingId,
        type:      { $in: ['booking_confirmed', 'payment_success'] },
      });

      if (existingNotif) {
        existingNotif.type          = 'event_cancelled';
        existingNotif.title         = newTitle;
        existingNotif.message       = newMessage;
        existingNotif.isRead        = false;
        existingNotif.updatedAt     = new Date();
        existingNotif.lastUpdatedAt = new Date();
        // Update ticketId to resolved main ticket ID so banner fetch works
        if (resolvedTicketId) existingNotif.ticketId = resolvedTicketId;

        const metaUpdates = {
          cancellationReason:  cancellationReason,
          refundAmount:        String(computedRefund),
          refundPercentage:    String(refundPercentage),
          cancellationTier,
          isHostCancellation:  String(isHostCancellation),
        };

        if (existingNotif.metadata) {
          Object.entries(metaUpdates).forEach(([k, v]) => existingNotif.metadata.set(k, v));
        } else {
          existingNotif.metadata = new Map(Object.entries(metaUpdates));
        }

        await existingNotif.save();
      } else {
        await createNotification({
          userId:    String(userId),
          type:      'event_cancelled',
          title:     newTitle,
          message:   newMessage,
          ticketId:  resolvedTicketId,
          bookingId: resolvedBookingId,
          eventName,
          metadata:  {
            cancellationReason,
            refundAmount:       String(computedRefund),
            refundPercentage:   String(refundPercentage),
            cancellationTier,
            isHostCancellation: String(isHostCancellation),
          },
        });
      }
    })
  );

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  return { success: true, updated: successCount };
};
export const startEventCancellationConsumer = async () => {
  try {
    await listenExchangeQueue(
      EXCHANGE_NAME,
      ROUTING_KEY,
      QUEUE_NAME,
      handleEventCancellation
    );
  } catch (err) {
    console.error('❌ [EventCancellationConsumer] Failed to start:', err.message);
  }
};

const handleEventCancellation = async (payload) => {
  const {
    eventId,          // main ticketId or subEventId
    parentEventId,    // set when isSubEvent = true
    isSubEvent  = false,
    bookedUserIds    = [],
    bookingRefundMap = {},  // { userId: refundAmount }  from ticket-service publisher
    cancellation_reason,
    cancelledAt,
    refundPercentage = 100,
  } = payload;

  // Step 1: Fetch authoritative event details from ticket-service via gRPC ──
  // Use parentEventId when it's a sub-event so GetTicketById works correctly
  const ticketIdToFetch  = isSubEvent && parentEventId ? parentEventId : eventId;
  const subEventIdToFetch = isSubEvent ? eventId : '';

  // Fetch both in parallel
  const [cancellationInfo, ticketDetails] = await Promise.all([
    getCancelledEventInfo(ticketIdToFetch, subEventIdToFetch),
    getTicketDetails(ticketIdToFetch),
  ]);

  // Build authoritative event data — gRPC values take priority over payload
  const eventName = cancellationInfo?.eventName
    || (isSubEvent
      ? ticketDetails?.sub_events?.find(se => se.id === eventId)?.event_name
      : ticketDetails?.event_name)
    || payload.eventName
    || 'Unknown Event';

  const paymentType = cancellationInfo?.paymentType
    || payload.paymentType
    || 'free';

  const groupId = cancellationInfo?.groupId
    || ticketDetails?.groupId
    || payload.groupId
    || '';

  // Get event date from ticket details
  const eventDateRaw = isSubEvent
    ? ticketDetails?.sub_events?.find(se => se.id === eventId)?.event_dates?.[0]?.start_date
    : ticketDetails?.event_dates?.[0]?.start_date;

  const eventDate = eventDateRaw
    ? new Date(eventDateRaw).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : cancelledAt
      ? new Date(cancelledAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : 'N/A';

  // Get venue/location
  const venue = isSubEvent
    ? ticketDetails?.sub_events?.find(se => se.id === eventId)?.venue
    : (ticketDetails?.venue || ticketDetails?.location || '');

  const isPaid = paymentType === 'paid';


  // Step 2: No booked users — nothing to notify 
  if (!bookedUserIds.length) {
    return { success: true, notified: 0 };
  }

  // Step 3: Batch fetch all user details in ONE gRPC call 
  const users = await getWieUsersByIds(bookedUserIds);

  if (!users || users.length === 0) {
    return { success: true, notified: 0 };
  }

  // Step 4: Notify all users in parallel
  const results = await Promise.allSettled(
    users.map((user) => {
      // Find this user's bookingId from the bookingRefundMap if available
      const userBookingId = bookingRefundMap?.[`${user.id}_bookingId`] || undefined;

      return notifyUser({
        user,
        eventId,
        parentEventId,   // ← pass through
        isSubEvent,      // ← pass through
        eventName,
        eventDate,
        venue,
        isPaid,
        refundAmount:       bookingRefundMap[user.id] || 0,
        cancellation_reason,
        refundPercentage,
        bookingId:          userBookingId,
      });
    })
  );

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const failCount    = results.filter((r) => r.status === 'rejected').length;

  return { success: true, notified: successCount };
};

const notifyUser = async ({
  user,
  eventId,
  parentEventId,   // ← add this param
  isSubEvent,      // ← add this param
  eventName,
  eventDate,
  venue,
  isPaid,
  refundAmount,
  cancellation_reason,
  refundPercentage,
  bookingId,       // ← add this param
}) => {
  if (!user?.id) return;

  const userName   = user.name || user.username || 'there';
  const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

  const refundLine = isPaid && refundAmount > 0
    ? ` Refund of ₹${refundAmount.toFixed(2)} (${refundPercentage}%) will be credited within 5–7 business days.`
    : '';
  const reasonLine = cancellation_reason
    ? ` Reason: ${cancellation_reason}.`
    : '';

  const pushTitle   = `Event Cancelled: ${eventName}`;
  const pushMessage = `"${eventName}"${venue ? ` at ${venue}` : ''} on ${eventDate} was cancelled by the host.${reasonLine}${refundLine}`;

  // ── Resolve correct ticketId for notification ──────────────────────────────
  // For sub-events: use parentEventId so getEventById can find the main ticket
  // (sub-event IDs work too via GetTicketById, but parentEventId is more reliable)
  // For main events: use eventId directly
  const notifTicketId = isSubEvent && isValidObjectId(parentEventId)
    ? parentEventId
    : isValidObjectId(eventId)
      ? eventId
      : undefined;

  await Promise.allSettled([

    // 1. Push Notification
    createNotification({
      userId:    user.id,
      type:      'event_cancelled',
      title:     pushTitle,
      message:   pushMessage,
      ticketId:  notifTicketId,
      bookingId: bookingId || undefined,   // ← pass bookingId so frontend navigates correctly
      eventName,
      updatedAt: new Date().toISOString(),
      metadata: {
        isHostCancellation: 'true',
        refundAmount:       String(refundAmount || 0),
        refundPercentage:   String(refundPercentage),
        cancellationReason: cancellation_reason || '',
        // Store sub-event ID separately in metadata so frontend can use it if needed
        ...(isSubEvent ? { subEventId: eventId } : {}),
      },
    }).catch((err) =>
      console.error(`❌ [Push] user ${user.id}:`, err.message)
    ),

    // 2. Email
    user.email
      ? sendEventCancellationEmail({
          email:              user.email,
          userName,
          eventName,
          eventDate,
          venue,
          refundAmount,
          isPaid,
          refundPercentage,
          cancellationReason: cancellation_reason,
        }).catch((err) =>
          console.error(`❌ [Email] user ${user.id} (${user.email}):`, err.message)
        )
      : Promise.resolve(),

    // 3. SMS
    user.contact_no
      ? sendEventCancellationSMS({
          contactNo:       user.contact_no,
          userName,
          eventName,
          eventDate,
          venue,
          refundAmount,
          isPaid,
          refundPercentage,
        }).catch((err) =>
          console.error(`❌ [SMS] user ${user.id} (${user.contact_no}):`, err.message)
        )
      : Promise.resolve(),
  ]);
};
