import { listenExchangeQueue } from '../rabbit/consumer.js';
import { getWieUsersByIds }    from '../grpc/wieUserClient.js';
import { getTicketDetails }    from '../grpc/ticketClient.js';
import { sendEventRehostEmail } from '../utils/emailSender.js';
import { sendEventRehostSMS }   from '../utils/smsSender.js';
import { createNotificationInternal as createNotification } from '../controllers/notification.controller.js';
import { sendRefundSuccessEmail } from '../utils/emailSender.js';
import { sendRefundSuccessSMS }   from '../utils/smsSender.js';
import { getRefundStatus } from '../grpc/transactionClient.js';

const EXCHANGE_NAME = 'wie.events';
const ROUTING_KEY   = 'event.rehosted';
const QUEUE_NAME    = 'wie.notification.event.rehosted';

const REFUND_EXCHANGE   = 'wie.events';
const REFUND_ROUTING    = 'refund.success';
const REFUND_QUEUE      = 'wie.notification.refund.success';

export const startEventRehostConsumer = async () => {
  try {
    await listenExchangeQueue(
      EXCHANGE_NAME,
      ROUTING_KEY,
      QUEUE_NAME,
      handleEventRehost
    );
  } catch (err) {
    console.error('❌ [EventRehostConsumer] Failed to start:', err.message);
  }
};
export const startRefundSuccessConsumer = async () => {
  try {
    await listenExchangeQueue(
      REFUND_EXCHANGE,
      REFUND_ROUTING,
      REFUND_QUEUE,
      handleRefundSuccess
    );
    console.log('✅ [RefundSuccessConsumer] Listening for refund.success events');
  } catch (err) {
    console.error('❌ [RefundSuccessConsumer] Failed to start:', err.message);
  }
};

const handleRefundSuccess = async (payload) => {
  const {
    bookingId,
    userId,
    ticketId,
    eventName,
    refundAmount,
    refundId,
    processedAt,
  } = payload;

  if (!userId) {
    console.warn('⚠️ [RefundSuccessConsumer] No userId in payload — skipping');
    return;
  }

  // Fetch user details
  const users = await getWieUsersByIds([userId]).catch((err) => {
    console.error('❌ [RefundSuccessConsumer] getWieUsersByIds failed:', err.message);
    return [];
  });

  const user = users?.[0];
  if (!user) {
    console.warn(`⚠️ [RefundSuccessConsumer] User ${userId} not found`);
    return;
  }

  const userName      = user.name || user.username || 'there';
  const processedDate = processedAt
    ? new Date(processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  await Promise.allSettled([

    // Push notification
    createNotification({
      userId,
      type:      'refund_success',
      title:     '✅ Refund Successful',
      message:   `Your refund of ₹${parseFloat(refundAmount).toFixed(2)} for "${eventName}" has been processed. Refund ID: ${refundId}`,
      ticketId:  /^[a-f\d]{24}$/i.test(ticketId) ? ticketId : undefined,
      eventName,
      bookingId,
    }).catch((err) => console.error(`❌ [RefundPush] userId=${userId}:`, err.message)),

    // Email
    user.email
      ? sendRefundSuccessEmail({
          email:        user.email,
          userName,
          eventName,
          refundAmount: parseFloat(refundAmount),
          refundId,
          processedDate,
        }).catch((err) => console.error(`❌ [RefundEmail] userId=${userId}:`, err.message))
      : Promise.resolve(),

    // SMS
    (user.contact_no || user.contactNo || user.phone)
      ? sendRefundSuccessSMS({
          contactNo:    user.contact_no || user.contactNo || user.phone,
          userName,
          eventName,
          refundAmount: parseFloat(refundAmount),
          refundId,
        }).catch((err) => console.error(`❌ [RefundSMS] userId=${userId}:`, err.message))
      : Promise.resolve(),
  ]);
};
const handleEventRehost = async (payload) => {
  const {
    eventId,
    parentEventId,
    isSubEvent    = false,
    bookedUserIds = [],
    rehostedAt,
    eventName,
  } = payload;

  if (!bookedUserIds.length) {
    console.warn('⚠️ [EventRehostConsumer] No bookedUserIds in payload — skipping notifications');
    return;
  }

  // Fetch parent ticket for authoritative event data
  const ticketIdToFetch = isSubEvent && parentEventId ? parentEventId : eventId;
  const ticketDetails   = await getTicketDetails(ticketIdToFetch).catch((err) => {
    console.error('❌ [EventRehostConsumer] getTicketDetails failed:', err.message);
    return null;
  });

  // Resolve sub-event details if applicable
  const subEvent = isSubEvent && ticketDetails?.sub_events
    ? ticketDetails.sub_events.find(
        (se) => se._id?.toString() === eventId || se.id?.toString() === eventId
      )
    : null;

  const resolvedEventName =
    eventName ||
    subEvent?.event_name ||
    ticketDetails?.event_name ||
    'Your Event';

  const rawDate =
    subEvent?.event_dates?.[0]?.start_date ||
    ticketDetails?.event_dates?.[0]?.start_date ||
    null;

  const eventDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'TBA';

  const venue =
    subEvent?.venue ||
    ticketDetails?.venue ||
    ticketDetails?.location ||
    '';

  // Batch fetch users
  const users = await getWieUsersByIds(bookedUserIds).catch((err) => {
    console.error('❌ [EventRehostConsumer] getWieUsersByIds failed:', err.message);
    return [];
  });

  if (!users?.length) {
    console.warn('⚠️ [EventRehostConsumer] No users resolved from bookedUserIds');
    return;
  }

  const results = await Promise.allSettled(
    users.map((user) =>
      notifyRehostUser({
        user,
        eventId,
        resolvedEventName,
        eventDate,
        venue,
        rehostedAt,
      })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed    = results.filter((r) => r.status === 'rejected').length;
};

const notifyRehostUser = async ({
  user,
  eventId,
  resolvedEventName,
  eventDate,
  venue,
  rehostedAt,
}) => {
  if (!user?.id) return;

  const userName    = user.name || user.username || 'there';
  const pushMessage = `"${resolvedEventName}"${venue ? ` at ${venue}` : ''} on ${eventDate} is back & live! Book your tickets again.`;

  await Promise.allSettled([

    createNotification({
      userId:    user.id,
      type:      'event_rehosted',
      title:     `Event is Back: ${resolvedEventName}`,
      message:   pushMessage,
      ticketId:  /^[a-f\d]{24}$/i.test(eventId) ? eventId : undefined,
      eventName: resolvedEventName,
    }).catch((err) =>
      console.error(`❌ [RehostPush] userId=${user.id}:`, err.message)
    ),

    // ── Email ──
    user.email
      ? sendEventRehostEmail({
          email:     user.email,
          userName,
          eventName: resolvedEventName,
          eventDate,
          venue,
        }).catch((err) =>
          console.error(`❌ [RehostEmail] userId=${user.id}:`, err.message)
        )
      : Promise.resolve(),

    // ── SMS ──
    user.contact_no || user.contactNo || user.phone
      ? sendEventRehostSMS({
          contactNo: user.contact_no || user.contactNo || user.phone,
          userName,
          eventName: resolvedEventName,
          eventDate,
          venue,
        }).catch((err) =>
          console.error(`❌ [RehostSMS] userId=${user.id}:`, err.message)
        )
      : Promise.resolve(),

  ]);
};
