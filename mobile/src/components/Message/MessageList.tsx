import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FlatList, View, Text, Platform } from 'react-native';
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

// Separate component for the date separator to avoid re-renders
const DateSeparator = React.memo(({ date }: { date: Date }) => {
  const formattedDate = useMemo(() => date.toLocaleDateString([], { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), [date]);
  
  return (
    <View className="items-center my-6">
      <View className="bg-[#1C1C1E] px-4 py-1.5 rounded-full border border-white/5">
        <Text className="text-zinc-500 text-[11px] font-rubik-medium uppercase tracking-wider">{formattedDate}</Text>
      </View>
    </View>
  );
});

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
  const isNearBottom = useRef(true);

  useEffect(() => { 
    setLocalMessages(initialMessages); 
  }, [initialMessages]);

  const scrollToBottom = useCallback((animated = true) => {
    if (localMessages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated });
    }
  }, [localMessages.length]);

  useEffect(() => {
    // Only auto-scroll on initial load or if we were already at the bottom
    if (isNearBottom.current) {
      const timer = setTimeout(() => scrollToBottom(true), 100);
      return () => clearTimeout(timer);
    }
  }, [localMessages.length]);

  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // threshold
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    isNearBottom.current = isAtBottom;
  }, []);

  const handleDeleteForMe = useCallback((id: string) => { 
    setLocalMessages((prev) => prev.filter((msg) => msg.id !== id)); 
  }, []);

  const handleDeleteForEveryone = useCallback((id: string) => { 
    setLocalMessages((prev) => prev.filter((msg) => msg.id !== id)); 
  }, []);

  const handleReplyMessagePress = useCallback((messageId: string) => {
    const index = localMessages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      setHighlightedId(messageId);
      
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ 
          index, 
          animated: true, 
          viewPosition: 0.5,
          viewOffset: 0
        });
      }, 50);

      setTimeout(() => setHighlightedId(null), 2500);
    } else if (onReplyMessagePress) {
      onReplyMessagePress(messageId);
    }
  }, [localMessages, onReplyMessagePress]);

  const renderItem = useCallback(({ item, index }: { item: Message, index: number }) => {
    const prevMessage = localMessages[index - 1];
    const showDateSeparator = !prevMessage || 
      new Date(prevMessage.timestamp).toDateString() !== new Date(item.timestamp).toDateString();
      
    const isLastInGroup = index === localMessages.length - 1 || (localMessages[index + 1] && localMessages[index + 1].isSent !== item.isSent);
    const isFirstInGroup = index === 0 || (localMessages[index - 1] && localMessages[index - 1].isSent !== item.isSent);
    
    return (
      <View>
        {showDateSeparator && <DateSeparator date={item.timestamp} />}
        <View style={{ marginTop: isFirstInGroup ? 8 : 1 }}>
          <MessageBubble
            message={{ ...item, avatar: item.avatar || (item.isSent ? currentUserAvatar : otherUserAvatar) }}
            onReply={onReply}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForEveryone={handleDeleteForEveryone}
            onReplyMessagePress={handleReplyMessagePress}
            isHighlighted={highlightedId === item.id}
            isLastInGroup={isLastInGroup}
          />
        </View>
      </View>
    );
  }, [localMessages, currentUserAvatar, otherUserAvatar, onReply, handleDeleteForMe, handleDeleteForEveryone, handleReplyMessagePress, highlightedId]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={localMessages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10, paddingBottom: 40 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        
        // Performance props
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={50}
        
        onContentSizeChange={() => {
          if (!highlightedId && isNearBottom.current) {
            scrollToBottom(true);
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