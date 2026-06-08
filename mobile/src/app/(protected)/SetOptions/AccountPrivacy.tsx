import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';

const AccountPrivacyScreen = () => {
  const [isPrivate, setIsPrivate] = useState(false);

  const toggleSwitch = () => setIsPrivate(previousState => !previousState);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 gap-4">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 bg-[#1C2024] rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-rubik-bold text-xl">Account privacy</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-6">
          <View className="mx-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
            <View className="flex-row items-center justify-between py-5 px-4">
              <View className="flex-row items-center flex-1">
                <View className="w-9 h-9 rounded-xl bg-[#1C2024] items-center justify-center">
                  <Ionicons 
                    name={isPrivate ? "lock-closed" : "lock-open-outline"} 
                    size={20} 
                    color={isPrivate ? "#3B82F6" : "#A0A0A0"} 
                  />
                </View>
                <Text className="text-white text-[16px] font-rubik-medium ml-4">
                  Private account
                </Text>
              </View>

              <Switch
                trackColor={{ false: '#1C2024', true: '#3B82F6' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isPrivate ? '#FFFFFF' : '#A0A0A0'}
                ios_backgroundColor="#1C2024"
                onValueChange={toggleSwitch}
                value={isPrivate}
              />
            </View>
          </View>

          {/* Contextual Information */}
          <View className="px-6 mt-6">
            <Text className="text-gray-500 text-[13px] leading-5 font-rubik">
              {isPrivate 
                ? "When your account is private, only people you approve can see your photos and videos. Your existing followers won't be affected."
                : "When your account is public, anyone on or off the app can see your profile and posts, even if they don't have an account."
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountPrivacyScreen;
