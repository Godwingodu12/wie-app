import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  onPress: () => void;
  title?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

// 1. PRIMARY GRADIENT BUTTON (Next)
export const GradientButton = ({ onPress, title, isLoading, disabled, className }: ButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={{ borderRadius: 9999 }}
      className={`w-full ${disabled ? 'opacity-50' : 'opacity-100'} ${className || ''}`}
    >
      <LinearGradient
        colors={['#9333ea', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 9999, height: 56, width: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold tracking-wide">{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// 2. SECONDARY OUTLINE BUTTON (Skip)
export const OutlineButton = ({ onPress, title, disabled, className }: ButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={{ borderRadius: 9999 }}
      className={`h-14 w-full border border-[#27272a] items-center justify-center bg-transparent ${disabled ? 'opacity-50' : 'opacity-100'} ${className || ''}`}
    >
      <Text className="text-white text-base font-semibold">{title}</Text>
    </TouchableOpacity>
  );
};

// 3. GREEN ADD BUTTON (New - "Add more locations +")
export const GreenAddButton = ({ onPress, title, disabled, className }: ButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={{ borderRadius: 9999 }}
      className={`h-12 px-6 bg-[#10b981] flex-row items-center justify-center self-center ${disabled ? 'opacity-50' : 'opacity-100'} ${className || ''}`}
    >
      <Text className="text-white text-[15px] font-semibold mr-1">{title}</Text>
      <Ionicons name="add" size={20} color="white" />
    </TouchableOpacity>
  );
};

// 4. SQUARE ICON BUTTON (New - Map Icon)
export const SquareIconButton = ({ onPress, icon, className }: ButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`h-14 w-14 bg-[#1c1c1e] rounded-xl items-center justify-center ml-3 ${className || ''}`}
    >
      <Ionicons name={icon || "map"} size={24} color="white" />
    </TouchableOpacity>
  );
};
