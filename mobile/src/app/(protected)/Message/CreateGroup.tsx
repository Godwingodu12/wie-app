import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const CreateGroup = () => {
  const params = useLocalSearchParams();
  const members = params.members ? JSON.parse(params.members as string) : [];
  
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setGroupIcon(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // In a real app, call chatService.createGroup
      console.log('Creating group:', groupName, 'with members:', members);
      // For now, just simulate success and go home or to chat
      router.replace('/Message/MessageHome');
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-4"
        >
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-2xl font-rubik-bold">New group</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Group Icon Section */}
        <View className="items-center py-8">
           <TouchableOpacity onPress={pickImage} className="relative">
              <View className="w-24 h-24 rounded-full bg-[#1F1F23] items-center justify-center border border-white/5 overflow-hidden">
                {groupIcon ? (
                  <Image source={{ uri: groupIcon }} className="w-full h-full" />
                ) : (
                  <Ionicons name="camera" size={32} color="#52525B" />
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-[#7C4DFF] w-8 h-8 rounded-full items-center justify-center border-2 border-black">
                 <Ionicons name="add" size={20} color="white" />
              </View>
           </TouchableOpacity>
           <Text className="text-zinc-500 text-[12px] mt-4">Provide a group subject and optional group icon</Text>
        </View>

        {/* Group Name Input */}
        <View className="mb-8">
           <Text className="text-[#A0A0A0] text-[13px] font-rubik-medium mb-2 ml-1">Group name</Text>
           <View className="flex-row items-center bg-[#1F1F23] border border-white/5 rounded-2xl px-4 h-[56px]">
              <TextInput 
                placeholder="Enter group name"
                placeholderTextColor="#52525B"
                className="flex-1 text-white text-base font-rubik-regular"
                value={groupName}
                onChangeText={setGroupName}
              />
              <TouchableOpacity className="ml-2">
                 <Ionicons name="happy-outline" size={24} color="#52525B" />
              </TouchableOpacity>
           </View>
        </View>

        {/* Group Options */}
        <View className="mb-6 rounded-2xl bg-[#1F1F23] border border-white/5 overflow-hidden">
           <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-white/5">
              <View className="flex-row items-center">
                 <Ionicons name="time-outline" size={22} color="white" />
                 <Text className="text-white ml-3 text-[15px] font-rubik-medium">Disappearing messages</Text>
              </View>
              <View className="flex-row items-center">
                 <Text className="text-zinc-500 mr-2 text-[14px]">Off</Text>
                 <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
              </View>
           </TouchableOpacity>
           
           <TouchableOpacity className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center">
                 <Ionicons name="settings-outline" size={22} color="white" />
                 <Text className="text-white ml-3 text-[15px] font-rubik-medium">Group settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3F3F46" />
           </TouchableOpacity>
        </View>

        <Text className="text-zinc-600 font-rubik-medium uppercase text-[10px] tracking-widest ml-1 mb-4">
           Members: {members.length}
        </Text>
      </ScrollView>

      {/* Create Button */}
      <View className="p-6 pb-10 bg-black/80">
        <TouchableOpacity 
          onPress={handleCreate}
          disabled={!groupName.trim() || isSubmitting}
          className={`h-[56px] rounded-full items-center justify-center shadow-lg ${!groupName.trim() ? 'bg-[#1F1F23]' : 'bg-[#7C4DFF]'}`}
        >
          <Text className={`font-rubik-bold text-lg ${!groupName.trim() ? 'text-zinc-500' : 'text-white'}`}>
            Create group
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateGroup;
