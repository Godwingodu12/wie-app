import React from 'react';
import EventCard from './Card';

const FeaturedEventCard = ({ event }: { event: any }) => {
  return (
    <EventCard 
      image={event.event_banner || event.event_portrait || event.image}
      title={event.event_name || event.title}
      date={event.event_dates?.[0]?.start_date ? new Date(event.event_dates[0].start_date).toLocaleDateString() : event.date || 'TBA'}
      time={event.event_dates?.[0]?.start_time || event.time || 'TBA'}
      location={event.location || event.venue || 'Global'}
      isFree={event.is_free || event.isFree || false}
      stats={{
        likes: event.likeCount || 0,
        attendees: event.totalBookings || event.attendees || 0,
        shares: event.shareCount || 0
      }}
    />
  );
};

export default FeaturedEventCard;
