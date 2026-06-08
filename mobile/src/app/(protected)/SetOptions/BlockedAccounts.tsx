import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import images from '@/constants/defaultAvatar';

const BlockedAccountsScreen = () => {
  const [blockedUsers, setBlockedUsers] = useState([
    { id: '1', username: 'dark_knight_99', profilePic: null },
    { id: '2', username: 'spammer_bot', profilePic: 'https://picsum.photos/200' },
    { id: '3', username: 'mystery_user', profilePic: null },
  ]);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const triggerUnblock = (user: any) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const confirmUnblock = () => {
    setBlockedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setIsModalVisible(false);
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
        <Text className="text-white font-rubik-bold text-xl">Blocked accounts</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-[#121214] border border-[#1C2024]">
          {blockedUsers.map((user, index) => (
            <View key={user.id}>
              <View className="flex-row items-center justify-between py-4 px-4">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={user.profilePic ? { uri: user.profilePic } : images.defaultAvatar}
                    className="w-11 h-11 rounded-full bg-[#1C2024]"
                  />
                  <Text className="text-white text-[15px] font-rubik-semibold ml-3">
                    @{user.username}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={() => triggerUnblock(user)}
                  className="bg-[#1C2024] px-4 py-2 rounded-xl border border-[#3E454D]"
                >
                  <Text className="text-white font-rubik-medium text-[13px]">Unblock</Text>
                </TouchableOpacity>
              </View>
              {index !== blockedUsers.length - 1 && <View className="h-[0.5px] bg-[#1C2024] ml-16" />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* --- CUSTOM UNBLOCK POPUP (MODAL) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable 
          onPress={() => setIsModalVisible(false)}
          className="flex-1 justify-end bg-black/70"
        >
          <Pressable className="bg-[#121214] rounded-t-[40px] p-6 pb-10 border-t border-[#1C2024]">
            {/* Handle Bar */}
            <View className="w-12 h-1 bg-[#1C2024] rounded-full self-center mb-6" />

            <View className="items-center">
                <View className="w-20 h-20 rounded-full border-2 border-[#1C2024] mb-4 overflow-hidden">
                    <Image
                        source={selectedUser?.profilePic ? { uri: selectedUser.profilePic } : images.defaultAvatar}
                        className="w-full h-full"
                    />
                </View>
                <Text className="text-white text-xl font-rubik-bold">Unblock @{selectedUser?.username}?</Text>
                <Text className="text-gray-400 text-center mt-3 px-4 font-rubik">
                    They will now be able to request to follow you, see your profile, and message you.
                </Text>
            </View>

            <View className="flex-row gap-3 mt-8">
              <TouchableOpacity 
                onPress={() => setIsModalVisible(false)}
                className="flex-1 h-[56px] bg-[#1C2024] rounded-full items-center justify-center"
              >
                <Text className="text-white font-rubik-semibold text-base">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={confirmUnblock}
                className="flex-1 h-[56px] bg-blue-600 rounded-full items-center justify-center"
              >
                <Text className="text-white font-rubik-semibold text-base">Unblock</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default BlockedAccountsScreen;
