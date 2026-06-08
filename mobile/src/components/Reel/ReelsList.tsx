import React from 'react';
import { FlatList, View } from 'react-native';
import ReelCard from './ReelCard';

export const ReelsList = ({ reels }: { reels: any[] }) => {
  return (
    <FlatList
      data={reels}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      keyExtractor={(item, index) => String(item.id || item._id || index)}
      renderItem={({ item }) => (
        <View className="mr-3">
          <ReelCard 
            thumbnail={item.thumbnailUrl || item.thumbnail || item.mediaUrl} 
            onPress={() => console.log(`Play reel: ${item.id || item._id}`)}
          />
        </View>
      )}
    />
  );
};
