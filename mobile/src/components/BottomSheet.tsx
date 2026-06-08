import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface SelectionBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const SelectionBottomSheet = ({
  isVisible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}: SelectionBottomSheetProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Background Blur Overlay */}
        {isVisible && (
          <Pressable 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={onClose}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 20 : 40}
              tint="dark"
              style={{ flex: 1 }}
            />
          </Pressable>
        )}

        {/* Modal Content */}
        <View className="flex-1 justify-end">
          <View className="bg-[#1C2024] rounded-t-[32px] p-6 pb-12 border-t border-gray-800">
            {/* Top Handle Indicator */}
            <View className="w-10 h-1 bg-gray-600 self-center rounded-full mb-4" />
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              {/* Removed the fixed width placeholder and centered the title */}
              <View className="flex-1 items-center">
                <Text className="text-white text-lg font-bold">{title}</Text>
              </View>
              
              {/* Close Button - No background container */}
              <TouchableOpacity 
                onPress={onClose} 
                className="absolute right-0"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={26} color="white" />
              </TouchableOpacity>
            </View>

            {/* Dynamic Options List */}
            {options.map((option) => (
              <TouchableOpacity 
                key={option}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
                className="flex-row justify-between items-center py-5 border-b border-gray-800/30"
              >
                <Text className="text-white text-base font-rubik">{option}</Text>
                
                {/* Radio Circle - No background container */}
                <View 
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    selectedValue === option ? 'border-[#8B5CF6]' : 'border-gray-500'
                  }`}
                >
                  {selectedValue === option ? (
                    <View className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};
