import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const HashtagItem = ({ label }: { label: string }) => (
  <TouchableOpacity className="mr-4 mb-4">
    <Text className="text-[#8B5CF6] font-rubik-medium text-lg">
      #{label}
    </Text>
  </TouchableOpacity>
);
