import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

export interface NotificationData {
  id: string;
  type: 'follow' | 'comment' | 'like' | 'request' | 'event';
  username: string;
  actionText: string;
  subText?: string;
  time: string;
  relativeTime: string;
  image: string;
  postImage?: string;
  isUnread: boolean;
}

interface NotificationItemProps {
  item: NotificationData;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: (id: string) => void;
}

export const NotificationItem = ({ item, onPress, onLongPress, onDelete }: NotificationItemProps) => {
  const handlePress = () => {
    if (item.isUnread) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Reanimated.View entering={FadeInRight} exiting={FadeOutLeft} layout={Layout.springify()}>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={handlePress}
        onLongPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onLongPress();
        }}
        className={`px-6 py-4 flex-row items-start ${item.isUnread ? 'bg-indigo-500/[0.05]' : 'bg-black'}`}
      >
        <View className="relative">
          <Image 
            source={{ uri: item.image }} 
            className={`w-12 h-12 ${item.type === 'event' ? 'rounded-xl' : 'rounded-full'} bg-zinc-800`} 
          />
          {item.type === 'event' && (
            <MotiView
              from={{ opacity: 0.4, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              transition={{ loop: true, type: 'timing', duration: 1500 }}
              className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"
            />
          )}
          {item.type === 'like' && (
            <View className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-black">
              <Ionicons name="heart" size={8} color="white" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-zinc-200 text-[14px] leading-5">
                <Text className="font-rubik-bold text-white">@{item.username} </Text>
                <Text className="text-zinc-300 font-rubik-regular">{item.actionText}</Text>
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-zinc-500 text-[11px] font-rubik-regular">{item.time}</Text>
                <Text className="text-zinc-600 text-[10px] mx-2">•</Text>
                <Text className="text-zinc-500 text-[10px]">{item.relativeTime}</Text>
              </View>
            </View>

            {(item.type === 'like' || item.type === 'comment') && item.postImage && (
              <View className="ml-2">
                <Image 
                  source={{ uri: item.postImage }} 
                  className="w-11 h-11 rounded-lg bg-zinc-800 border border-zinc-800"
                />
              </View>
            )}
            
            {item.isUnread && !item.postImage && (
              <View className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
            )}
          </View>

          {item.type === 'comment' && (
            <View className="bg-zinc-900/50 p-3 rounded-2xl mt-3 border border-zinc-800/50">
              <Text className="text-zinc-400 text-xs" numberOfLines={2}>
                &quot;{item.subText}&quot;
              </Text>
            </View>
          )}

          {item.type === 'request' && (
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity onPress={() => Haptics.selectionAsync()} className="flex-1 h-10 bg-zinc-800 rounded-full items-center justify-center border border-zinc-700">
                <Text className="text-zinc-300 font-rubik-bold text-xs">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)} className="flex-1 h-10 overflow-hidden rounded-full">
                <LinearGradient colors={['#A855F7', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-1 items-center justify-center">
                  <Text className="text-white font-rubik-bold text-xs">Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Reanimated.View>
  );
};
