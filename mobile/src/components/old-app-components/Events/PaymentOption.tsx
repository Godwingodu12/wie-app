import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaymentOptionProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}

export const PaymentOption = ({ label, isSelected, onPress, children }: PaymentOptionProps) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 ${
      isSelected ? 'bg-[#151b19] border border-[#10b98150]' : 'bg-[#111111] border border-transparent'
    }`}
  >
    <View className="flex-row items-center flex-1">
      {/* Checkbox Square */}
      <View className={`w-6 h-6 rounded-md border items-center justify-center mr-3 ${
        isSelected ? 'bg-[#10b981] border-[#10b981]' : 'border-gray-700'
      }`}>
        {isSelected && <Ionicons name="checkmark" size={16} color="black" />}
      </View>
      
      <Text className={`${isSelected ? 'text-[#10b981]' : 'text-gray-400'} font-medium text-[15px]`}>
        {label}
      </Text>
    </View>

    {/* Right Side Icons Container */}
    <View className="flex-row items-center gap-x-2">
      {children}
    </View>
  </TouchableOpacity>
);
