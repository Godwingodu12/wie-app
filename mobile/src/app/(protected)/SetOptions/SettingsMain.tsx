import { StyleSheet, Text, View, Alert , ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SettingItem } from '@/components/Settings/SettingsItem';
import { authService } from '@/services/authService';

const SettingsMain = () => {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
              router.replace('/(public)/Login');
            } catch (error) {
              console.error('Logout error:', error);
              router.replace('/(public)/Login');
            }
          }
        },
      ]
    );
  };
  const settingsOptions = [
    { label: 'Edit profile', icon: 'person-outline', action: () => router.push('/Profile/EditProfileScreen') },
    { label: 'Password and security', icon: 'shield-checkmark-outline', action: () => {router.push('../SetOptions/PasswordAndSecurity')} },
    { label: 'Personal details', icon: 'id-card-outline', action: () => {router.push('../SetOptions/PersonalDetails')} },
    { label: 'Account privacy', icon: 'lock-closed-outline', action: () => {router.push('../SetOptions/AccountPrivacy')} },
    { label: 'Blocked accounts', icon: 'ban-outline', action: () => {router.push('../SetOptions/BlockedAccounts')} },
    { label: 'Connection profile', icon: 'people-outline', action: () => {} },
    { label: 'Event history', icon: 'time-outline', action: () => {} },
    { label: 'Notifications', icon: 'notifications-outline', action: () => {} },
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
      <Text className="text-white font-rubik-bold text-xl">Settings</Text>
    </View>

    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
  {/* Search Bar Section */}
  <View className="px-4 mt-2 mb-6">
     {/* Your Search Component here */}
  </View>

  {/* Grouped Section 1 */}
  <View className="mx-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
    {settingsOptions.map((item, index) => (
      <SettingItem 
        key={index}
        label={item.label}
        icon={item.icon as any}
        onPress={item.action}
        // Don't show divider on the last item of the group
        showDivider={index !== settingsOptions.length - 1} 
      />
    ))}
  </View>

  <Text className="text-gray-500 font-rubik-medium mb-3 mt-8 ml-6 uppercase text-[11px] tracking-[1px]">
    Danger Zone
  </Text>

  {/* Grouped Section 2 (Destructive) */}
  <View className="mx-4 mb-10 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
    <SettingItem 
      label="Deactivate account" 
      icon="remove-circle-outline" 
      onPress={() => {}} 
      isDestructive 
    />
    <SettingItem 
      label="Logout" 
      icon="log-out-outline" 
      onPress={handleLogout} 
      isDestructive 
      showDivider={false}
    />
  </View>
</ScrollView>
  </SafeAreaView>
  )
}

export default SettingsMain

const styles = StyleSheet.create({})
