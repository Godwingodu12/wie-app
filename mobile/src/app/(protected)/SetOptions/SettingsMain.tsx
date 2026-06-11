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

  const accountManagement = [
    { label: 'Profile settings', icon: 'person-outline', action: () => router.push('/Profile/EditProfileScreen') },
    { label: 'Password and security', icon: 'shield-checkmark-outline', action: () => router.push('../SetOptions/PasswordAndSecurity') },
    { label: 'Personal details', icon: 'id-card-outline', action: () => router.push('../SetOptions/PersonalDetails') },
    { label: 'Connection profile', icon: 'people-outline', action: () => {} },
    { label: 'Wishlist', icon: 'heart-outline', action: () => {} },
  ];

  const privacyAndSafety = [
    { label: 'Account privacy', icon: 'lock-closed-outline', action: () => router.push('../SetOptions/AccountPrivacy') },
    { label: 'Close groups', icon: 'people-circle-outline', action: () => {} },
    { label: 'Blocked accounts', icon: 'ban-outline', action: () => router.push('../SetOptions/BlockedAccounts') },
    { label: 'Hide stories and posts', icon: 'eye-off-outline', action: () => {} },
    { label: 'Messages and story replies', icon: 'chatbubble-outline', action: () => {} },
    { label: 'Tags and mentions', icon: 'at-outline', action: () => {} },
    { label: 'Sharing options', icon: 'share-outline', action: () => {} },
    { label: 'Reported accounts', icon: 'flag-outline', action: () => {} },
    { label: 'Muted accounts', icon: 'volume-mute-outline', action: () => {} },
    { label: 'Content control', icon: 'options-outline', action: () => {} },
    { label: 'Hide like and share count', icon: 'heart-dislike-outline', action: () => {} },
  ];

  const activitiesAndHistory = [
    { label: 'Event preferences', icon: 'calendar-outline', action: () => {} },
    { label: 'Event history', icon: 'time-outline', action: () => {} },
    { label: 'Aura details', icon: 'sparkles-outline', action: () => {} },
    { label: 'Archive details', icon: 'archive-outline', action: () => {} },
  ];

  const paymentAndSubscription = [
    { label: 'Bank account linking', icon: 'card-outline', action: () => {} },
    { label: 'Subscription plans', icon: 'diamond-outline', action: () => {} },
    { label: 'Account status', icon: 'analytics-outline', action: () => {} },
  ];

  const appExperience = [
    { label: 'Notifications', icon: 'notifications-outline', action: () => {} },
    { label: 'Accessibility', icon: 'accessibility-outline', action: () => {} },
    { label: 'Language', icon: 'language-outline', action: () => {} },
    { label: 'Supervision and parental controls', icon: 'eye-outline', action: () => {} },
    { label: 'Permissions', icon: 'key-outline', action: () => {} },
    { label: 'Helps and supports', icon: 'help-circle-outline', action: () => {} },
    { label: 'Privacy center', icon: 'shield-outline', action: () => {} },
  ];

  const renderGroup = (title: string, items: any[]) => (
    <View className="mb-8">
      <Text className="text-gray-500 font-rubik-medium mb-3 ml-6 uppercase text-[11px] tracking-[1px]">
        {title}
      </Text>
      <View className="mx-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
        {items.map((item, index) => (
          <SettingItem 
            key={index}
            label={item.label}
            icon={item.icon as any}
            onPress={item.action}
            showDivider={index !== items.length - 1} 
          />
        ))}
      </View>
    </View>
  );

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
        <Text className="text-white font-rubik-bold text-xl">Settings and activity</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View className="px-4 mt-2 mb-6">
          <View className="flex-row items-center bg-[#121214] border border-[#1C2024] rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#52525B" />
            <Text className="text-white ml-3 text-base">Search</Text>
          </View>
        </View>

        {renderGroup('Account Management', accountManagement)}
        {renderGroup('Privacy and Safety', privacyAndSafety)}
        {renderGroup('Activities and History', activitiesAndHistory)}
        {renderGroup('Payment and Subscription', paymentAndSubscription)}
        {renderGroup('App Experience', appExperience)}

        {/* Danger Zone */}
        <View className="mb-10">
          <Text className="text-gray-500 font-rubik-medium mb-3 ml-6 uppercase text-[11px] tracking-[1px]">
            Account Actions
          </Text>
          <View className="mx-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsMain

const styles = StyleSheet.create({})
