import React, { useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

export const ExpandableText = ({ text, title }: { text: string; title: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  return (
    <View className="mt-4">
      <Text className="text-white text-lg font-rubik-bold mb-2">{title}</Text>
      
      {/* 1. Hidden Text: Used strictly to calculate the full line count */}
      <Text
        className="text-gray-400 leading-6 font-rubik text-base absolute opacity-0"
        onTextLayout={(e) => setLineCount(e.nativeEvent.lines.length)}
      >
        {text}
      </Text>

      {/* 2. Visible Text: Controlled by state */}
      <Text
        className="text-gray-400 leading-6 font-rubik text-base"
        numberOfLines={isExpanded ? undefined : 2}
      >
        {text}
      </Text>

      {/* 3. Only show buttons if the calculated text length is > 2 lines */}
      {lineCount > 2 && (
        <>
          {!isExpanded && (
            <TouchableOpacity onPress={() => setIsExpanded(true)} className="mt-1">
              <Text className="text-[#8B5CF6] font-rubik-bold">More</Text>
            </TouchableOpacity>
          )}

          {isExpanded && (
            <TouchableOpacity onPress={() => setIsExpanded(false)} className="mt-1">
              <Text className="text-[#8B5CF6] font-rubik-bold">Less</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};
