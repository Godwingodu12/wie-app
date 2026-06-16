import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const GroupInfo = () => {
  const params = useLocalSearchParams();
  const name = Array.isArray(params.name) ? params.name[0] : params.name || 'Group Name';
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar || 'https://via.placeholder.com/150';

  const participants = [
    { id: '1', name: 'You', status: 'Admin', avatar: 'https://via.placeholder.com/150' },
    { id: '2', name: 'Sam Alex', status: 'Online', avatar: 'https://via.placeholder.com/150' },
    { id: '3', name: 'Jane Doe', status: 'Offline', avatar: 'https://via.placeholder.com/150' },
  ];

  const SettingItem = ({ icon, label, subLabel, color = 'white', onPress }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center px-5 py-4 border-b border-white/5 active:bg-white/5"
    >
      <View className="w-10 h-10 rounded-xl bg-[#1C1C1E] items-center justify-center mr-4 border border-white/5">
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-white text-[16px] font-rubik-medium">{label}</Text>
        {subLabel && <Text className="text-zinc-500 text-[12px] font-rubik-regular">{subLabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-rubik-bold">Group info</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="items-center py-10">
          <Image source={{ uri: avatar }} className="w-32 h-32 rounded-full border-4 border-white/5" />
          <Text className="text-white text-2xl font-rubik-bold mt-4">{name}</Text>
          <Text className="text-zinc-500 text-[14px] font-rubik-medium mt-1">Group • {participants.length} Participants</Text>
          
          <View className="flex-row mt-8 gap-10">
            <TouchableOpacity className="items-center" onPress={() => router.push('/Message/GroupMemberSelection')}>
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                <Ionicons name="person-add" size={22} color="#8b5cf6" />
              </View>
              <Text className="text-zinc-400 text-[11px] mt-2 font-rubik-medium">Add</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                <Ionicons name="search" size={22} color="#8b5cf6" />
              </View>
              <Text className="text-zinc-400 text-[11px] mt-2 font-rubik-medium">Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Settings */}
        <View className="mt-4 bg-[#1C1C1E] border-y border-white/5">
           <SettingItem 
              icon="notifications-outline" 
              label="Mute Notifications" 
              subLabel="Off"
              onPress={() => router.push('/Message/MuteNotifications')}
           />
           <SettingItem 
              icon="time-outline" 
              label="Disappearing Messages" 
              subLabel="Off"
              onPress={() => router.push('/Message/DisappearingMessages')}
           />
           <SettingItem 
              icon="settings-outline" 
              label="Group Settings" 
              onPress={() => router.push('/Message/GroupPermissions')}
           />
        </View>

        {/* Participants List */}
        <View className="mt-8 px-5">
          <Text className="text-zinc-500 text-[12px] font-rubik-bold uppercase tracking-widest mb-4">
            {participants.length} Participants
          </Text>
          
          {participants.map((item) => (
            <TouchableOpacity key={item.id} className="flex-row items-center py-3">
              <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full bg-zinc-800" />
              <View className="ml-4 flex-1">
                <Text className="text-white font-rubik-bold text-[16px]">{item.name}</Text>
                <Text className="text-zinc-500 text-[12px]">{item.status}</Text>
              </View>
              {item.status === 'Admin' && (
                <View className="bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                  <Text className="text-primary text-[10px] font-rubik-bold">Admin</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Group */}
        <View className="mt-12 mb-20 bg-[#1C1C1E] border-y border-white/5">
           <SettingItem 
              icon="exit-outline" 
              label="Exit Group" 
              color="#EF4444"
              onPress={() => {}}
           />
           <SettingItem 
              icon="alert-circle-outline" 
              label="Report Group" 
              color="#EF4444"
              onPress={() => {}}
           />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupInfo;
