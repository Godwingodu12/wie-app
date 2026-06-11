import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const ChatSettings = () => {
  const params = useLocalSearchParams();
  const name = Array.isArray(params.name) ? params.name[0] : params.name || 'User';
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar || 'https://via.placeholder.com/150';

  const SettingItem = ({ icon, label, subLabel, color = 'white', onPress, rightElement }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center px-5 py-4 border-b border-white/5 active:bg-white/5"
    >
      <View className={`w-10 h-10 rounded-xl bg-zinc-900 items-center justify-center mr-4 border border-white/5`}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-white text-[16px] font-rubik-medium">{label}</Text>
        {subLabel && <Text className="text-zinc-500 text-[12px] font-rubik-regular">{subLabel}</Text>}
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={18} color="#3F3F46" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Custom Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-rubik-bold">Contact info</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View className="items-center py-10 bg-[#0F0F12]">
          <Image source={{ uri: avatar }} className="w-32 h-32 rounded-full border-4 border-[#1F1F23]" />
          <Text className="text-white text-2xl font-rubik-bold mt-4">{name}</Text>
          <Text className="text-zinc-500 text-[14px] font-rubik-medium mt-1">+1 234 567 8900</Text>
          
          <View className="flex-row mt-8 gap-10">
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 rounded-full bg-[#7C4DFF]/10 items-center justify-center border border-[#7C4DFF]/20">
                <Ionicons name="call" size={22} color="#7C4DFF" />
              </View>
              <Text className="text-zinc-400 text-[11px] mt-2 font-rubik-medium">Call</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 rounded-full bg-[#7C4DFF]/10 items-center justify-center border border-[#7C4DFF]/20">
                <Ionicons name="videocam" size={24} color="#7C4DFF" />
              </View>
              <Text className="text-zinc-400 text-[11px] mt-2 font-rubik-medium">Video</Text>
            </TouchableOpacity>
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 rounded-full bg-[#7C4DFF]/10 items-center justify-center border border-[#7C4DFF]/20">
                <Ionicons name="search" size={22} color="#7C4DFF" />
              </View>
              <Text className="text-zinc-400 text-[11px] mt-2 font-rubik-medium">Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Preview Section */}
        <View className="mt-4 px-5">
           <View className="flex-row justify-between items-center mb-4">
              <Text className="text-zinc-500 text-[12px] font-rubik-bold uppercase tracking-widest">Media, Links, and Docs</Text>
              <TouchableOpacity>
                 <Text className="text-[#7C4DFF] text-[12px] font-rubik-bold">82</Text>
              </TouchableOpacity>
           </View>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="w-20 h-20 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden">
                   <Image source={{ uri: `https://picsum.photos/200?random=${i}` }} className="w-full h-full opacity-60" />
                </View>
              ))}
           </ScrollView>
        </View>

        {/* Settings Group 1 */}
        <View className="mt-8 bg-[#1F1F23]/30 border-y border-white/5">
           <SettingItem 
              icon="notifications-outline" 
              label="Mute Notifications" 
              subLabel="Off"
              onPress={() => router.push('/Message/MuteNotifications')}
           />
           <SettingItem 
              icon="musical-notes-outline" 
              label="Custom Notifications" 
              onPress={() => {}}
           />
           <SettingItem 
              icon="images-outline" 
              label="Media Visibility" 
              onPress={() => {}}
           />
        </View>

        {/* Settings Group 2 */}
        <View className="mt-6 bg-[#1F1F23]/30 border-y border-white/5">
           <SettingItem 
              icon="lock-closed-outline" 
              label="Encryption" 
              subLabel="Messages and calls are end-to-end encrypted. Tap to verify."
              onPress={() => {}}
           />
           <SettingItem 
              icon="time-outline" 
              label="Disappearing Messages" 
              subLabel="Off"
              onPress={() => router.push('/Message/DisappearingMessages')}
           />
        </View>

        {/* Action Group */}
        <View className="mt-6 mb-20 bg-[#1F1F23]/30 border-y border-white/5">
           <SettingItem 
              icon="ban-outline" 
              label={`Block ${name}`} 
              color="#EF4444"
              onPress={() => {}}
           />
           <SettingItem 
              icon="alert-circle-outline" 
              label={`Report ${name}`} 
              color="#EF4444"
              onPress={() => {}}
           />
           <SettingItem 
              icon="trash-outline" 
              label="Clear Chat" 
              color="#EF4444"
              onPress={() => {}}
           />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatSettings;
