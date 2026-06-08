import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EventFooterButtonsProps {
  leftText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  rightText?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightColors?: [string, string, ...string[]];
}

export const EventFooterButtons = ({ 
  leftText, // Remove the default "Wishlist" here to check if it exists
  leftIcon = "bookmark",
  onLeftPress,
  rightText = "Book tickets",
  rightIcon = "ticket-outline",
  onRightPress,
  rightColors = ['#A855F7', '#6366F1'] 
}: EventFooterButtonsProps) => {
  return (
    <View className="flex-row gap-3 w-full">
      {/* ONLY RENDER IF leftText IS PROVIDED */}
      {leftText && (
        <TouchableOpacity 
          onPress={onLeftPress}
          className="flex-1 border border-gray-700 h-14 rounded-full flex-row items-center justify-center"
        >
          <Ionicons name={leftIcon} size={20} color="white" />
          <Text className="text-white font-rubik-bold ml-2">{leftText}</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        onPress={onRightPress}
        className="flex-1 h-14 overflow-hidden rounded-full"
      >
        <LinearGradient
          colors={rightColors}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          className="flex-1 flex-row items-center justify-center"
        >
          <Ionicons name={rightIcon} size={20} color="white" />
          <Text className="text-white font-rubik-bold ml-2">{rightText}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};
