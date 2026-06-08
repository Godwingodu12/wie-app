import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  showDivider?: boolean; // To control line separators
}

export const SettingItem = ({ icon, label, onPress, isDestructive, showDivider = true }: SettingItemProps) => (
  <View className="px-4 bg-[#121214]"> 
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between py-4"
    >
      <View className="flex-row items-center flex-1">
        {/* Icon Container with a glass-morphism style or simple clean look */}
        <View className={`w-9 h-9 rounded-xl items-center justify-center ${isDestructive ? 'bg-red-500/10' : 'bg-[#1C2024]'}`}>
          <Ionicons 
            name={icon} 
            size={20} 
            color={isDestructive ? '#FF4B4B' : '#A0A0A0'} 
          />
        </View>
        
        <Text className={`text-[16px] ml-4 font-rubik-medium ${isDestructive ? 'text-red-500' : 'text-white/90'}`}>
          {label}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="chevron-forward" size={18} color="#3E454D" />
      </View>
    </TouchableOpacity>
    
    {/* Subtle Hairline Divider */}
    {showDivider && (
      <View className="h-[0.5px] bg-[#1C2024] ml-12" />
    )}
  </View>
);
