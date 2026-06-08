import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import ReelCard from './ReelCard';

interface ReelHorizontalListProps {
  sectionTitle: string;
  data?: any[];
}

const ReelHorizontalList = ({ sectionTitle, data }: ReelHorizontalListProps) => {
  if (!data || data.length === 0) return null;

  return (
    <View className="py-6 px-3">
      {/* Header Section */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-white text-xl font-bold">
          {sectionTitle}
        </Text>
        <TouchableOpacity>
          <Text className="text-primary text-sm font-semibold">see all</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal FlatList */}
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={({ item }) => (
          <View className="mr-3">
            <ReelCard 
              thumbnail={item.thumbnailUrl || item.thumbnail || item.mediaUrl} 
              onPress={() => console.log(`Play reel: ${item.id || item._id}`)}
            />
          </View>
        )}
      />
    </View>
  );
};

export default ReelHorizontalList;
