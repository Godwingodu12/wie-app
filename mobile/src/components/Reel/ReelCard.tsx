import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface ReelCardProps {
  thumbnail: string;
  onPress?: () => void;
}

const ReelCard = ({ thumbnail, onPress }: ReelCardProps) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={onPress}
      className="w-40 h-72 rounded-[24px] overflow-hidden bg-[#121417]"
    >
      <Image
        source={thumbnail || 'https://via.placeholder.com/400x700?text=Reel'}
        className="w-full h-full"
        contentFit="cover"
        transition={300}
      />
      
      {/* Play Icon Overlay */}
      <View className="absolute top-4 right-4 bg-black/20 p-1.5 rounded-lg border border-white/30">
        <Ionicons name="play" size={16} color="white" />
      </View>
    </TouchableOpacity>
  );
};

export default ReelCard;
