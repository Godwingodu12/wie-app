import React from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate width for 3 columns:
// Total width - (Outer Padding 16*2) - (Gaps between items 10*2) = available space
const COLUMN_WIDTH = (SCREEN_WIDTH - 52) / 3;

interface PhotoProps {
  uri: string;
  isVideo?: boolean;
}

export const PhotoCard = ({ uri, isVideo }: PhotoProps) => (
  <TouchableOpacity 
    activeOpacity={0.9} 
    style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH }}
    className="mb-3 rounded-2xl overflow-hidden bg-gray-900"
  >
    <Image 
      source={{ uri }} 
      className="w-full h-full" 
      resizeMode="cover"
    />
    
    {/* Video Overlay */}
    {isVideo && (
      <View className="absolute inset-0 items-center justify-center bg-black/20">
        <View 
          style={{ width: COLUMN_WIDTH * 0.4, height: COLUMN_WIDTH * 0.4 }}
          className="rounded-full border-[1.5px] border-white/80 items-center justify-center bg-black/10"
        >
          <Ionicons 
            name="play" 
            size={COLUMN_WIDTH * 0.2} 
            color="white" 
            style={{ marginLeft: 2 }} 
          />
        </View>
      </View>
    )}
  </TouchableOpacity>
);
