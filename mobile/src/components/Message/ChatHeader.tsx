import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
    // TODO: Implement report functionality
    console.log('Report user:', name);
    setReportModalVisible(false);
    setOptionsModalVisible(false);
  };

  const handleBlock = () => {
    // TODO: Implement block functionality
    console.log('Block user:', name);
    setBlockModalVisible(false);
    setOptionsModalVisible(false);
  };

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <Image 
            source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
            className="w-9 h-9 rounded-full bg-zinc-800" 
          />
          
          <View className="ml-3">
            <Text className="text-white font-rubik-bold text-[16px]">{name}</Text>
            <Text className="text-zinc-500 text-xs">{status}</Text>
          </View>
        </View>

        <View className="flex-row items-center relative">
          <TouchableOpacity onPress={() => setOptionsModalVisible(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Options Popup Menu - WhatsApp Style */}
      {optionsModalVisible && (
        <Modal
          visible={optionsModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setOptionsModalVisible(false)}
        >
          <Pressable
            className="flex-1 mt-2"
            onPress={() => setOptionsModalVisible(false)}
          >
            <View 
              className="absolute top-12 right-4 bg-[#1C1C1E] rounded-xl shadow-lg border border-zinc-800 min-w-[180px] overflow-hidden z-50"
              style={{ 
                elevation: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <TouchableOpacity
                className="px-4 py-3.5  active:bg-zinc-800"
                onPress={() => {
                  setOptionsModalVisible(false);
                  setClearChatModalVisible(true);
                }}
              >
                <Text className="text-white text-base font-normal">Clear chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-3.5  active:bg-zinc-800"
                onPress={() => {
                  setOptionsModalVisible(false);
                  setReportModalVisible(true);
                }}
              >
                <Text className="text-[#FF3B30] text-base font-normal">Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-3.5 active:bg-zinc-800"
                onPress={() => {
                  setOptionsModalVisible(false);
                  setBlockModalVisible(true);
                }}
              >
                <Text className="text-[#FF3B30] text-base font-normal">Block</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Clear Chat?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              This will delete all messages with {name}. This action cannot be undone.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setClearChatModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Report {name}?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              Are you sure you want to report this user? We&apos;ll review your report and take appropriate action.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-[32px] p-8"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-white text-2xl font-rubik-bold mb-2 text-center">
              Block {name}?
            </Text>
            <Text className="text-zinc-400 text-base text-center mb-8 mt-2">
              This user will no longer be able to send you messages or see your online status.
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setBlockModalVisible(false)}
                className="flex-1 h-14 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700"
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
