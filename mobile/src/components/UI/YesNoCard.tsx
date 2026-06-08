import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ImageSourcePropType 
} from 'react-native';

interface YesNoCardProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  imageSource: ImageSourcePropType;
}

export const YesNoCard: React.FC<YesNoCardProps> = ({ 
  label, 
  isSelected, 
  onSelect, 
  imageSource 
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.9}
      className={`w-[48%] aspect-[1.1] rounded-[24px] items-center justify-center border ${
        isSelected 
          ? 'bg-[#E1E1E6] border-white'  // Selected: Light Background
          : 'bg-[#1C1C1E] border-[#2A2A2D]' // Unselected: Dark Background
      }`}
    >
      {/* Circle Container for Image */}
      <View className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${
           isSelected ? 'bg-[#d1d1d6]' : 'bg-[#2C2C2E]'
      }`}>
          <Image 
            source={imageSource}
            style={{ width: 24, height: 24, resizeMode: 'contain' }}
          />
      </View>

      {/* Label Text */}
      <Text className={`text-[16px] font-bold ${
          isSelected ? 'text-black' : 'text-white'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
