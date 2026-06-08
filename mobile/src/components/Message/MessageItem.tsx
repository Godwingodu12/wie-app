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
      className={`flex-row items-center px-4 py-3 ${isSelected ? 'bg-blue-500/10' : ''}`}
    >
      {/* Avatar Section with Selection Indicator */}
      <View className="relative">
        <Image 
          source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
          className="w-14 h-14 rounded-full bg-zinc-800"
        />
        {isOnline && !isSelected && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-black rounded-full" />
        )}
        {isSelected && (
          <View className="absolute inset-0 rounded-full bg-blue-500/30 items-center justify-center border-2 border-blue-500">
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row items-center flex-1">
          <Text className="text-white font-rubik-bold text-[16px] mr-1" numberOfLines={1}>
            {name}
          </Text>
          {isPinned && (
            <Ionicons name="pin" size={12} color="#71717a" style={{ transform: [{ rotate: '45deg' }] }} />
          )}
        </View>

        <View className="flex-row items-center mt-0.5">
          {/* Status Ticks - Only show if last message is from us */}
          {isLastMessageFromUs && status && (
            <Ionicons 
              name={status === 'sent' ? "checkmark" : "checkmark-done"} 
              size={16} 
              color={status === 'read' ? "#3B82F6" : "#71717a"} 
              className="mr-1"
            />
          )}
          
          {/* Attachment Icon before text */}
          {hasImageAttachment && (
            <Ionicons name="camera" size={14} color="#71717a" style={{ marginRight: 4 }} />
          )}

          <Text className="text-zinc-500 font-rubik-regular text-sm flex-1" numberOfLines={1}>
            {lastMessage} • {time}
          </Text>
        </View>
      </View>

      {/* Right Side Actions - Camera Removed */}
      {!isSelected && (
        <View className="flex-row items-center gap-3">
          {unreadCount ? (
            <View className="bg-[#ffffff] rounded-full px-2 py-0.5 min-w-[22px] items-center justify-center">
              <Text className="text-black font-rubik-bold text-[11px]">{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};
