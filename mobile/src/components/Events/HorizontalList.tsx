import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import SmallArtistCard from './SmallCard';    

interface EventHorizontalListProps {
  sectionTitle: string; 
  data?: any[];
}

const EventHorizontalList = ({ sectionTitle, data }: EventHorizontalListProps) => {
  if (!data || data.length === 0) return null;

  return (
    <View className="py-1 px-3">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-xl font-bold">{sectionTitle}</Text>
        <TouchableOpacity>
          <Text className="text-primary text-sm font-semibold">see all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => String(item.id || item.event_id || index)}
        renderItem={({ item }) => (
          <View className="mr-4">
            <SmallArtistCard 
              title={item.event_name || item.title}
              date={item.event_dates?.[0]?.start_date ? new Date(item.event_dates[0].start_date).toLocaleDateString() : item.date || 'TBA'}
              location={item.location || item.venue || 'Global'}
              image={item.event_banner || item.event_portrait || item.image}
              attendees={item.totalBookings || item.attendees || 0}
            />
          </View>
        )}
      />
    </View>
  );
};

export default EventHorizontalList;
