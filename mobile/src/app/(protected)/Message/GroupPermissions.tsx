import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const GroupPermissions = () => {
  const [permissions, setPermissions] = useState({
    editSettings: true,
    sendMessages: true,
    addMembers: true,
  });

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const PermissionItem = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
    <View className="flex-row items-center justify-between p-5 border-b border-white/5">
      <Text className="text-white text-[16px] font-rubik-medium">{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#3F3F46', true: '#8b5cf6' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-rubik-bold">Group permissions</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-4">
          <Text className="text-zinc-500 text-[13px] font-rubik-medium uppercase tracking-widest mb-4 ml-1">
            Who can...
          </Text>
          
          <View className="bg-[#1C1C1E] rounded-[32px] border border-white/5 overflow-hidden">
            <PermissionItem 
              label="Edit group settings" 
              value={permissions.editSettings} 
              onToggle={() => togglePermission('editSettings')} 
            />
            <PermissionItem 
              label="Send messages" 
              value={permissions.sendMessages} 
              onToggle={() => togglePermission('sendMessages')} 
            />
            <PermissionItem 
              label="Add other members" 
              value={permissions.addMembers} 
              onToggle={() => togglePermission('addMembers')} 
            />
          </View>
        </View>

        <View className="mt-8 p-4">
          <Text className="text-zinc-500 text-[13px] font-rubik-regular text-center leading-[18px]">
            Admins can still edit group settings, send messages, and add members.
          </Text>
        </View>
      </ScrollView>

      <View className="p-6 pb-10">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="h-[56px] bg-primary rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white font-rubik-bold text-lg">Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default GroupPermissions;
