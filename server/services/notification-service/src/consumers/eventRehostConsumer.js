import { listenExchangeQueue } from '../rabbit/consumer.js';
import { getWieUsersByIds }    from '../grpc/wieUserClient.js';
import { getTicketDetails }    from '../grpc/ticketClient.js';
import { sendEventRehostEmail } from '../utils/emailSender.js';
import { sendEventRehostSMS }   from '../utils/smsSender.js';
import { createNotificationInternal as createNotification } from '../controllers/notification.controller.js';

const EXCHANGE_NAME = 'wie.events';
const ROUTING_KEY   = 'event.rehosted';
const QUEUE_NAME    = 'wie.notification.event.rehosted';

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
