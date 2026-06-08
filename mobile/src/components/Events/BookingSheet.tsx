import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Image, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { EventFooterButtons } from './EventButton';

interface BookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  eventData: { title: string; image: string; date: string; location: string; };
}

export const BookingSheet = ({ isVisible, onClose, eventData }: BookingSheetProps) => {
  const [count, setCount] = useState(1);

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1">
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable className="flex-1" onPress={onClose} />
        </BlurView>

        <View className="flex-1 justify-end">
          <View className="bg-[#121417] rounded-t-[32px] p-6 pb-10 border-t border-gray-800">
            <View className="w-12 h-1 bg-gray-700 rounded-full self-center mb-6" />
            <Text className="text-gray-300 text-center font-rubik-medium text-lg mb-8">Choose ticket count</Text>

            <View className="flex-row mb-10">
              <Image source={{ uri: eventData.image }} className="w-24 h-32 rounded-2xl mr-4" />
              <View className="flex-1 justify-center">
                <Text className="text-white font-rubik-bold text-xl mb-1">{eventData.title}</Text>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
                  <Text className="text-gray-400 ml-2 text-xs">{eventData.date}</Text>
                </View>
                <View className="flex-row items-center mb-4">
                  <Ionicons name="location-outline" size={14} color="#8B5CF6" />
                  <Text className="text-gray-400 ml-2 text-xs" numberOfLines={1}>{eventData.location}</Text>
                </View>

                <View className="flex-row items-center">
                  <TouchableOpacity onPress={() => count > 1 && setCount(count - 1)} className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-lg items-center justify-center">
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text className="text-white text-xl font-rubik-bold mx-6">{count}</Text>
                  <TouchableOpacity onPress={() => setCount(count + 1)} className="w-10 h-10 border border-[#8B5CF6]/50 rounded-lg items-center justify-center">
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                <Text className="text-white font-rubik-bold text-lg mt-4">Free event</Text>
              </View>
            </View>

            <EventFooterButtons 
              leftText="Cancel" leftIcon="close" onLeftPress={onClose}
              rightText="Confirm booking" rightIcon="checkmark-circle-outline"
              onRightPress={() => { console.log("Booked", count); onClose(); }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
