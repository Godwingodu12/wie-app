import React, { useState, useEffect, useRef } from 'react';
import { View, StatusBar, Platform, KeyboardAvoidingView, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { ChatHeader } from '@/components/Message/ChatHeader'; 
import { ChatInput } from '@/components/Message/ChatInput';
import { MessageList } from '@/components/Message/MessageList';
import { Message } from '@/components/Message/MessageBubble';
import { chatService } from '@/services/chatService';
import { useUser } from '@/context/UserContext';

export default function ChatDetailsScreen() {
  const { user: currentUser } = useUser();
  const params = useLocalSearchParams();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id || '';
  const name = Array.isArray(params.name) ? params.name[0] : params.name || 'User';
  const avatar = Array.isArray(params.avatar) ? params.avatar[0] : params.avatar || 'https://via.placeholder.com/150';
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<any>(null);

  const fetchMessages = async () => {
    if (!chatId) return;
    try {
      const data = await chatService.getChatMessages(chatId);
      if (data && data.messages) {
        const myId = currentUser?._id || currentUser?.id;
        const mappedMessages = data.messages.map((msg: any) => {
          const senderId = msg.sender?._id || msg.sender;
          const isMine = senderId === myId;
          
          return {
            id: msg._id,
            text: msg.content,
            isSent: isMine,
            timestamp: new Date(msg.timestamp || msg.createdAt),
            senderName: isMine ? 'You' : (msg.sender?.username || msg.sender?.name || name),
            avatar: msg.sender?.profile_picture || avatar,
            status: msg.status || 'read',
            messageType: msg.messageType || 'text',
            isAudio: msg.messageType === 'voice' || msg.isAudio,
            chat_images: msg.chat_images,
            chat_videos: msg.chat_videos,
            chat_files: msg.chat_files,
            locationData: msg.locationData,
            contactData: msg.contactData,
            profileData: msg.profileData,
            pollData: msg.pollData,
            replyTo: msg.replyTo ? {
              id: msg.replyTo.messageId || msg.replyTo,
              text: msg.replyTo.content || 'Original Message',
              isSent: (msg.replyTo.sender?._id || msg.replyTo.sender) === myId, 
              senderName: msg.replyTo.senderName || 'Sender',
              isAudio: msg.replyTo.messageType === 'voice'
            } : undefined
          };
        });
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

  const handleSendMessage = async (
    content: string, 
    replyMessage: Message | null, 
    isAudio: boolean = false, 
    messageType: string = 'text',
    extraData?: any
  ) => {
    if (!chatId) return;
    
    // Optimistic update
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: content, 
      isSent: true,
      status: 'sent',
      timestamp: new Date(),
      messageType,
      isAudio,
      replyTo: replyMessage ? {
        id: replyMessage.id,
        text: replyMessage.text,
        isSent: replyMessage.isSent,
        senderName: replyMessage.isSent ? 'You' : name,
        isAudio: replyMessage.isAudio
      } : undefined
    };

    if (messageType === 'image' && extraData?.assets) {
      newMessage.chat_images = [{ url: extraData.assets[0].uri }];
    } else if (messageType === 'video' && extraData?.assets) {
      newMessage.chat_videos = [{ url: extraData.assets[0].uri }];
    } else if (messageType === 'location') {
      newMessage.locationData = extraData;
    }

    setMessages((prev) => [...prev, newMessage]);
    setReplyingTo(null);

    try {
      if (messageType === 'voice') {
        await chatService.sendAudio(chatId, content, replyMessage?.id);
      } else if (messageType === 'image') {
        await chatService.sendImage(chatId, extraData.assets, replyMessage?.id);
      } else if (messageType === 'video') {
        await chatService.sendVideo(chatId, extraData.assets[0].uri, '', replyMessage?.id);
      } else if (messageType === 'location') {
        await chatService.sendLocation(chatId, extraData.latitude, extraData.longitude, replyMessage?.id);
      } else {
        await chatService.sendMessage(chatId, content, replyMessage?.id);
      }
      fetchMessages();
    } catch (error) {
      console.error(`Failed to send ${messageType} message:`, error);
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
      <View style={{ height: insets.top }} className="bg-black" />
      <ChatHeader name={name} avatar={avatar} status="Online" onClearChat={() => setMessages([])} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#7C4DFF" size="large" />
          </View>
        ) : (
          <MessageList 
            messages={messages} 
            onReply={(msg) => {
              setReplyingTo(msg);
              // Small delay to ensure input is ready for focus if needed
            }} 
            otherUserAvatar={avatar}
            flatListRef={flatListRef}
            onReplyMessagePress={scrollToMessage}
          />
        )}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          replyingTo={replyingTo} 
          onCancelReply={() => setReplyingTo(null)} 
          chatId={chatId}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
