import cron from 'node-cron';
import Ticket from "../models/ticket.model.js";
import { createNotification } from '../utils/notificationHelper.js';

/**
 * Returns the actual DateTime when the event fully ends,
 * accounting for ALL event_dates entries (multi-day, weekly, recurring).
 *
 * Uses end_time when available, otherwise defaults to 23:59:59.
 */
const getActualEventEndDateTime = (ticket) => {
  const dates = ticket.event_dates;

  if (!dates || dates.length === 0) {
    // Fallback for legacy data with top-level end_date
    if (ticket.end_date) {
      return new Date(`${ticket.end_date}T23:59:59`);
    }
    return null;
  }

  // Sort all date entries descending by their actual end datetime,
  // pick the latest one
  const sorted = [...dates].sort((a, b) => {
    const aEnd = new Date(`${a.end_date}T${a.end_time || '23:59'}:00`);
    const bEnd = new Date(`${b.end_date}T${b.end_time || '23:59'}:00`);
    return bEnd - aEnd; // descending
  });

  const latest = sorted[0];
  return new Date(`${latest.end_date}T${latest.end_time || '23:59'}:59`);
};

/**
 * Marks live events as 'completed' once ALL sessions have ended.
 * Runs every minute.
 */
export const startEventStatusScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Main tickets
      const liveTickets = await Ticket.find({ event_status: 'live' }).lean();

      await Promise.all(
        liveTickets.map(async (ticket) => {
          const eventEndDateTime = getActualEventEndDateTime(ticket);
          if (!eventEndDateTime) return;

          if (now > eventEndDateTime) {
            await Ticket.updateOne(
              { _id: ticket._id },
              { $set: { event_status: 'completed' } }
            );

            // Notify the event host
            const hostId = ticket.userId?.toString() || ticket.createdBy?.toString() || ticket.hostId?.toString();
            if (hostId) {
              await createNotification({
                userId: hostId,
                type: 'event_completed',
                title: 'Event Completed Successfully',
                message: `Your event "${ticket.event_name}" has been completed successfully`,
                ticketId: ticket._id.toString(),
                eventId: ticket._id.toString(),
                groupId: ticket.groupId?.toString() || null,
                eventName: ticket.event_name,
              }).catch((err) =>
                console.error(`Notification failed for ticket ${ticket._id}:`, err.message)
              );
            }
          }
        })
      );

      // ── Sub-events inside live parent tickets
      // Some sub-events can end before their parent; handle them independently
      const ticketsWithSubEvents = await Ticket.find({
        'sub_events.event_status': 'live',
      }).lean();

      await Promise.all(
        ticketsWithSubEvents.map(async (ticket) => {
          const updatesNeeded = [];

          ticket.sub_events.forEach((sub, idx) => {
            if (sub.event_status !== 'live') return;

            const subEndDateTime = getActualEventEndDateTime(sub);
            if (!subEndDateTime) return;

            if (now > subEndDateTime) {
              updatesNeeded.push(idx);
            }
          });

          if (updatesNeeded.length === 0) return;

          const updateOps = {};
          updatesNeeded.forEach((idx) => {
            updateOps[`sub_events.${idx}.event_status`] = 'completed';
          });

          await Ticket.updateOne({ _id: ticket._id }, { $set: updateOps });

          // Notify for each completed sub-event
          const hostId = ticket.userId?.toString();
          if (hostId) {
            await Promise.all(
              updatesNeeded.map((idx) => {
                const sub = ticket.sub_events[idx];
                return createNotification({
                  userId: hostId,
                  type: 'event_completed',
                  title: 'Sub-event Completed',
                  message: `Your sub-event "${sub.event_name}" under "${ticket.event_name}" has been completed`,
                  ticketId: ticket._id.toString(),
                  eventId: sub._id.toString(),
                  groupId: ticket.groupId?.toString() || null,
                  eventName: sub.event_name,
                }).catch((err) =>
                  console.error(`Sub-event notification failed:`, err.message)
                );
              })
            );
          }
        })
      );
    } catch (error) {
      console.error('startEventStatusScheduler cron error:', error);
    }
  });
};

/**
 * Handles confirmed events that should have been live or completed.
 *
 * A confirmed event transitions:
 *   confirmed → live     when booking_start_date is reached
 *   confirmed → completed when ALL event sessions have ended
 *
 * Runs every minute.
 */
export const checkExpiredConfirmedEvents = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const confirmedTickets = await Ticket.find({ event_status: 'confirmed' }).lean();

      await Promise.all(
        confirmedTickets.map(async (ticket) => {
          const eventEndDateTime = getActualEventEndDateTime(ticket);
          if (!eventEndDateTime) return;

          // Priority 1: All sessions have ended → mark completed
          if (now > eventEndDateTime) {
            await Ticket.updateOne(
              { _id: ticket._id },
              { $set: { event_status: 'completed' } }
            );
            return; // skip further checks for this ticket
          }

          // Priority 2: Booking has started and first session has started → mark live
          const bookingStartStr = ticket.booking_start_date;
          const firstSessionStr = ticket.event_dates?.[0]?.start_date;

          if (bookingStartStr && firstSessionStr) {
            const bookingStart = new Date(`${bookingStartStr}T00:00:00`);
            const firstSession = new Date(
              `${firstSessionStr}T${ticket.event_dates[0].start_time || '00:00'}:00`
            );

            // Go live once either the booking period or the first session has started
            if (now >= bookingStart || now >= firstSession) {
              await Ticket.updateOne(
                { _id: ticket._id },
                { $set: { event_status: 'live' } }
              );
            }
          }
        })
      );
    } catch (error) {
      console.error('checkExpiredConfirmedEvents cron error:', error);
    }
  });
};
