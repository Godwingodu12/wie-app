import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const ScheduleMessage = () => {
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleSchedule = () => {
    if (!message.trim()) return;
    console.log('Scheduling message:', message, 'at', date);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-rubik-bold">Schedule message</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-6">
           <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-3 ml-1">Message</Text>
           <View className="bg-[#1F1F23] border border-white/5 rounded-2xl px-4 py-3 min-h-[120px]">
              <TextInput
                placeholder="Type your message here..."
                placeholderTextColor="#52525B"
                multiline
                className="text-white text-[16px] font-rubik-regular"
                value={message}
                onChangeText={setMessage}
              />
           </View>
        </View>

        <View className="mt-8">
           <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-3 ml-1">Send at</Text>
           
           <TouchableOpacity 
             onPress={() => setShowDatePicker(true)}
             className="flex-row items-center justify-between bg-[#1F1F23] border border-white/5 rounded-2xl p-4 h-[56px] mb-3"
           >
              <View className="flex-row items-center">
                 <Ionicons name="calendar-outline" size={20} color="#7C4DFF" />
                 <Text className="text-white ml-3 font-rubik-medium">{date.toLocaleDateString()}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#3F3F46" />
           </TouchableOpacity>

           <TouchableOpacity 
             onPress={() => setShowTimePicker(true)}
             className="flex-row items-center justify-between bg-[#1F1F23] border border-white/5 rounded-2xl p-4 h-[56px]"
           >
              <View className="flex-row items-center">
                 <Ionicons name="time-outline" size={20} color="#7C4DFF" />
                 <Text className="text-white ml-3 font-rubik-medium">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#3F3F46" />
           </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <View className="mt-10 items-center">
           <View className="flex-row items-center bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
              <Ionicons name="information-circle-outline" size={16} color="#71717A" />
              <Text className="text-zinc-500 text-[12px] ml-2">Message will be sent automatically at the set time.</Text>
           </View>
        </View>
      </ScrollView>

      <View className="p-6 pb-10 bg-black/80">
        <TouchableOpacity 
          onPress={handleSchedule}
          disabled={!message.trim()}
          className={`h-[56px] rounded-full items-center justify-center shadow-lg ${!message.trim() ? 'bg-zinc-800' : 'bg-[#7C4DFF]'}`}
        >
          <Text className={`font-rubik-bold text-lg ${!message.trim() ? 'text-zinc-500' : 'text-white'}`}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ScheduleMessage;
