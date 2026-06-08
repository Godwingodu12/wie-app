import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SettingItem } from '@/components/Settings/SettingsItem';

const PasswordSecurityScreen = () => {
  // Mock data for logged-in devices
  const devices = [
    { id: '1', device: 'iPhone 15 Pro', location: 'New York, USA', current: true },
    { id: '2', device: 'MacBook Pro 16"', location: 'London, UK', current: false },
  ];

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
        <Text className="text-white font-rubik-bold text-xl">Password and security</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          <Text className="text-gray-500 font-rubik-medium mb-3 ml-6 uppercase text-[11px] tracking-[1px]">
            Login & Recovery
          </Text>
          
          <View className="mx-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
            <SettingItem 
              label="Change password" 
              icon="key-outline" 
              onPress={() => { router.push('../SetOptions/ChangePassword')}} 
              showDivider={false}
            />
          </View>

          <Text className="text-gray-500 font-rubik-medium mb-3 mt-8 ml-6 uppercase text-[11px] tracking-[1px]">
            Security Checks
          </Text>

          <View className="mx-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
            <Text className="text-white/50 text-[13px] px-4 py-3 bg-[#1C2024]/30">
              Where you&apos;re logged in
            </Text>
            
            {devices.map((item, index) => (
              <TouchableOpacity 
                key={item.id}
                activeOpacity={0.7}
                className="flex-row items-center justify-between py-4 px-4 bg-[#121214]"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-9 h-9 rounded-xl bg-[#1C2024] items-center justify-center">
                    <Ionicons 
                      name={item.device.includes('iPhone') ? "phone-portrait-outline" : "desktop-outline"} 
                      size={20} 
                      color="#A0A0A0" 
                    />
                  </View>
                  <View className="ml-4">
                    <Text className="text-white font-rubik-medium text-[15px]">
                      {item.device} {item.current && <Text className="text-blue-500 text-[12px] ml-1">• This device</Text>}
                    </Text>
                    <Text className="text-gray-500 text-[12px]">{item.location}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#3E454D" />
              </TouchableOpacity>
            ))}
          </View>
          
          <View className="px-6 mt-4">
            <Text className="text-gray-600 text-[12px] leading-5">
              We protect your account by monitoring for suspicious activity and unusual logins. 
              If you see a device you don&apos;t recognize, log out immediately and change your password.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordSecurityScreen;
