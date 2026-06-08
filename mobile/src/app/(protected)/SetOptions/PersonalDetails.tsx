import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@/context/UserContext';

// We can create a small variation or a specialized component for data display
const DetailItem = ({ label, value, icon, showDivider = true }: any) => (
  <View className="px-4 bg-[#121214]">
    <View className="flex-row items-center justify-between py-5">
      <View className="flex-row items-center flex-1">
        <View className="w-9 h-9 rounded-xl bg-[#1C2024] items-center justify-center">
          <Ionicons name={icon} size={20} color="#A0A0A0" />
        </View>
        <View className="ml-4">
          <Text className="text-gray-500 text-[12px] uppercase tracking-wider font-rubik-medium">
            {label}
          </Text>
          <Text className="text-white text-[16px] font-rubik-medium mt-0.5">
            {value}
          </Text>
        </View>
      </View>
      {/* Optional: Add a 'Verify' or 'Edit' button here if needed */}
    </View>
    {showDivider && <View className="h-[0.5px] bg-[#1C2024] ml-12" />}
  </View>
);

const PersonalDetailsScreen = () => {
  const { user } = useUser();

  // Mock data for missing fields if not in your context yet
  const personalData = {
    email: "alex.design@example.com",
    phone:  "+1 (555) 000-1234",
    dob: "January 12, 1998",
  };

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
        <Text className="text-white font-rubik-bold text-xl">Personal details</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-6 px-6 mb-8">
          <Text className="text-white/60 text-[14px] leading-5 font-rubik">
            This information is private and won&apos;t be visible to other people using the platform. 
            We use this to keep your account secure.
          </Text>
        </View>

        <View className="mx-4 overflow-hidden rounded-3xl bg-[#121214] border border-[#1C2024]">
          <DetailItem 
            label="Email Address" 
            value={personalData.email} 
            icon="mail-outline" 
          />
          <DetailItem 
            label="Phone Number" 
            value={personalData.phone} 
            icon="call-outline" 
          />
          <DetailItem 
            label="Date of Birth" 
            value={personalData.dob} 
            icon="calendar-outline" 
            showDivider={false} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PersonalDetailsScreen;
