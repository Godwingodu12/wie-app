import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const DisappearingMessages = () => {
  const [selectedOption, setSelectedOption] = useState('Off');

  const options = ['24 Hours', '7 Days', '90 Days', 'Off'];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-rubik-bold">Disappearing messages</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="items-center py-10">
           <View className="w-20 h-20 rounded-full bg-[#7C4DFF]/10 items-center justify-center border border-[#7C4DFF]/20 mb-6">
              <Ionicons name="time" size={40} color="#7C4DFF" />
           </View>
           <Text className="text-white text-lg font-rubik-bold text-center mb-4">Make messages in this chat disappear</Text>
           <Text className="text-zinc-500 text-[14px] text-center leading-[20px]">
             For more privacy and storage, all new messages will disappear from this chat for everyone after the selected duration, except when kept. Anyone in the chat can change this setting.
           </Text>
        </View>

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

        <TouchableOpacity className="mt-8 flex-row items-center">
           <Text className="text-[#7C4DFF] font-rubik-medium">Learn more</Text>
           <Ionicons name="chevron-forward" size={14} color="#7C4DFF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </ScrollView>

      <View className="p-6 pb-10 bg-black/80">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="h-[56px] bg-[#7C4DFF] rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white font-rubik-bold text-lg">Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DisappearingMessages;
