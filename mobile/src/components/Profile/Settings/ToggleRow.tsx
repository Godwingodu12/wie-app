import React from 'react';
import { View, Text, Switch, Platform } from 'react-native';

export const ToggleRow = ({ label, value, onValueChange }: any) => {
  return (
    <View className="flex-row justify-between items-center py-3 mb-2">
      <Text className="text-white text-base font-medium">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3e3e3e', true: '#3b82f6' }}
      />
    </View>
  );
};
