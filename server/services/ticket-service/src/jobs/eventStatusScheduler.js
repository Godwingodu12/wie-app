import cron from 'node-cron';
import Ticket from "../models/ticket.model.js";
import { createNotification } from '../utils/notificationHelper.js';

export const startEventStatusScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      const liveTickets = await Ticket.find({ event_status: 'live' });
      let completedCount = 0;

      await Promise.all(
        liveTickets.map(async (ticket) => {
          const endDateStr = ticket.event_dates?.[0]?.end_date || ticket.end_date;
          if (endDateStr) {
            const eventEndDate = new Date(endDateStr);
            eventEndDate.setHours(23, 59, 59, 999);

            if (currentDate > eventEndDate) {
              // Use updateOne to bypass validation
              await Ticket.updateOne(
                { _id: ticket._id },
                { $set: { event_status: 'completed' } }
              );
              completedCount++;

              try {
                const eventHostId = ticket.userId || ticket.createdBy || ticket.hostId;
                if (!eventHostId) {
                  console.error(`No host/creator ID found for ticket: ${ticket._id}`);
                  return;
                }

                await createNotification({
                  userId: eventHostId,
                  type: 'event_completed',
                  title: 'Event Completed Successfully',
                  message: `Your event "${ticket.event_name}" has been completed successfully`,
                  ticketId: ticket._id,
                  eventId: ticket._id, 
                  groupId: ticket.groupId || null,
                  eventName: ticket.event_name
                });
              } catch (notifError) {
                console.error('Error creating notification for ticket:', ticket._id, notifError);
              }
            }
          }
        })
      );
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
};

export const checkExpiredConfirmedEvents = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const currentDate = new Date();

      // Find all confirmed events
      const confirmedTickets = await Ticket.find({ event_status: 'confirmed' });
      let pendingCount = 0;

      await Promise.all(
        confirmedTickets.map(async (ticket) => {
          const bookingStartDate = ticket.booking_start_date;
          const startDateStr = ticket.event_dates?.[0]?.start_date || ticket.start_date;
          const endDateStr = ticket.event_dates?.[0]?.end_date || ticket.end_date;

          if (bookingStartDate && startDateStr && endDateStr) {
            const bookingStart = new Date(bookingStartDate);
            const eventStart = new Date(startDateStr);
            const eventEnd = new Date(endDateStr);

            // Set time to end of day for proper comparison
            eventEnd.setHours(23, 59, 59, 999);

            // Check if all dates have passed (event should have run but didn't)
            if (currentDate > bookingStart && currentDate > eventStart && currentDate > eventEnd) {
              // Use updateOne to bypass validation
              await Ticket.updateOne(
                { _id: ticket._id },
                { $set: { event_status: 'pending' } }
              );
              pendingCount++;
            }
          }
        })
      );
    } catch (error) {
      console.error('Expired confirmed events cron job error:', error);
    }
  });
};
