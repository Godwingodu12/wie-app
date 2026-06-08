import React from 'react';
import { View, Text, TextInput } from 'react-native';

export const LabeledInput = ({ label, value, onChangeText, multiline, className }: any) => {
  return (
    <View className="mb-5">
      <Text className="text-gray-400 text-sm mb-2 font-medium ml-1">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        className={`bg-[#121214] border border-white/10 rounded-xl px-4 text-white text-base ${
          multiline ? 'h-32 py-4' : 'h-14'
        } ${className}`}
      />
    </View>
  );
};
