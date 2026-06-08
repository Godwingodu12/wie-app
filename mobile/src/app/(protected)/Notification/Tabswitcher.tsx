import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, SectionList, StatusBar, Modal, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotificationItem, NotificationData } from '@/components/Notification/NotificationItem';
import { notificationService } from '@/services/notificationService';

const INITIAL_LIMIT = 3;

// Helper to calculate time ago
const getRelativeTime = (timestamp: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  return `${Math.floor(diffInHours / 24)}d`;
};

const SkeletonItem = () => (
  <View className="px-6 py-4 flex-row items-start bg-black">
    <Skeleton colorMode="dark" radius="round" height={48} width={48} />
    <View className="flex-1 ml-4 gap-2">
      <View className="flex-row justify-between items-center">
        <Skeleton colorMode="dark" width={'60%'} height={15} />
        <Skeleton colorMode="dark" width={30} height={10} />
      </View>
      <Skeleton colorMode="dark" width={'40%'} height={12} />
    </View>
  </View>
);

export default function NotificationScreen() {
  const [sections, setSections] = useState<{ title: string; data: any[] }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [, setTick] = useState(0); 

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      if (data && data.data) {
        const notifs = data.data.map((n: any) => ({
          id: n._id,
          type: n.type || 'like',
          username: n.senderId?.username || 'User',
          actionText: n.message || 'interacted with you',
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          image: n.senderId?.profile_picture || 'https://via.placeholder.com/150',
          postImage: n.relatedEntityId?.mediaUrl || null,
          isUnread: !n.isRead,
          timestamp: new Date(n.createdAt)
        }));

        // Group by Today, Yesterday, Earlier
        const today: any[] = [];
        const yesterday: any[] = [];
        const earlier: any[] = [];
        const now = new Date();

        notifs.forEach((n: any) => {
          const date = new Date(n.timestamp);
          const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
          if (diffInDays === 0 && now.getDate() === date.getDate()) today.push(n);
          else if (diffInDays === 1 || (diffInDays === 0 && now.getDate() !== date.getDate())) yesterday.push(n);
          else earlier.push(n);
        });

        const newSections = [];
        if (today.length > 0) newSections.push({ title: 'Today', data: today });
        if (yesterday.length > 0) newSections.push({ title: 'Yesterday', data: yesterday });
        if (earlier.length > 0) newSections.push({ title: 'Earlier', data: earlier });

        setSections(newSections);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  const navigation = useNavigation();
  const isFullyEmpty = sections.every(section => section.data.length === 0);
  const unreadCount = sections.reduce((acc, section) => acc + section.data.filter(item => item.isUnread).length, 0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    setSections(prev => prev.map(section => ({
      ...section,
      data: section.data.map(item => item.id === id ? { ...item, isUnread: false } : item)
    })));
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSections(prev => prev.map(section => ({
      ...section,
      data: section.data.map(item => ({ ...item, isUnread: false }))
    })));
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const toggleMute = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsMuted(!isMuted);
    setModalVisible(false);
  };

  const toggleExpand = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpandedSections(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  const handleDelete = async (id: string) => {
    setSections(prev => prev.map(section => ({
      ...section,
      data: section.data.filter(item => item.id !== id)
    })));
    try {
      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <MotiView 
        from={{ opacity: 0, scale: 0.9, translateY: 30 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-full bg-zinc-900/40 border border-zinc-800/50 rounded-[40px] p-10 items-center backdrop-blur-md shadow-2xl"
      >
        <MotiView from={{ rotate: '0deg' }} animate={{ rotate: '6deg' }} transition={{ delay: 300 }} className="mb-8">
          <View className="w-20 h-20 bg-indigo-500 rounded-[28px] items-center justify-center shadow-2xl shadow-indigo-500/40">
            <Ionicons name="notifications" size={38} color="white" className="-rotate-6" />
          </View>
          <View className="absolute -inset-2 border border-indigo-500/20 rounded-[32px] -rotate-3 -z-10" />
        </MotiView>
        <Text className="text-white text-2xl font-rubik-bold text-center tracking-tight">No new vibes</Text>
        <Text className="text-zinc-400 text-center mt-3 font-rubik-regular leading-6">When people interact with your content, you&apos;ll see the magic happen here.</Text>
      </MotiView>
      <TouchableOpacity className="mt-8 py-2" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
        <Text className="text-zinc-600 font-rubik-medium text-xs underline uppercase tracking-widest">Notification Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />

        <View className="px-6 py-4 flex-row justify-between items-center border-b border-zinc-900">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/')} className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center border border-zinc-800">
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-rubik-bold">Activity</Text>
              <Text className="text-zinc-500 text-xs font-rubik-regular">{unreadCount} unread updates</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-5">
            {unreadCount > 0 && (
              <Reanimated.View entering={FadeIn} exiting={FadeOut}>
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text className="text-indigo-400 font-rubik-bold text-[10px] uppercase tracking-widest">
                    Mark all read
                  </Text>
                </TouchableOpacity>
              </Reanimated.View>
            )}
            {!isFullyEmpty && (
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Ionicons name="ellipsis-horizontal" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <Reanimated.View entering={FadeIn.duration(300)} className="flex-1">
            <View className="px-6 mt-8 mb-2">
              <Skeleton colorMode="dark" width={60} height={10} />
            </View>
            {[1, 2, 3, 4, 5].map((i) => <SkeletonItem key={i} />)}
          </Reanimated.View>
        ) : (
          <Reanimated.View entering={FadeIn.duration(600)} className="flex-1">
            <SectionList
              sections={isFullyEmpty ? [] : sections.map(section => ({
                ...section,
                data: expandedSections.includes(section.title) ? section.data : section.data.slice(0, INITIAL_LIMIT)
              }))}
              keyExtractor={(item) => item.id}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={{ flexGrow: 1 }}
              ListEmptyComponent={EmptyState}
              renderSectionHeader={({ section: { title, data } }) => (
                data.length > 0 ? (
                  <View className="px-6 mt-8 mb-2">
                    <Text className="text-zinc-500 font-rubik-bold uppercase tracking-[2px] text-[10px]">{title}</Text>
                  </View>
                ) : null
              )}
              renderItem={({ item }) => (
                <NotificationItem 
                  item={{
                    ...item,
                    relativeTime: getRelativeTime(item.timestamp) // Calculate on the fly
                  }} 
                  onPress={() => markAsRead(item.id)} 
                  onLongPress={() => setModalVisible(true)}
                  onDelete={handleDelete}
                />
              )}
              renderSectionFooter={({ section: renderedSection }) => {
                const original = sections.find(s => s.title === renderedSection.title);
                if (!original || original.data.length <= INITIAL_LIMIT || expandedSections.includes(renderedSection.title)) return null;

                return (
                  <TouchableOpacity 
                    onPress={() => toggleExpand(renderedSection.title)}
                    className="py-4 items-center border-b border-zinc-900"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-indigo-400 font-rubik-medium text-xs">See {original.data.length - INITIAL_LIMIT} more</Text>
                      <Ionicons name="chevron-down" size={14} color="#818CF8" style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                );
              }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
            />
          </Reanimated.View>
        )}

        <Modal animationType="fade" transparent visible={modalVisible}>
          <Pressable className="flex-1 bg-black/80 justify-center items-center px-8" onPress={() => setModalVisible(false)}>
            <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 items-center">
              <Ionicons name={isMuted ? "notifications-outline" : "notifications-off-outline"} size={40} color="#818CF8" />
              <Text className="text-white text-2xl font-rubik-bold mt-4 text-center">
                {isMuted ? "Unmute Notifications?" : "Mute Notifications?"}
              </Text>
              <View className="flex-row gap-4 mt-10 w-full">
                <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 h-16 rounded-full bg-zinc-800 items-center justify-center border border-zinc-700">
                  <Text className="text-white font-rubik-medium text-lg">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleMute} className="flex-1 h-16 rounded-full bg-indigo-600 items-center justify-center">
                  <Text className="text-white font-rubik-bold text-lg">{isMuted ? "Unmute" : "Mute All"}</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
