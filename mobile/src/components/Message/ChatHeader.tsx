import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Platform, ActivityIndicator, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatHeaderProps {
  name: string;
  avatar: any;
  status: string;
  onClearChat?: () => void;
}

export const ChatHeader = ({ name, avatar, status, onClearChat }: ChatHeaderProps) => {
  const [mainMenuVisible, setMainMenuVisible] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [clearChatModalVisible, setClearChatModalVisible] = useState(false);
  const [exportChatModalVisible, setExportChatModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [muteModalVisible, setMuteModalVisible] = useState(false);
  const [disappearingMessagesModalVisible, setDisappearingMessagesModalVisible] = useState(false);
  
  const [blockUserInReport, setBlockUserInReport] = useState(false);
  const [clearMediaInClearChat, setClearMediaInClearChat] = useState(false);
  const [includeMediaInExportChat, setIncludeMediaInExportChat] = useState(false);
  
  const [reportSelected, setReportSelected] = useState(false);
  const [selectedMuteOption, setSelectedMuteOption] = useState('8 hours');
  const [selectedDisappearingOption, setSelectedDisappearingOption] = useState('Off');
  const [isDisappearingLoading, setIsDisappearingLoading] = useState(false);
  const [isMuteLoading, setIsMuteLoading] = useState(false);

  const [customDate, setCustomDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const generateDays = (date: Date) => {
    const days = [];
    const start = new Date(date);
    start.setDate(start.getDate() - 3);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleClearChat = () => {
    console.log('Clearing chat with:', name, 'Clear media:', clearMediaInClearChat);
    if (onClearChat) {
      onClearChat();
    }
    setClearChatModalVisible(false);
    setMoreMenuVisible(false);
  };

  const handleDisappearingMessages = () => {
    setIsDisappearingLoading(true);
    // Simulate working delay
    setTimeout(() => {
      setIsDisappearingLoading(false);
      setDisappearingMessagesModalVisible(false);
    }, 1500);
  };

  const handleMuteDone = () => {
    setIsMuteLoading(true);
    // Simulate working delay
    setTimeout(() => {
      setIsMuteLoading(false);
      setMuteModalVisible(false);
    }, 1500);
  };

  const handleExportChat = () => {
    console.log('Exporting chat with:', name, 'Include media:', includeMediaInExportChat);
    setExportChatModalVisible(false);
    setMoreMenuVisible(false);
  };

  const handleReport = () => {
    console.log('Report user:', name, 'Block user:', blockUserInReport);
    setReportModalVisible(false);
    setMoreMenuVisible(false);
  };

  const handleBlock = () => {
    console.log('Block user:', name, 'Report selected:', reportSelected);
    setBlockModalVisible(false);
    setMoreMenuVisible(false);
  };

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5 bg-black">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(protected)/(tabs)')} 
            className="mr-2 p-1"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push({ pathname: name.includes('Group') ? '/Message/GroupInfo' : '/Message/ChatSettings', params: { name, avatar } })}
            className="flex-row items-center flex-1"
          >
            <Image 
              source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
              className="w-10 h-10 rounded-full bg-zinc-800" 
            />
            
            <View className="ml-3">
              <Text className="text-white font-rubik-bold text-[17px]" numberOfLines={1}>{name}</Text>
              <Text className="text-primary text-[12px] font-rubik-medium">{status}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity className="p-1">
            <Ionicons name="videocam-outline" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="p-1">
            <Ionicons name="call-outline" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMainMenuVisible(true)} className="p-1">
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Popup Menu */}
      <Modal
        visible={mainMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMainMenuVisible(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setMainMenuVisible(false)}
        >
          <View 
            className="absolute top-16 right-4 bg-[#1C1C1E] rounded-2xl shadow-2xl border border-white/10 min-w-[200px] overflow-hidden z-50"
          >
            <TouchableOpacity 
              onPress={() => { 
                setMainMenuVisible(false); 
                router.push({ pathname: name.includes('Group') ? '/Message/GroupInfo' : '/Message/ChatSettings', params: { name, avatar } });
              }}
              className="px-5 py-3.5 active:bg-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">View Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setMainMenuVisible(false);
                router.push({ pathname: '/Message/MediaLinksDocs', params: { name, avatar } });
              }}
              className="px-5 py-3.5 active:bg-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Media,links and docs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setMainMenuVisible(false);
                router.push('/Message/SearchInsideChat');
              }}
              className="px-5 py-3.5 active:bg-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 active:bg-white/5"
              onPress={() => setMainMenuVisible(false)}
            >
              <Text className="text-white text-[15px] font-rubik-medium">New group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 active:bg-white/5"
              onPress={() => {
                setMainMenuVisible(false);
                setMuteModalVisible(true);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">Mute notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 active:bg-white/5"
              onPress={() => {
                setMainMenuVisible(false);
                setDisappearingMessagesModalVisible(true);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">Disappearing messages</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 flex-row items-center justify-between active:bg-white/5"
              onPress={() => {
                setMainMenuVisible(false);
                setMoreMenuVisible(true);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">More</Text>
              <Ionicons name="caret-forward" size={14} color="white" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* More Submenu */}
      <Modal
        visible={moreMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMoreMenuVisible(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setMoreMenuVisible(false)}
        >
          <View 
            className="absolute top-16 right-4 bg-[#1C1C1E] rounded-2xl shadow-2xl border border-white/10 min-w-[180px] overflow-hidden z-50"
          >
            <TouchableOpacity 
              onPress={() => { setMoreMenuVisible(false); setReportModalVisible(true); }}
              className="px-5 py-3.5 active:bg-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => { setMoreMenuVisible(false); setBlockModalVisible(true); }}
              className="px-5 py-3.5 active:bg-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Block</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setMoreMenuVisible(false); setClearChatModalVisible(true); }}
              className="px-5 py-3.5 active:bg-white/5"
            >
              <Text className="text-white text-[15px] font-rubik-medium">Clear chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 active:bg-white/5"
              onPress={() => {
                setMoreMenuVisible(false);
                setExportChatModalVisible(true);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">Export chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 active:bg-white/5"
              onPress={() => {
                setMoreMenuVisible(false);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">Add shortcut</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-5 py-3.5 active:bg-white/5"
              onPress={() => {
                setMoreMenuVisible(false);
              }}
            >
              <Text className="text-white text-[15px] font-rubik-medium">Pin</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Mute Notifications Modal */}
      <Modal
        visible={muteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isMuteLoading && setMuteModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-8"
        >
          <View
            className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl"
          >
            <BlurView intensity={60} tint="dark">
              <LinearGradient
                colors={['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.9)', 'rgba(139, 92, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-white text-[20px] font-rubik-bold mb-2">
                  Mute message Notifications
                </Text>
                <Text className="text-zinc-500 text-[13px] font-rubik-regular mb-6 leading-5">
                  Other members will not see that you have muted this chat.You will still be notified if you are mentioned
                </Text>

                {/* Options */}
                {['8 hours', '1 week', 'Always', 'Custom'].map((option) => (
                  <TouchableOpacity 
                    key={option}
                    activeOpacity={0.8}
                    onPress={() => !isMuteLoading && setSelectedMuteOption(option)}
                    className="flex-row items-center mb-5"
                    disabled={isMuteLoading}
                  >
                    <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                      {selectedMuteOption === option && (
                        <LinearGradient
                          colors={['#C084FC', '#8B5CF6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="w-3.5 h-3.5 rounded-full"
                        />
                      )}
                    </View>
                    <Text className="text-white text-[16px] font-rubik-medium ml-3">{option}</Text>
                  </TouchableOpacity>
                ))}

                {/* Custom Selection */}
                {selectedMuteOption === 'Custom' && (
                  <View className="mb-6">
                    <Text className="text-white text-[16px] font-rubik-bold mb-4">Select date and time</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        onPress={() => !isMuteLoading && setShowDatePicker(true)}
                        className="flex-1 bg-[#1C1C1E] rounded-xl px-4 py-3 flex-row items-center justify-between border border-white/5"
                        disabled={isMuteLoading}
                      >
                        <Text className="text-zinc-400 text-[14px]">{formatDate(customDate)}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#52525B" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => !isMuteLoading && setShowTimePicker(true)}
                        className="flex-1 bg-[#1C1C1E] rounded-xl px-4 py-3 flex-row items-center justify-between border border-white/5"
                        disabled={isMuteLoading}
                      >
                        <Text className="text-zinc-400 text-[14px]">{formatTime(customDate)}</Text>
                        <Ionicons name="time-outline" size={18} color="#52525B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row items-center justify-end gap-10 mt-4">
                  <TouchableOpacity
                    onPress={() => !isMuteLoading && setMuteModalVisible(false)}
                    disabled={isMuteLoading}
                  >
                    <Text className="text-white font-rubik-bold text-[16px]">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleMuteDone}
                    activeOpacity={0.8}
                    disabled={isMuteLoading}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 25 }}
                      className="px-10 py-3 flex-row items-center justify-center min-w-[120px]"
                    >
                      {isMuteLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-rubik-bold text-[16px]">Done</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Pressable>
      </Modal>

      {/* Disappearing Messages Modal */}
      <Modal
        visible={disappearingMessagesModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDisappearingLoading && setDisappearingMessagesModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-8"
        >
          <View
            className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl"
          >
            <BlurView intensity={60} tint="dark">
              <LinearGradient
                colors={['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.9)', 'rgba(139, 92, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-white text-[20px] font-rubik-bold mb-2">
                  Disappearing messages
                </Text>
                <Text className="text-zinc-500 text-[13px] font-rubik-regular mb-4 leading-5">
                  Make messages in this chat disappear
                </Text>

                <Text className="text-white text-[16px] font-rubik-bold mb-5 mt-2">Message Timer</Text>

                {/* Options */}
                {['1 hour', '24 hours', '7 days', '90 days', 'Custom', 'Off'].map((option) => (
                  <TouchableOpacity 
                    key={option}
                    activeOpacity={0.8}
                    onPress={() => !isDisappearingLoading && setSelectedDisappearingOption(option)}
                    className="flex-row items-center mb-5"
                    disabled={isDisappearingLoading}
                  >
                    <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                      {selectedDisappearingOption === option && (
                        <LinearGradient
                          colors={['#C084FC', '#8B5CF6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="w-3.5 h-3.5 rounded-full"
                        />
                      )}
                    </View>
                    <Text className="text-white text-[16px] font-rubik-medium ml-3">{option}</Text>
                  </TouchableOpacity>
                ))}

                {/* Custom Selection */}
                {selectedDisappearingOption === 'Custom' && (
                  <View className="mb-6">
                    <Text className="text-white text-[16px] font-rubik-bold mb-4">Select date and time</Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity 
                        onPress={() => !isDisappearingLoading && setShowDatePicker(true)}
                        className="flex-1 bg-[#1C1C1E] rounded-xl px-4 py-3 flex-row items-center justify-between border border-white/5"
                        disabled={isDisappearingLoading}
                      >
                        <Text className="text-zinc-400 text-[14px]">{formatDate(customDate)}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#52525B" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => !isDisappearingLoading && setShowTimePicker(true)}
                        className="flex-1 bg-[#1C1C1E] rounded-xl px-4 py-3 flex-row items-center justify-between border border-white/5"
                        disabled={isDisappearingLoading}
                      >
                        <Text className="text-zinc-400 text-[14px]">{formatTime(customDate)}</Text>
                        <Ionicons name="time-outline" size={18} color="#52525B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row items-center justify-end gap-10 mt-4">
                  <TouchableOpacity
                    onPress={() => !isDisappearingLoading && setDisappearingMessagesModalVisible(false)}
                    disabled={isDisappearingLoading}
                  >
                    <Text className="text-white font-rubik-bold text-[16px]">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDisappearingMessages}
                    activeOpacity={0.8}
                    disabled={isDisappearingLoading}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 25 }}
                      className="px-10 py-3 flex-row items-center justify-center min-w-[120px]"
                    >
                      {isDisappearingLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-rubik-bold text-[16px]">Done</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Pressable>
      </Modal>

      {/* Export Chat Modal */}
      <Modal
        visible={exportChatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExportChatModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-8"
          onPress={() => setExportChatModalVisible(false)}
        >
          <View className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
            <BlurView intensity={60} tint="dark">
              <LinearGradient
                colors={['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.9)', 'rgba(139, 92, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-white text-[20px] font-rubik-bold mb-6">
                  Export chat
                </Text>

                {/* Include Media Checkbox */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setIncludeMediaInExportChat(!includeMediaInExportChat)}
                  className="flex-row items-center mb-8"
                >
                  <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                    {includeMediaInExportChat && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-zinc-400 text-[14px] font-rubik-medium ml-3 flex-1">
                    Include media(Increases the size of the export)
                  </Text>
                </TouchableOpacity>

                {/* Action Button */}
                <View className="flex-row items-center justify-end">
                  <TouchableOpacity
                    onPress={handleExportChat}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 25 }}
                      className="px-10 py-3"
                    >
                      <Text className="text-white font-rubik-bold text-[16px]">Export</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Pressable>
      </Modal>

      {/* Clear Chat Modal */}
      <Modal
        visible={clearChatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setClearChatModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-8"
          onPress={() => setClearChatModalVisible(false)}
        >
          <View className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
            <BlurView intensity={60} tint="dark">
              <LinearGradient
                colors={['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.9)', 'rgba(139, 92, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-white text-[20px] font-rubik-bold mb-6">
                  Clear this chat?
                </Text>

                {/* Clear Media Checkbox */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setClearMediaInClearChat(!clearMediaInClearChat)}
                  className="flex-row items-center mb-8"
                >
                  <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                    {clearMediaInClearChat && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-zinc-400 text-[14px] font-rubik-medium ml-3 flex-1">
                    Also delete the media received from the device gallery
                  </Text>
                </TouchableOpacity>

                {/* Action Button */}
                <View className="flex-row items-center justify-end">
                  <TouchableOpacity
                    onPress={handleClearChat}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 25 }}
                      className="px-10 py-3"
                    >
                      <Text className="text-white font-rubik-bold text-[16px]">Clear</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-8"
          onPress={() => setReportModalVisible(false)}
        >
          <View className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
            <BlurView intensity={60} tint="dark">
              <LinearGradient
                colors={['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.9)', 'rgba(139, 92, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-white text-[20px] font-rubik-bold mb-2">
                  Report
                </Text>
                <Text className="text-zinc-500 text-[13px] font-rubik-regular mb-6 leading-5">
                  The last 10 messages in this chat will be sent to check the behavior of the person
                </Text>

                {/* Block Toggle Section */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setBlockUserInReport(!blockUserInReport)}
                  className="flex-row items-start mb-8"
                >
                  <View className="mt-0.5">
                    <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                      {blockUserInReport && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white text-[16px] font-rubik-bold">Block {name}?</Text>
                    <Text className="text-zinc-500 text-[13px] font-rubik-regular mt-1 leading-4">
                      This person won't be able to message or call you
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View className="flex-row items-center justify-end gap-10">
                  <TouchableOpacity
                    onPress={() => setReportModalVisible(false)}
                  >
                    <Text className="text-white font-rubik-bold text-[16px]">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleReport}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 25 }}
                      className="px-10 py-3"
                    >
                      <Text className="text-white font-rubik-bold text-[16px]">Report</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
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
          className="flex-1 bg-black/60 justify-center items-center px-8"
          onPress={() => setBlockModalVisible(false)}
        >
          <View className="w-full rounded-[24px] overflow-hidden border border-white/10 shadow-2xl">
            <BlurView intensity={60} tint="dark">
              <LinearGradient
                colors={['rgba(28, 28, 30, 0.95)', 'rgba(28, 28, 30, 0.9)', 'rgba(139, 92, 246, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6"
              >
                <Text className="text-white text-[20px] font-rubik-bold mb-2">
                  Block {name}?
                </Text>
                <Text className="text-zinc-500 text-[13px] font-rubik-regular mb-6 leading-5">
                  This person won't be able to message or call you. They won't know you blocked or reported them.
                </Text>

                {/* Report Toggle Section */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => setReportSelected(!reportSelected)}
                  className="flex-row items-start mb-8"
                >
                  <View className="mt-0.5">
                    <View className="w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                      {reportSelected && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white text-[16px] font-rubik-bold">Report {name}?</Text>
                    <Text className="text-zinc-500 text-[13px] font-rubik-regular mt-1 leading-4">
                      The last 5 messages in this chat will be sent to check the behavior of the person
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View className="flex-row items-center justify-end gap-10">
                  <TouchableOpacity
                    onPress={() => setBlockModalVisible(false)}
                  >
                    <Text className="text-white font-rubik-bold text-[16px]">Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleBlock}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#C084FC', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 25 }}
                      className="px-10 py-3"
                    >
                      <Text className="text-white font-rubik-bold text-[16px]">Block</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Pressable>
      </Modal>
      <CustomDatePicker 
        visible={showDatePicker} 
        date={customDate} 
        setDate={setCustomDate} 
        onClose={() => setShowDatePicker(false)} 
      />
      <CustomTimePicker 
        visible={showTimePicker} 
        date={customDate} 
        setDate={setCustomDate} 
        onClose={() => setShowTimePicker(false)} 
      />
    </>
  );
};

interface CustomDatePickerProps {
  visible: boolean;
  onClose: () => void;
  date: Date;
  setDate: (date: Date) => void;
}

const CustomDatePicker = ({ visible, onClose, date, setDate }: CustomDatePickerProps) => {
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDayText = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const flatListRef = React.useRef<any>(null);
  const isAutoScrolling = React.useRef(false);

  const days = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 120 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 60 + i);
      return d;
    });
  }, []);

  const ITEM_WIDTH = 54;
  const VISIBLE_ITEMS = 7;
  const CONTAINER_WIDTH = ITEM_WIDTH * VISIBLE_ITEMS;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const centerOnDate = React.useCallback((targetDate: Date, animated = true) => {
    const index = days.findIndex(d => 
      d.getDate() === targetDate.getDate() && 
      d.getMonth() === targetDate.getMonth() &&
      d.getFullYear() === targetDate.getFullYear()
    );
    if (index !== -1 && flatListRef.current) {
      isAutoScrolling.current = true;
      flatListRef.current?.scrollToOffset({ 
        offset: index * ITEM_WIDTH, 
        animated 
      });
      setTimeout(() => { isAutoScrolling.current = false; }, 500);
    }
  }, [days, ITEM_WIDTH]);

  const handleScrollEnd = (event: any) => {
    if (isAutoScrolling.current) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    if (index >= 0 && index < days.length) {
      const newDate = new Date(days[index]);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      if (newDate.getTime() !== date.getTime()) {
        setDate(newDate);
      }
    }
  };

  React.useEffect(() => {
    if (visible) {
      setTimeout(() => centerOnDate(date, false), 100);
    }
  }, [visible]);

  // Handle month navigation changes
  React.useEffect(() => {
    if (visible && !isAutoScrolling.current) {
      centerOnDate(date, true);
    }
  }, [date.getMonth(), date.getFullYear()]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 justify-center items-center px-4" onPress={onClose}>
        <Pressable className="w-full bg-[#1C1C1E] rounded-[32px] overflow-hidden border border-white/10 p-8 items-center" onPress={(e) => e.stopPropagation()}>
          <Text className="text-white text-[36px] font-rubik-medium mb-8">{selectedDayText}</Text>
          
          <View className="flex-row items-center justify-between w-full mb-12 px-2">
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-white text-[16px] font-rubik-medium mr-1">{monthYear}</Text>
              <Ionicons name="caret-down" size={14} color="#A1A1AA" />
            </TouchableOpacity>
            <View className="flex-row gap-8">
              <TouchableOpacity onPress={() => {
                const d = new Date(date);
                d.setMonth(d.getMonth() - 1);
                setDate(d);
              }}>
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                const d = new Date(date);
                d.setMonth(d.getMonth() + 1);
                setDate(d);
              }}>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ width: CONTAINER_WIDTH, height: 160 }} className="items-center">
            {/* Geometrically Precise Arched Separator Lines */}
            <View 
              pointerEvents="none"
              style={{ 
                position: 'absolute', 
                top: 55, 
                width: 1060, 
                height: 1060, 
                borderWidth: 1.2,
                borderColor: 'transparent',
                borderTopColor: 'rgba(255,255,255,0.18)',
                borderRadius: 530,
                zIndex: 5
              }} 
            />
            <View 
              pointerEvents="none"
              style={{ 
                position: 'absolute', 
                top: 109, 
                width: 1060, 
                height: 1060, 
                borderWidth: 1.2,
                borderColor: 'transparent',
                borderTopColor: 'rgba(255,255,255,0.18)',
                borderRadius: 530,
                zIndex: 5
              }} 
            />

            <Animated.FlatList
              ref={flatListRef}
              data={days}
              horizontal
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0 }}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.toISOString()}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={onScroll}
              onMomentumScrollEnd={handleScrollEnd}
              onScrollEndDrag={handleScrollEnd}
              contentContainerStyle={{ 
                paddingHorizontal: (CONTAINER_WIDTH - ITEM_WIDTH) / 2, 
                paddingTop: 0
              }}
              getItemLayout={(_, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                flatListRef.current?.scrollToOffset({ offset: info.index * ITEM_WIDTH, animated: false });
              }}
              renderItem={({ item, index }) => {
                const inputRange = [
                  (index - 3) * ITEM_WIDTH,
                  index * ITEM_WIDTH,
                  (index + 3) * ITEM_WIDTH,
                ];

                const translateY = scrollX.interpolate({
                  inputRange,
                  outputRange: [20, 0, 20],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });

                const scale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.8, 1, 0.8],
                  extrapolate: 'clamp',
                });

                const isSelected = item.getDate() === date.getDate() && 
                                 item.getMonth() === date.getMonth() &&
                                 item.getFullYear() === date.getFullYear();

                const weekday = item.toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <Animated.View 
                    style={{ 
                      width: ITEM_WIDTH, 
                      opacity,
                      transform: [{ translateY }, { scale }]
                    }} 
                    className="items-center justify-center"
                  >
                    <Text className="text-zinc-500 text-[11px] font-rubik-medium mb-2 absolute top-4">{weekday}</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        const newDate = new Date(item);
                        newDate.setHours(date.getHours());
                        newDate.setMinutes(date.getMinutes());
                        setDate(newDate);
                        centerOnDate(newDate, true);
                      }}
                      className={`w-11 h-11 rounded-full items-center justify-center overflow-hidden ${isSelected ? 'bg-[#8B5CF6]' : 'bg-[#18181B]'}`}
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 3,
                        elevation: 5,
                      }}
                    >
                      {!isSelected && (
                        <LinearGradient
                          colors={['rgba(0,0,0,0.4)', 'rgba(255,255,255,0.05)']}
                          className="absolute inset-0"
                        />
                      )}
                      <Text className={`text-[17px] font-rubik-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                        {item.getDate()}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              }}
            />
          </View>

          <View className="flex-row items-center justify-end w-full gap-10 mt-12">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-zinc-400 text-[16px] font-rubik-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onClose}
              className="bg-primary px-10 py-3 rounded-full shadow-lg"
            >
              <Text className="text-white text-[16px] font-rubik-bold">Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface CustomTimePickerProps {
  visible: boolean;
  onClose: () => void;
  date: Date;
  setDate: (date: Date) => void;
}

const CustomTimePicker = ({ visible, onClose, date, setDate }: CustomTimePickerProps) => {
  const isAM = date.getHours() < 12;
  const displayHour = date.getHours() % 12 || 12;
  const displayMinute = date.getMinutes();
  const hourScrollX = React.useRef(new Animated.Value(0)).current;
  const minuteScrollX = React.useRef(new Animated.Value(0)).current;
  const hourListRef = React.useRef<any>(null);
  const minuteListRef = React.useRef<any>(null);
  const isAutoScrolling = React.useRef(false);
  
  const toggleAMPM = () => {
    const d = new Date(date);
    const h = d.getHours();
    if (h >= 12) d.setHours(h - 12);
    else d.setHours(h + 12);
    setDate(d);
  };

  const ITEM_WIDTH = 50;
  const VISIBLE_ITEMS = 7;
  const CONTAINER_WIDTH = ITEM_WIDTH * VISIBLE_ITEMS;

  const hourData = React.useMemo(() => Array.from({ length: 36 }, (_, i) => (i % 12) + 1), []);
  const minuteData = React.useMemo(() => Array.from({ length: 180 }, (_, i) => i % 60), []);

  const centerOnTime = React.useCallback((h: number, m: number, animated = true) => {
    isAutoScrolling.current = true;
    if (hourListRef.current) {
      hourListRef.current.scrollToOffset({ offset: (12 + h - 1) * ITEM_WIDTH, animated });
    }
    if (minuteListRef.current) {
      minuteListRef.current.scrollToOffset({ offset: (60 + m) * ITEM_WIDTH, animated });
    }
    setTimeout(() => { isAutoScrolling.current = false; }, 500);
  }, []);

  React.useEffect(() => {
    if (visible) {
      setTimeout(() => {
        centerOnTime(displayHour, displayMinute, false);
      }, 100);
    }
  }, [visible]);

  const handleHourScrollEnd = (event: any) => {
    if (isAutoScrolling.current) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const h = (index % 12) + 1;
    const d = new Date(date);
    let newH = h;
    if (!isAM && newH !== 12) newH += 12;
    if (isAM && newH === 12) newH = 0;
    d.setHours(newH);
    if (d.getTime() !== date.getTime()) setDate(d);
  };

  const handleMinuteScrollEnd = (event: any) => {
    if (isAutoScrolling.current) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / ITEM_WIDTH);
    const m = index % 60;
    const d = new Date(date);
    d.setMinutes(m);
    if (d.getTime() !== date.getTime()) setDate(d);
  };

  const renderArchItem = (item: any, index: number, scroll: Animated.Value, isSelected: boolean, onPress: () => void) => {
    const inputRange = [
      (index - 3) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 3) * ITEM_WIDTH,
    ];

    const translateY = scroll.interpolate({
      inputRange,
      outputRange: [15, 0, 15],
      extrapolate: 'clamp',
    });

    const opacity = scroll.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    const scale = scroll.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={{ 
          width: ITEM_WIDTH, 
          opacity,
          transform: [{ translateY }, { scale }]
        }} 
        className="items-center justify-center h-12"
      >
        <TouchableOpacity 
          onPress={onPress}
          className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-[#8B5CF6]' : 'bg-[#1C1C1E]'}`}
          style={!isSelected ? {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 3,
            elevation: 5,
          } : {}}
        >
          {!isSelected && (
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.2)']}
              className="absolute inset-0 rounded-full"
            />
          )}
          <Text className={`text-[16px] font-rubik-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
            {typeof item === 'number' ? item.toString().padStart(2, '0') : item}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/70 justify-center items-center px-6" onPress={onClose}>
        <Pressable className="w-full bg-[#1C1C1E] rounded-[32px] overflow-hidden border border-white/10 p-8 items-center" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-baseline mb-12">
            <Text className="text-white text-[42px] font-rubik-medium">
              {displayHour.toString().padStart(2, '0')} : {displayMinute.toString().padStart(2, '0')}
            </Text>
            <TouchableOpacity onPress={toggleAMPM} className="ml-3">
              <Text className="text-white text-[20px] font-rubik-medium">{isAM ? 'AM' : 'PM'}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="w-full mb-2 h-24 justify-center items-center">
            {/* Arched Separator Line - Only one line below numbers */}
            <View 
              pointerEvents="none"
              style={{ 
                position: 'absolute', 
                top: 75, 
                width: 2056, 
                height: 2056, 
                borderWidth: 1, 
                borderColor: 'transparent',
                borderTopColor: 'rgba(255,255,255,0.12)',
                borderRadius: 1028,
                zIndex: 5
              }} 
            />
            <Animated.FlatList
              ref={hourListRef}
              data={hourData}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: hourScrollX } } }], { useNativeDriver: true })}
              onMomentumScrollEnd={handleHourScrollEnd}
              onScrollEndDrag={handleHourScrollEnd}
              contentContainerStyle={{ paddingHorizontal: (CONTAINER_WIDTH - ITEM_WIDTH) / 2 }}
              getItemLayout={(_, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
              renderItem={({ item, index }) => renderArchItem(item, index, hourScrollX, item === displayHour, () => {
                const d = new Date(date);
                let newH = item;
                if (!isAM && newH !== 12) newH += 12;
                if (isAM && newH === 12) newH = 0;
                d.setHours(newH);
                setDate(d);
                isAutoScrolling.current = true;
                hourListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
                setTimeout(() => { isAutoScrolling.current = false; }, 500);
              })}
            />
          </View>
          <Text className="text-zinc-500 text-center text-[12px] font-rubik-medium mb-6">Hours</Text>

          <View className="w-full mb-2 h-24 justify-center items-center">
            {/* Arched Separator Line - Only one line below numbers */}
            <View 
              pointerEvents="none"
              style={{ 
                position: 'absolute', 
                top: 75, 
                width: 2056, 
                height: 2056, 
                borderWidth: 1, 
                borderColor: 'transparent',
                borderTopColor: 'rgba(255,255,255,0.12)',
                borderRadius: 1028,
                zIndex: 5
              }} 
            />
            <Animated.FlatList
              ref={minuteListRef}
              data={minuteData}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: minuteScrollX } } }], { useNativeDriver: true })}
              onMomentumScrollEnd={handleMinuteScrollEnd}
              onScrollEndDrag={handleMinuteScrollEnd}
              contentContainerStyle={{ paddingHorizontal: (CONTAINER_WIDTH - ITEM_WIDTH) / 2 }}
              getItemLayout={(_, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
              renderItem={({ item, index }) => renderArchItem(item, index, minuteScrollX, item === displayMinute, () => {
                const d = new Date(date);
                d.setMinutes(item);
                setDate(d);
                isAutoScrolling.current = true;
                minuteListRef.current?.scrollToOffset({ offset: index * ITEM_WIDTH, animated: true });
                setTimeout(() => { isAutoScrolling.current = false; }, 500);
              })}
            />
          </View>
          <Text className="text-zinc-500 text-center text-[12px] font-rubik-medium mb-12">Minutes</Text>

          <View className="flex-row items-center justify-end w-full gap-10">
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text className="text-zinc-400 text-[16px] font-rubik-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onClose();
              }}
              activeOpacity={0.7}
              className="bg-primary px-10 py-3 rounded-full shadow-lg"
            >
              <Text className="text-white text-[16px] font-rubik-bold">Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
