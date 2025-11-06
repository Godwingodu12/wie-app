import cron from 'node-cron';
import Ticket from "../models/ticket.model.js";

export const startEventStatusScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running scheduled event status update at:', new Date().toISOString());
      
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
              ticket.event_status = 'completed';
              await ticket.save();
              completedCount++;
              console.log(`Auto-completed: ${ticket.event_name} (${ticket._id})`);
            }
          }
        })
      );

      console.log(`Event status update completed. ${completedCount} events marked as completed.`);
      
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
};
export const checkExpiredConfirmedEvents = () => {
  cron.schedule('* * * * *', async () => {
    try {
      console.log('Running expired confirmed events check at:', new Date().toISOString());
      
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
              // Event dates have all passed, but status is still confirmed (not live/completed)
              ticket.event_status = 'pending';
              await ticket.save();
              pendingCount++;
              console.log(`Auto-pending: ${ticket.event_name} (${ticket._id}) - Event dates expired without going live`);
            }
          }
        })
      );

      console.log(`Expired confirmed events check completed. ${pendingCount} events marked as pending.`);
      
    } catch (error) {
      console.error('Expired confirmed events cron job error:', error);
    }
  });
};
