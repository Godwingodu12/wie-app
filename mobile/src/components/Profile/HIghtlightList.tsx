import React from 'react';
import { FlatList, View } from 'react-native';
import HighlightBubble from './Highlight';

interface HighlightsSectionProps {
  data: any[];
  showAddButton?: boolean; // New prop to control visibility
  onAddPress?: () => void;
  onItemPress?: (item: any) => void;
}

const HighlightsSection = ({ data, showAddButton = false, onAddPress, onItemPress }: HighlightsSectionProps) => {
  return (
    <View className="bg-black py-4 pl-4">
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        // Conditional rendering: only show "Add" if showAddButton is true
        ListHeaderComponent={
          showAddButton ? () => <HighlightBubble type="add" title="Add" onPress={onAddPress} /> : null
        }
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <HighlightBubble 
            imageUrl={item.image} 
            title={item.title} 
            onPress={() => onItemPress?.(item)}
          />
        )}
      />
    </View>
  );
};

export default HighlightsSection;
