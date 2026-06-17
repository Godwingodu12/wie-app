import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

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
  unreadCount = 0,
  status,
  hasImageAttachment,
  isLastMessageFromUs = false,
  isSelected = false,
  onPress,
  onLongPress
}: MessageListItemProps) => {
  const hasUnread = unreadCount > 0;
  const avatarSource = typeof avatar === 'string' ? { uri: avatar } : avatar;

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      onLongPress={onLongPress}
      className={`flex-row items-center px-4 py-3.5 ${isSelected ? 'bg-[#8b5cf6]/10' : ''}`}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatarWrapper,
          hasUnread && styles.unreadAvatarWrapper
        ]}>
          <Image 
            source={avatarSource} 
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        </View>
        {isOnline && !isSelected && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-[#22C55E] border-2 border-[#0F1014] rounded-full" />
        )}
        {isSelected && (
          <View className="absolute inset-0 rounded-full bg-[#8B5CF6]/30 items-center justify-center border-2 border-[#8B5CF6]">
            <View className="w-6 h-6 rounded-full bg-[#8B5CF6] items-center justify-center">
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row items-center mb-1">
          <Text className="text-white font-rubik-bold text-[17px] mr-1.5" numberOfLines={1}>
            {name}
          </Text>
          {isPinned && (
            <Ionicons name="pin" size={14} color="#A1A1AA" />
          )}
        </View>

        <View className="flex-row items-center">
          {/* Status Ticks */}
          {isLastMessageFromUs && status && (
            <Ionicons 
              name={status === 'sent' ? "checkmark" : "checkmark-done"} 
              size={16} 
              color={status === 'read' ? "#3B82F6" : "#A1A1AA"} 
              style={{ marginRight: 4 }}
            />
          )}

          {/* Attachment Icon */}
          {hasImageAttachment && (
            <Ionicons name="camera" size={14} color="#A1A1AA" style={{ marginRight: 4 }} />
          )}

          <Text className={`text-zinc-400 font-rubik-regular text-[14.5px] flex-1`} numberOfLines={1}>
            {lastMessage}
            {time ? <Text className="text-zinc-500"> • {time}</Text> : null}
          </Text>
        </View>
      </View>

      {/* Right Section: Unread & Camera */}
      <View className="flex-row items-center ml-2">
        {hasUnread ? (
          <View className="bg-[#8B5CF6] rounded-full px-2 py-0.5 min-w-[22px] h-[22px] items-center justify-center mr-3">
            <Text className="text-white font-rubik-bold text-[11px]">{unreadCount}</Text>
          </View>
        ) : null}

        <TouchableOpacity className="p-1">
          <Ionicons name="camera-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadAvatarWrapper: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#27272a',
  }
});

