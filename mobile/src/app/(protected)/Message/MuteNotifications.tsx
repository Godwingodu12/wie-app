import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const MuteNotifications = () => {
  const [selectedOption, setSelectedOption] = useState('8 Hours');
  
  const options = ['8 Hours', '1 Week', 'Always', 'Custom'];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-rubik-bold">Mute notifications</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-zinc-500 text-[14px] mb-8">Other participants will not see that you muted this chat. You will still be notified if you are mentioned.</Text>

        <View className="bg-[#1F1F23] rounded-[32px] border border-white/5 overflow-hidden">
          {options.map((opt, index) => (
            <TouchableOpacity 
              key={opt}
              onPress={() => setSelectedOption(opt)}
              className={`flex-row items-center justify-between p-5 ${index !== options.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <Text className={`text-base font-rubik-medium ${selectedOption === opt ? 'text-white' : 'text-zinc-400'}`}>{opt}</Text>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedOption === opt ? 'border-[#7C4DFF]' : 'border-zinc-700'}`}>
                {selectedOption === opt && <View className="w-3 h-3 rounded-full bg-[#7C4DFF]" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedOption === 'Custom' && (
          <View className="mt-8">
            <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-3 ml-1">Select date and time</Text>
            <TouchableOpacity className="flex-row items-center justify-between bg-[#1F1F23] border border-white/5 rounded-2xl p-4 h-[56px] mb-3">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="white" />
                <Text className="text-white ml-3">August 20, 2023</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#3F3F46" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between bg-[#1F1F23] border border-white/5 rounded-2xl p-4 h-[56px]">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={20} color="white" />
                <Text className="text-white ml-3">09:18 AM</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#3F3F46" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View className="p-6 pb-10 bg-black/80">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="h-[56px] bg-[#7C4DFF] rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white font-rubik-bold text-lg">OK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MuteNotifications;
