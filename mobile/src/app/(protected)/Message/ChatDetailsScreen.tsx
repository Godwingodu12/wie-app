import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StatusBar, Platform, KeyboardAvoidingView, ActivityIndicator, Keyboard, Image, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ChatHeader } from '@/components/Message/ChatHeader'; 
import { ChatInput } from '@/components/Message/ChatInput';
import { MessageList } from '@/components/Message/MessageList';
import { Message } from '@/components/Message/MessageBubble';
import { chatService } from '@/services/chatService';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';

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
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
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
          
          let messageType = msg.messageType || 'text';
          let content = msg.content;
          let postShareData = msg.postShareData;
          let storyShareData = msg.storyShareData || (msg as any).storyShareData;

          // Unified parsing logic for shared content (Fallback to content JSON if fields are missing)
          const tryParseJson = (str: any) => {
            if (typeof str === 'object' && str !== null) return str;
            try {
              if (str && typeof str === 'string' && (str.startsWith('{') || str.includes('"type"'))) {
                return JSON.parse(str);
              }
            } catch (e) {}
            return null;
          };

          const parsed = tryParseJson(content);
          
          if (messageType === 'post_share' || (parsed && parsed.type === 'post_share')) {
              messageType = 'post_share';
              const data = parsed || postShareData || {};
              postShareData = {
                postId: data.postId,
                postOwnerId: data.postOwnerId || data.ownerId,
                postOwnerName: data.postOwnerName || data.postOwnerUsername || data.sharerName || 'User',
                postOwnerAvatar: data.postOwnerAvatar || data.postOwnerProfilePicture || data.sharerAvatar,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType || 'image',
                ratio: data.ratio,
                caption: data.caption,
                sharerName: data.sharerName,
                postUrl: data.postUrl
              };
              content = data.text || 'Shared a post';
          } else if (['flux_share', 'flux_mention', 'flux_remention'].includes(messageType) || (parsed && (parsed.type?.startsWith('flux_') || parsed.fluxId))) {
               messageType = parsed?.type || messageType;
               const data = parsed || storyShareData || {};
               // Map story data to a similar structure for rendering
               storyShareData = {
                  fluxId: data.fluxId,
                  mediaUrl: data.fluxMediaUrl || data.mediaUrl,
                  mediaType: data.fluxMediaType || data.mediaType || 'image',
                  ownerId: data.fluxOwnerId || data.ownerId,
                  ownerName: data.fluxOwnerName || data.mentionerName || data.reMentionerName || data.sharerName || data.ownerName || 'User',
                  ownerAvatar: data.fluxOwnerAvatar || data.mentionerAvatar || data.reMentionerAvatar || data.sharerAvatar || data.ownerAvatar,
                  text: data.text
               };
               content = data.text || content;
          }

          let replyToData = undefined;
          if (msg.replyTo) {
            const replyId = typeof msg.replyTo === 'string' ? msg.replyTo : (msg.replyTo.messageId || msg.replyTo._id || msg.replyTo.id);
            if (replyId) {
              replyToData = {
                id: replyId,
                text: typeof msg.replyTo === 'object' ? (msg.replyTo.content || msg.replyTo.text || msg.replyTo.message || 'Original Message') : 'Original Message',
                isSent: typeof msg.replyTo === 'object' ? ((msg.replyTo.sender?._id || msg.replyTo.sender) === myId) : false, 
                senderName: typeof msg.replyTo === 'object' ? (msg.replyTo.senderName || msg.replyTo.sender?.username || 'Sender') : 'Sender',
                isAudio: typeof msg.replyTo === 'object' ? (msg.replyTo.messageType === 'voice' || msg.replyTo.isAudio) : false
              };
            }
          }

          
          return {
            id: msg._id,
            text: (msg.messageType === 'audio' || msg.messageType === 'voice') 
              ? (msg.chat_audio?.[0]?.url || msg.voiceData?.url || content)
              : content,
            isSent: isMine,
            timestamp: new Date(msg.timestamp || msg.createdAt),
            senderName: isMine ? 'You' : (msg.sender?.username || msg.sender?.name || name),
            avatar: isMine ? (currentUser?.profile_picture || 'https://via.placeholder.com/150') : (msg.sender?.profile_picture || avatar),
            status: msg.status || 'read',
            messageType: (msg.messageType === 'audio') ? 'voice' : messageType,
            isAudio: msg.messageType === 'voice' || msg.messageType === 'audio' || msg.isAudio,
            chat_images: msg.chat_images,
            chat_videos: msg.chat_videos,
            chat_audio: msg.chat_audio,
            chat_files: msg.chat_files,
            locationData: msg.locationData,
            contactData: msg.contactData,
            profileData: msg.profileData,
            pollData: msg.pollData,
            voiceData: msg.voiceData,
            postShareData: postShareData,
            storyShareData: storyShareData,
            replyTo: replyToData
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

  useFocusEffect(
    useCallback(() => {
      if (chatId) {
        fetchMessages();
      }
    }, [chatId])
  );

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
      avatar: currentUser?.profile_picture || 'https://via.placeholder.com/150',
      replyTo: replyMessage ? {
        id: replyMessage.id,
        text: replyMessage.text,
        isSent: replyMessage.isSent,
        senderName: replyMessage.isSent ? 'You' : name,
        isAudio: replyMessage.isAudio
      } : undefined
    };

    if (messageType === 'image' && extraData) {
      const assets = Array.isArray(extraData) ? extraData : extraData.assets;
      if (assets && assets.length > 0) {
        newMessage.chat_images = [{ url: assets[0].uri }];
      }
    } else if (messageType === 'video' && extraData) {
      const assets = Array.isArray(extraData) ? extraData : extraData.assets;
      if (assets && assets.length > 0) {
        newMessage.chat_videos = [{ url: assets[0].uri }];
      }
    } else if (messageType === 'location') {
      newMessage.locationData = extraData;
    }

    setMessages((prev) => [...prev, newMessage]);
    setReplyingTo(null);

    try {
      let response;
      if (messageType === 'voice' || isAudio) {
        console.log("DEBUG: Attempting to send voice note from:", content);
        // Small delay to ensure the file system has finished flushing the recording
        if (Platform.OS === 'android') await new Promise(resolve => setTimeout(resolve, 300));
        response = await chatService.sendAudio(chatId, content, replyMessage?.id);
      } else if (messageType === 'image') {
        const assets = Array.isArray(extraData) ? extraData : extraData.assets;
        response = await chatService.sendImage(chatId, assets, replyMessage?.id);
      } else if (messageType === 'video') {
        const assets = Array.isArray(extraData) ? extraData : extraData.assets;
        response = await chatService.sendVideo(chatId, assets[0].uri, '', replyMessage?.id);
      } else if (messageType === 'location' || messageType === 'live_location') {
        response = await chatService.sendLocation(chatId, extraData.latitude, extraData.longitude, replyMessage?.id, extraData);
      } else {
        response = await chatService.sendMessage(chatId, content, replyMessage?.id);
      }

      if (response && response.success) {
        const serverMsg = response.message;
        setMessages((prev) => 
          prev.map((msg) => msg.id === tempId ? { 
            ...msg, 
            id: serverMsg._id || serverMsg.id, 
            status: 'sent',
            messageType: serverMsg.messageType || msg.messageType,
            isAudio: (serverMsg.messageType === 'voice' || serverMsg.messageType === 'audio') ? true : msg.isAudio,
            text: (serverMsg.messageType === 'voice' || serverMsg.messageType === 'audio')
              ? (serverMsg.voiceData?.url || serverMsg.chat_audio?.[0]?.url || '🎤 Voice message')
              : (serverMsg.content || msg.text),
            voiceData: serverMsg.voiceData || msg.voiceData,
            chat_audio: serverMsg.chat_audio || msg.chat_audio,
            chat_images: serverMsg.chat_images || msg.chat_images,
            chat_videos: serverMsg.chat_videos || msg.chat_videos,
            chat_files: serverMsg.chat_files || msg.chat_files,
            locationData: serverMsg.locationData || msg.locationData
          } : msg)
        );
      }
      // fetchMessages(); // Avoid redundant fetch if socket is working, but can be kept if needed
    } catch (error: any) {
      console.error(`Failed to send ${messageType} message:`, error);
      if (error && typeof error === 'object') {
        console.log("DEBUG: send error details:", JSON.stringify(error));
      }
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
      <ChatHeader name={name} avatar={avatar} status="Active now" onClearChat={() => setMessages([])} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#8b5cf6" size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="items-center w-full">
              <View className="mb-5">
                <Image 
                  source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
                  className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-white/10" 
                />
              </View>
              
              <Text className="text-white text-2xl font-rubik-bold mb-1.5">{name}</Text>
              
              <Text className="text-zinc-400 text-[14px] font-rubik-medium mb-1">
                1.2K followers | 850 following
              </Text>
              
              <Text className="text-zinc-500 text-center text-[14px] font-rubik-regular mb-6 max-w-[200px]">
                You might know each other. Start a conversation
              </Text>
              
              {/* Mutual Connections */}
              <View className="flex-row items-center mb-8">
                <View className="flex-row mr-3">
                  {[1, 2, 3].map((_, i) => (
                    <View 
                      key={i} 
                      className={`w-8 h-8 rounded-full border-2 border-black bg-zinc-800 ${i > 0 ? '-ml-3' : ''} overflow-hidden`}
                    >
                      <Image 
                        source={{ uri: `https://i.pravatar.cc/100?u=mutual-${i}-${chatId}` }} 
                        className="w-full h-full" 
                      />
                    </View>
                  ))}
                </View>
                <Text className="text-zinc-500 text-[12px] font-rubik-medium">
                  +2 more you following
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient
                  colors={['#C084FC', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 25 }}
                  className="px-10 py-3"
                >
                  <Text className="text-white font-rubik-bold text-[15px]">View profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <MessageList 
            messages={messages} 
            onReply={(msg) => {
              setReplyingTo(msg);
            }} 
            currentUserAvatar={currentUser?.profile_picture || 'https://via.placeholder.com/150'}
            otherUserAvatar={avatar}
            flatListRef={flatListRef}
            onReplyMessagePress={scrollToMessage}
            onMediaPress={(media) => setSelectedMedia(media)}
          />
        )}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          replyingTo={replyingTo} 
          onCancelReply={() => setReplyingTo(null)} 
          chatId={chatId}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={!!selectedMedia}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity 
            className="absolute top-12 right-6 z-10 p-2 bg-black/50 rounded-full"
            onPress={() => setSelectedMedia(null)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          
          {selectedMedia?.type === 'image' ? (
            <Image 
              source={{ uri: selectedMedia.url }} 
              className="w-full h-full" 
              resizeMode="contain" 
            />
          ) : (
            <View className="w-full h-full bg-black items-center justify-center">
               <Text className="text-white">Video Player goes here</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
