import { listenExchangeQueue } from '../rabbit/consumer.js';
import { getWieUsersByIds }    from '../grpc/wieUserClient.js';
import { getCancelledEventInfo, getTicketDetails } from '../grpc/ticketClient.js';
import { sendEventCancellationEmail } from '../utils/emailSender.js';
import { sendEventCancellationSMS }   from '../utils/smsSender.js';
import { createNotificationInternal as createNotification } from '../controllers/notification.controller.js';

const EXCHANGE_NAME = 'wie.events';
const ROUTING_KEY   = 'event.cancelled';
const QUEUE_NAME    = 'wie.notification.event.cancelled';

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
    users.map((user) =>
      notifyUser({
        user,
        eventId,
        eventName,
        eventDate,
        venue,
        isPaid,
        refundAmount:       bookingRefundMap[user.id] || 0,
        cancellation_reason,
        refundPercentage,
      })
    )
  );

  const successCount = results.filter((r) => r.status === 'fulfilled').length;
  const failCount    = results.filter((r) => r.status === 'rejected').length;

  return { success: true, notified: successCount };
};

//  Per-User Notification (push + email + SMS in parallel) 
const notifyUser = async ({
  user,
  eventId,
  eventName,
  eventDate,
  venue,
  isPaid,
  refundAmount,
  cancellation_reason,
  refundPercentage,
}) => {
  if (!user?.id) return;

  const userName = user.name || user.username || 'there';

  // Build notification messages
  const refundLine = isPaid && refundAmount > 0
    ? ` Refund of ₹${refundAmount.toFixed(2)} (${refundPercentage}%) will be credited within 5–7 business days.`
    : '';

  const reasonLine = cancellation_reason
    ? ` Reason: ${cancellation_reason}.`
    : '';

  const pushTitle   = `Event Cancelled: ${eventName}`;
  const pushMessage = `"${eventName}"${venue ? ` at ${venue}` : ''} on ${eventDate} was cancelled by the host.${reasonLine}${refundLine}`;

  // Fire all 3 channels — failures are isolated per channel
  await Promise.allSettled([

    // 1. Push Notification (always) 
    createNotification({
      userId:    user.id,
      type:      'event_cancelled',
      title:     pushTitle,
      message:   pushMessage,
      ticketId:  eventId,
      eventName,
    }).catch((err) =>
      console.error(`❌ [Push] user ${user.id}:`, err.message)
    ),

    // 2. Email (only if user.email exists) 
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

    //  3. SMS (only if user.contact_no exists) 
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
