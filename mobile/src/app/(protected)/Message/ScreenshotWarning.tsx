import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ScreenshotWarning = () => {
  return (
    <SafeAreaView className="flex-1 bg-black justify-center items-center px-8">
      <View className="w-24 h-24 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20 mb-8">
         <Ionicons name="camera-outline" size={48} color="#EF4444" />
      </View>
      
      <Text className="text-white text-3xl font-rubik-bold text-center mb-4">Screenshot Detected</Text>
      
      <Text className="text-zinc-400 text-lg text-center leading-[26px] mb-12">
        For your privacy and security, we notify participants when a screenshot is taken in this chat.
      </Text>
      
      <View className="w-full bg-[#1F1F23] rounded-[32px] p-6 border border-white/5 mb-12">
         <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-[#7C4DFF]/10 items-center justify-center mr-3">
               <Ionicons name="shield-checkmark" size={18} color="#7C4DFF" />
            </View>
            <Text className="text-white font-rubik-medium flex-1">Your privacy is our priority</Text>
         </View>
         <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-[#7C4DFF]/10 items-center justify-center mr-3">
               <Ionicons name="eye-off" size={18} color="#7C4DFF" />
            </View>
            <Text className="text-white font-rubik-medium flex-1">Messages are end-to-end encrypted</Text>
         </View>
      </View>

      <TouchableOpacity 
        onPress={() => router.back()}
        className="w-full h-[64px] bg-[#7C4DFF] rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white font-rubik-bold text-xl">I Understand</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ScreenshotWarning;
