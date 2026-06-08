import React from 'react';
import { FlatList, View } from 'react-native';
import SmallCard from './SmallCard';

const HorizontalEventList = ({ events }: { events: any[] }) => {
  return (
    <FlatList
      data={events}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      keyExtractor={(item, index) => String(item.id || item.event_id || index)}
      renderItem={({ item }) => (
        <View className="mr-4">
          <SmallCard 
            title={item.event_name || item.title}
            date={item.event_dates?.[0]?.start_date ? new Date(item.event_dates[0].start_date).toLocaleDateString() : item.date || 'TBA'}
            location={item.location || item.venue || 'Global'}
            image={item.event_banner || item.event_portrait || item.image}
            attendees={item.totalBookings || item.attendees || 0}
          />
        </View>
      )}
    />
  );
};

export default HorizontalEventList;
