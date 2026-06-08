import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ConnectionCardProps {
  title: string;
  subtitle: string;
  imageSource: any; 
  isSelected: boolean;
  onPress: () => void;
}

export const ConnectionCard = ({ 
  title, 
  subtitle, 
  imageSource, 
  isSelected, 
  onPress 
}: ConnectionCardProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`w-[48%] p-4 rounded-[24px] justify-between items-center mb-4 border ${
        isSelected 
          ? 'bg-white border-white' 
          : 'bg-[#1c1c1e] border-[#27272a]'
      }`}
      style={{ 
        aspectRatio: 0.85, 
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
      }} 
    >
      {/* IMAGE CONTAINER */}
      <View className="flex-1 justify-center items-center w-full">
        <Image 
          source={imageSource} 
          // FIX: Explicit width/height is mandatory for local images in some versions
          style={{ width: 100, height: 100, resizeMode: 'contain' }} 
        />
      </View>

      {/* TEXT CONTENT */}
      <View className="items-center w-full mt-2">
        <Text className={`text-[15px] font-bold text-center mb-1 ${
          isSelected ? 'text-black' : 'text-white'
        }`}>
          {title}
        </Text>
        <Text className={`text-[11px] text-center font-medium ${
          isSelected ? 'text-[#52525b]' : 'text-[#71717a]'
        }`}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
