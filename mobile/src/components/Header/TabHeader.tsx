import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import icons from '@/constants/icons';
import { router } from 'expo-router';

export const TabHeader = () => {
  return (
    <View className="px-3 flex-row justify-between items-center mt-4 mb-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="settings-sharp" size={28} color={COLORS.white} />
        <Text className="font-rubik-semibold text-2xl text-white ml-1">Wie</Text>
      </View>

      <View className="flex-row items-center gap-4">
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push('/Post/CreatePostScreen')}
        >
          <Image source={icons.add} className="w-9 h-9" />
        </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => router.replace('/Notification/Tabswitcher')}
        >
          <Image source={icons.notification} className="w-9 h-9" />
        </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={() => router.replace('/Message/MessageHome')}
        >
          <Ionicons name="flash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

