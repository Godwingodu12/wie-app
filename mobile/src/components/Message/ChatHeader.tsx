import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

interface ChatHeaderProps {
  name: string;
  avatar: any;
  status: string;
  onClearChat?: () => void;
}

export const ChatHeader = ({ name, avatar, status, onClearChat }: ChatHeaderProps) => {
  const navigation = useNavigation();
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [clearChatModalVisible, setClearChatModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  const handleClearChat = () => {
    if (onClearChat) {
      onClearChat();
    }
    setClearChatModalVisible(false);
    setOptionsModalVisible(false);
  };

  const handleReport = () => {
    console.log('Report user:', name);
    setReportModalVisible(false);
    setOptionsModalVisible(false);
  };

  const handleBlock = () => {
    console.log('Block user:', name);
    setBlockModalVisible(false);
    setOptionsModalVisible(false);
  };

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5 bg-black">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1">
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/Message/ChatSettings', params: { name, avatar } })}
            className="flex-row items-center flex-1"
          >
            <Image 
              source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
              className="w-10 h-10 rounded-full bg-zinc-800" 
            />
            
            <View className="ml-3">
              <Text className="text-white font-rubik-bold text-[17px]" numberOfLines={1}>{name}</Text>
              <Text className="text-[#22C55E] text-[12px] font-rubik-medium">{status}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity className="p-1">
            <Ionicons name="call-outline" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="p-1">
            <Ionicons name="videocam-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOptionsModalVisible(true)} className="p-1">
            <Ionicons name="ellipsis-vertical" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Popup Menu */}
      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setOptionsModalVisible(false)}
        >
          <View 
            className="absolute top-14 right-4 bg-[#1C1C1E] rounded-2xl shadow-2xl border border-white/10 min-w-[220px] overflow-hidden z-50"
            style={{ 
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}
          >
            <TouchableOpacity 
               onPress={() => { setOptionsModalVisible(false); router.push('/Message/MuteNotifications'); }}
               className="flex-row items-center justify-between px-5 py-4 active:bg-white/5 border-b border-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Mute notifications</Text>
              <Ionicons name="notifications-off-outline" size={18} color="#71717A" />
            </TouchableOpacity>
            
            <TouchableOpacity 
               onPress={() => { setOptionsModalVisible(false); router.push('/Message/SearchInsideChat'); }}
               className="flex-row items-center justify-between px-5 py-4 active:bg-white/5 border-b border-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Search</Text>
              <Ionicons name="search-outline" size={18} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between px-5 py-4 active:bg-white/5 border-b border-white/5">
              <Text className="text-white text-[15px] font-rubik-medium">Disappearing messages</Text>
              <Ionicons name="time-outline" size={18} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 active:bg-white/5 border-b border-white/5"
              onPress={() => {
                setOptionsModalVisible(false);
                setClearChatModalVisible(true);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">Clear chat</Text>
              <Ionicons name="trash-outline" size={18} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 active:bg-white/5 border-b border-white/5"
              onPress={() => {
                setOptionsModalVisible(false);
                setReportModalVisible(true);
              }}
            >
              <Text className="text-[#EF4444] text-[15px] font-rubik-bold">Report</Text>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between px-5 py-4 active:bg-white/5"
              onPress={() => {
                setOptionsModalVisible(false);
                setBlockModalVisible(true);
              }}
            >
              <Text className="text-[#EF4444] text-[15px] font-rubik-bold">Block</Text>
              <Ionicons name="ban-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Clear Chat Confirmation Modal */}
      <Modal
        visible={clearChatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setClearChatModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center px-8"
          onPress={() => setClearChatModalVisible(false)}
        >
          <Pressable
            className="w-full bg-zinc-900 border border-white/5 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center self-center mb-6">
               <Ionicons name="trash" size={32} color="#EF4444" />
            </View>
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Clear Chat?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              This will delete all messages with {name}. This action cannot be undone.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setClearChatModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-white/5"
              >
                <Text className="text-white font-rubik-medium text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearChat}
                className="flex-1 h-14 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-white font-rubik-bold text-lg">Clear</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Confirmation Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center px-8"
          onPress={() => setReportModalVisible(false)}
        >
          <Pressable
            className="w-full bg-zinc-900 border border-white/5 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center self-center mb-6">
               <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Report {name}?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              Are you sure you want to report this user? We&apos;ll review your report and take appropriate action.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-white/5"
              >
                <Text className="text-white font-rubik-medium text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReport}
                className="flex-1 h-14 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-white font-rubik-bold text-lg">Report</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal
        visible={blockModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center items-center px-8"
          onPress={() => setBlockModalVisible(false)}
        >
          <Pressable
            className="w-full bg-zinc-900 border border-white/5 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center self-center mb-6">
               <Ionicons name="ban" size={32} color="#EF4444" />
            </View>
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Block {name}?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              This user will no longer be able to send you messages or see your online status.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setBlockModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-white/5"
              >
                <Text className="text-white font-rubik-medium text-lg">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBlock}
                className="flex-1 h-14 rounded-full bg-red-600 items-center justify-center"
              >
                <Text className="text-white font-rubik-bold text-lg">Block</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
