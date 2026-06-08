import React, { useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Message, MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUserAvatar?: string;
  otherUserAvatar?: string;
  onReply?: (message: Message) => void;
  onReplyMessagePress?: (messageId: string) => void;
  flatListRef?: React.RefObject<FlatList>;
}

export const MessageList = ({ 
  messages: initialMessages, 
  currentUserAvatar, 
  otherUserAvatar, 
  onReply,
  onReplyMessagePress,
  flatListRef: externalFlatListRef
}: MessageListProps) => {
  const internalFlatListRef = useRef<FlatList>(null);
  const flatListRef = externalFlatListRef || internalFlatListRef;
  const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => { setLocalMessages(initialMessages); }, [initialMessages]);

  useEffect(() => {
    if (localMessages.length > 0) {
      setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    }
  }, [localMessages.length]);

  const handleDeleteForMe = (id: string) => { setLocalMessages((prev) => prev.filter((msg) => msg.id !== id)); };
  const handleDeleteForEveryone = (id: string) => { setLocalMessages((prev) => prev.filter((msg) => msg.id !== id)); };

  const handleReplyMessagePress = (messageId: string) => {
    if (onReplyMessagePress) {
      onReplyMessagePress(messageId);
    } else {
      const index = localMessages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      }
    }
    setHighlightedId(messageId);
    setTimeout(() => setHighlightedId(null), 2000);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={localMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isLastInGroup = index === localMessages.length - 1 || (localMessages[index + 1] && localMessages[index + 1].isSent !== item.isSent);
          return (
            <MessageBubble
              message={{ ...item, avatar: item.isSent ? currentUserAvatar : otherUserAvatar }}
              onReply={onReply}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
              onReplyMessagePress={handleReplyMessagePress}
              isHighlighted={highlightedId === item.id}
              isLastInGroup={isLastInGroup}
            />
          );
        }}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 20 }}
        onContentSizeChange={() => {
          if (!highlightedId) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
          }, 100);
        }}
      />
    </GestureHandlerRootView>
  );
};
