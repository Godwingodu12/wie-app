import React from 'react';
import { 
  Text, 
  TouchableOpacity 
} from 'react-native';

interface YearsCardProps {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const YearsCard: React.FC<YearsCardProps> = ({ 
  title, 
  isSelected, 
  onSelect 
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.9}
      // 👇 INCREASED SIZE: 
      // Width: 48% (Fills the half-width nicely)
      // Height: 110px (Taller and bigger)
      className={`w-[48%] h-[110px] rounded-[24px] items-center justify-center ${
        isSelected 
          ? 'bg-[#E8E8E8]'  // Selected: Light Off-White
          : 'bg-[#202020]'  // Unselected: Dark Grey #202020
      }`}
    >
      {/* Title - Now perfectly centered in the middle of the card */}
      <Text className={`text-[18px] font-semibold text-center ${
          isSelected ? 'text-black' : 'text-white'
      }`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
