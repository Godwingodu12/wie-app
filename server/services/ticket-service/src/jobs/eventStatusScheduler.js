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
