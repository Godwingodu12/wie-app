import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageListItemProps {
  name: string;
  avatar: any;
  lastMessage: string;
  time: string;
  isPinned?: boolean;
  isOnline?: boolean;
  unreadCount?: number;
  status?: 'sent' | 'delivered' | 'read';
  hasImageAttachment?: boolean;
  isLastMessageFromUs?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const MessageListItem = ({
  name,
  avatar,
  lastMessage,
  time,
  isPinned,
  isOnline,
  unreadCount,
  status,
  hasImageAttachment,
  isLastMessageFromUs = false,
  isSelected = false,
  onPress,
  onLongPress
}: MessageListItemProps) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      onLongPress={onLongPress}
      className={`flex-row items-center px-4 py-3 ${isSelected ? 'bg-primary/10' : ''}`}
    >
      {/* Avatar Section with Selection Indicator */}
      <View className="relative">
        <Image 
          source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
          className="w-[56px] h-[56px] rounded-full bg-zinc-800"
        />
        {isOnline && !isSelected && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#22C55E] border-2 border-black rounded-full" />
        )}
        {isSelected && (
          <View className="absolute inset-0 rounded-full bg-primary/30 items-center justify-center border-2 border-primary">
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="flex-1 ml-3 h-[56px] justify-center">
        <View className="flex-row items-center justify-between mb-0.5">
          <View className="flex-row items-center flex-1 mr-2">
            <Text className="text-white font-rubik-bold text-[17px]" numberOfLines={1}>
              {name}
            </Text>
            {isPinned && (
              <Ionicons name="pin" size={12} color="#71717a" style={{ transform: [{ rotate: '45deg' }], marginLeft: 4 }} />
            )}
          </View>
          <Text className="text-zinc-500 text-[12px] font-rubik-regular">{time}</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            {/* Status Ticks - Only show if last message is from us */}
            {isLastMessageFromUs && status && (
              <Ionicons 
                name={status === 'sent' ? "checkmark" : "checkmark-done"} 
                size={16} 
                color={status === 'read' ? "#8b5cf6" : "#52525B"} 
                style={{ marginRight: 4 }}
              />
            )}
            
            {/* Attachment Icon before text */}
            {hasImageAttachment && (
              <Ionicons name="camera" size={14} color="#71717a" style={{ marginRight: 4 }} />
            )}

            <Text className="text-zinc-400 font-rubik-regular text-[14px] flex-1" numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>

          {unreadCount ? (
            <View className="bg-primary rounded-full px-2 py-0.5 min-w-[20px] h-[20px] items-center justify-center">
              <Text className="text-white font-rubik-bold text-[10px]">{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};
