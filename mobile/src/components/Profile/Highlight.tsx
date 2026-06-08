import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import icons from '@/constants/icons';
import { COLORS } from '@/constants/theme';
import { Plus } from 'lucide-react-native';

interface HighlightProps {
  type?: 'add' | 'view';
  imageUrl?: string;
  title: string;
  onPress?: () => void;
}

const HighlightBubble = ({ type = 'view', imageUrl, title, onPress }: HighlightProps) => {
  return (
    <View className="items-center mr-4">
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <View className="w-24 h-32 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 justify-center items-center">
          {type === 'add' ? (
            // The "Add" Button UI
            <Plus color="white" size={32} strokeWidth={1.5} />
          ) : (
            // The Actual Highlight Image
            <Image 
              source={{ uri: imageUrl }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
      
      {/* Label Text */}
      <Text className="text-white mt-2 text-lg font-medium">
        {title}
      </Text>
    </View>
  );
};

export default HighlightBubble;
