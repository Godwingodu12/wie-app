import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { ChatHeader } from '@/components/Message/ChatHeader'; 
import { ChatInput } from '@/components/Message/ChatInput';
import { MessageList } from '@/components/Message/MessageList';
import { Message } from '@/components/Message/MessageBubble';
import { chatService } from '@/services/chatService';

export default function ChatDetailsScreen() {
  const params = useLocalSearchParams();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id || '';
  const name = Array.isArray(params.name) ? params.name[0] : params.name || 'User';
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar || '';
  const Wrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<any>(null);

  const fetchMessages = async () => {
    if (!chatId) return;
    try {
      const data = await chatService.getChatMessages(chatId);
      if (data && data.messages) {
        const mappedMessages = data.messages.map((msg: any) => ({
          id: msg._id,
          text: msg.content,
          isSent: msg.senderType === 'user' || msg.isMine || msg.sender === (params.myUserId || ''), 
          timestamp: new Date(msg.createdAt),
          senderName: msg.sender?.username || name,
          avatar: msg.sender?.profile_picture || avatar,
          status: msg.status,
          isAudio: msg.isAudio,
          replyTo: msg.replyTo ? {
            id: msg.replyTo,
            text: msg.replyContent,
            isSent: false, // Defaulting as we might not know, but it helps preview
            senderName: 'Original Message'
          } : undefined
        }));
        setMessages(mappedMessages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    if (chatId) chatService.markAsRead(chatId).catch(() => {});
  }, [chatId]);

  const handleSendMessage = async (content: string, replyMessage: Message | null, isAudio: boolean = false) => {
    if (!chatId) return;
    
    // Optimistic update
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: content, 
      isSent: true,
      status: 'sent',
      timestamp: new Date(),
      isAudio,
      replyTo: replyMessage ? {
        id: replyMessage.id,
        text: replyMessage.text,
        isSent: replyMessage.isSent,
        senderName: replyMessage.isSent ? 'You' : name,
        isAudio: replyMessage.isAudio
      } : undefined
    };
    setMessages((prev) => [...prev, newMessage]);
    setReplyingTo(null);

    try {
      await chatService.sendMessage(chatId, content, replyMessage?.id);
      fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const scrollToMessage = (messageId: string) => {
    const index = messages.findIndex(m => m.id === messageId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
      
      {/* Top safety for header */}
      <SafeAreaView edges={['top']} className="bg-black" />
      <ChatHeader name={name} avatar={avatar} status="Online" onClearChat={() => setMessages([])} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <MessageList 
          messages={messages} 
          onReply={(msg) => setReplyingTo(msg)} 
          otherUserAvatar={avatar}
          flatListRef={flatListRef}
          onReplyMessagePress={scrollToMessage}
        />
        <ChatInput 
          onSendMessage={handleSendMessage} 
          replyingTo={replyingTo} 
          onCancelReply={() => setReplyingTo(null)} 
        />
      </KeyboardAvoidingView>
    </View>
  );
}
