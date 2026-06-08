import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Option = { label: string; value: string };

type SelectInputProps = {
  label: string;
  value: string;
  options: Option[];
  onSelect: (val: string) => void;
};

export const SelectInput = ({ label, value, options, onSelect }: SelectInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-5">
      <Text className="text-gray-400 text-sm mb-2 font-medium ml-1">{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="bg-[#121214] border border-white/10 rounded-xl h-14 px-4 flex-row items-center justify-between"
      >
        <Text className="text-white text-base">{value}</Text>
        <Ionicons name="chevron-down" size={20} color="#9ca3af" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setVisible(false)}
        >
          <View className="bg-[#1C2024] rounded-t-3xl p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-rubik-bold">Select {label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                  className={`py-4 px-4 rounded-xl mb-2 flex-row justify-between items-center ${value === item.value ? 'bg-[#2979FF]/10 border border-[#2979FF]' : 'bg-white/5'
                    }`}
                >
                  <Text className={`text-base ${value === item.value ? 'text-[#2979FF] font-bold' : 'text-white'}`}>
                    {item.label}
                  </Text>
                  {value === item.value && <Ionicons name="checkmark-circle" size={20} color="#2979FF" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};
