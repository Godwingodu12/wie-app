import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate width for 2 columns: (Screen - Padding - Gap) / 2
// 16px padding on both sides (32) + 12px gap between cards = 44
const COLUMN_WIDTH = (SCREEN_WIDTH - 44) / 2;
const isSmallDevice = SCREEN_WIDTH < 380;

interface GuestProps {
  name: string;
  lastName: string;
  image: string;
}

export const GuestCard = ({ name, lastName, image }: GuestProps) => (
  <View 
    style={{ width: COLUMN_WIDTH }} 
    className="flex-row items-center mb-5"
  >
    {/* Profile Image - Scales slightly for smaller screens */}
    <Image 
      source={{ uri: image }} 
      style={{ 
        width: isSmallDevice ? 48 : 56, 
        height: isSmallDevice ? 48 : 56 
      }}
      className="rounded-full bg-gray-800"
    />
    
    <View className="ml-3 flex-1">
      <Text 
        numberOfLines={1}
        className="text-white font-rubik-bold text-sm lg:text-base leading-tight"
      >
        {name}
      </Text>
      <Text 
        numberOfLines={1}
        className="text-gray-400 font-rubik-medium text-xs lg:text-sm"
      >
        {lastName}
      </Text>
    </View>
  </View>
);
