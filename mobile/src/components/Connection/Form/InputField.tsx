import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper to remove the white focus border on Web
const noOutline = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

export const InputField = ({ label, placeholder, value, onChangeText, isDate, onPress, helpText, helpTextColor, multiline }: any) => (
  <View className="mb-5">
    {/* Label */}
    <Text className="text-[#a8a29e] text-sm mb-2">{label}</Text>
    
    {/* Input Container */}
    <TouchableOpacity 
      activeOpacity={isDate ? 0.7 : 1} 
      onPress={isDate ? onPress : undefined}
      className={`flex-row items-center bg-[#0c0a09] rounded-xl border border-[#1c1917] px-[15px] ${
        multiline ? 'h-[120px] items-start pt-[15px]' : 'h-14'
      }`}
    >
      <TextInput
        className="flex-1 text-white text-base"
        placeholder={placeholder}
        placeholderTextColor="#4b5563"
        value={value}
        onChangeText={onChangeText}
        editable={!isDate}
        multiline={multiline}
        pointerEvents={isDate ? 'none' : 'auto'}
        underlineColorAndroid="transparent"
        textAlignVertical={multiline ? 'top' : 'center'}
        style={noOutline as any} // Keeps the web UI clean
      />
      {isDate && <Ionicons name="calendar-outline" size={22} color="#4b5563" />}
    </TouchableOpacity>

    {/* Helper Text */}
    {helpText && (
      <Text 
        className="text-xs mt-1.5 px-0.5" 
        style={{ color: helpTextColor || '#4b5563' }}
      >
        {helpText}
      </Text>
    )}
  </View>
);
