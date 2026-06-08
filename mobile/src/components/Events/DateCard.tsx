import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate item width: (Total Width - Padding - Gap) / 3 columns
// 16px padding on both sides (32) + 10px gaps between items (20) = 52
const ITEM_WIDTH = (SCREEN_WIDTH - 52) / 3;

export const DateCard = ({ date }: { date: string }) => {
  // Split date to make it look like a calendar block (e.g., "12" and "AUG 2025")
  const dateParts = date.split(' '); 
  
  return (
    <View 
      style={{ width: ITEM_WIDTH }} 
      className="bg-[#1C1C1E] border border-gray-800 rounded-2xl items-center justify-center p-3 mb-3"
    >
      <Ionicons name="calendar-clear" size={18} color="#8B5CF6" className="mb-1" />
      
      <Text 
        className="text-white font-rubik-bold text-sm text-center" 
        numberOfLines={1}
      >
        {dateParts[0]} {dateParts[1]}
      </Text>
      
      <Text 
        className="text-gray-500 font-rubik-regular text-[10px] text-center" 
        numberOfLines={1}
      >
        {dateParts[2]}
      </Text>
    </View>
  );
};
