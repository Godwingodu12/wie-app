import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolate,
  ZoomIn,
  ZoomOut,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

export interface Message {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  avatar?: string;
  senderName?: string; 
  messageType?: string;
  isAudio?: boolean;
  chat_images?: Array<{ url: string; viewMode?: string }>;
  chat_videos?: Array<{ url: string; thumbnail?: string }>;
  chat_files?: Array<{ url: string; name: string; size: number; extension: string }>;
  locationData?: { latitude: number; longitude: number; address?: string; name?: string; isLive?: boolean };
  contactData?: { name: string; phone: string[] };
  profileData?: { userId: string; name: string; username: string; avatar?: string };
  replyTo?: {
    id: string;
    text: string;
    isSent: boolean;
    senderName?: string;
    isAudio?: boolean;
  };
}

interface MessageBubbleProps {
  message: Message;
  onReply?: (message: Message) => void;
  onDeleteForMe?: (id: string) => void;
  onDeleteForEveryone?: (id: string) => void;
  onReplyMessagePress?: (messageId: string) => void;
  isHighlighted?: boolean;
  isLastInGroup?: boolean; 
}

export const MessageBubble = ({ 
  message, 
  onReply, 
  onDeleteForMe, 
  onDeleteForEveryone, 
  onReplyMessagePress,
  isHighlighted = false,
  isLastInGroup = true 
}: MessageBubbleProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const isSent = message.isSent;
  const translateX = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const highlightAnim = useSharedValue(0);
  const SCRUBBER_WIDTH = 130;

  useEffect(() => {
    if (isHighlighted) {
      highlightAnim.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1700 })
      );
    }
  }, [isHighlighted]);

  const rHighlightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlightAnim.value,
      [0, 1],
      ['transparent', 'rgba(124, 77, 255, 0.15)']
    ),
  }));

  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
      }
    }
  };

  const handlePlayVoice = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            if (status.positionMillis >= (status.durationMillis || 0) - 100) {
               await sound.setPositionAsync(0);
            }
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
        return;
      }

      let uri = message.text;
      if (Platform.OS === 'android' && !uri.startsWith('http') && !uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback failed:", err);
      try {
        let uri = message.text;
        const { sound: retrySound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, isLooping: false },
          onPlaybackStatusUpdate
        );
        setSound(retrySound);
        setIsPlaying(true);
      } catch (retryErr) {
        console.error("Retry playback failed:", retryErr);
      }
    }
  };

  const handleScrub = async (event: any) => {
    if (!sound || duration === 0) return;
    const { locationX } = event.nativeEvent;
    const progress = Math.max(0, Math.min(locationX / SCRUBBER_WIDTH, 1));
    const newPosition = progress * duration;
    await sound.setPositionAsync(newPosition);
    setPosition(newPosition);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progressPercent = duration > 0 ? position / duration : 0;
  const knobLeftPosition = progressPercent * SCRUBBER_WIDTH;

  const rPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleReplyTrigger = () => { if (onReply) onReply(message); };
  const closePopup = () => setShowPopup(false);
  const handleDeleteMe = () => { if (onDeleteForMe) onDeleteForMe(message.id); closePopup(); };
  const handleDeleteEveryone = () => { if (onDeleteForEveryone) onDeleteForEveryone(message.id); closePopup(); };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const x = isSent ? Math.min(0, event.translationX) : Math.max(0, event.translationX);
      translateX.value = x * 0.5;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 60) runOnJS(handleReplyTrigger)();
      translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
    });

  const rBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(Math.abs(translateX.value), [0, 50], [0, 1], Extrapolate.CLAMP);
    return { opacity, transform: [{ scale: opacity }] };
  });

  const BubbleContainer = ({ children, isSent }: { children: React.ReactNode, isSent: boolean }) => {
    if (isSent) {
      return (
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`px-4 py-3 shadow-sm rounded-[24px] ${isLastInGroup ? 'rounded-br-[4px]' : ''}`}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View className={`px-4 py-3 shadow-sm bg-[#1F1F23] rounded-[24px] border border-white/5 ${isLastInGroup ? 'rounded-bl-[4px]' : ''}`}>
        {children}
      </View>
    );
  };

  return (
    <Animated.View style={[rHighlightStyle, { width: '100%', paddingVertical: 1 }]} className="relative justify-center">
      <Modal transparent visible={showPopup} animationType="none" onRequestClose={closePopup}>
        <Pressable className="flex-1 bg-black/70 justify-center items-center px-10" onPress={closePopup}>
          <Animated.View entering={ZoomIn.duration(250)} exiting={ZoomOut.duration(200)} className="w-full bg-[#1c1c1e] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
            <View className="items-center pt-4 pb-2"><View className="w-12 h-1 bg-white/10 rounded-full" /></View>
            <TouchableOpacity onPress={handleDeleteEveryone} className="flex-row items-center justify-between px-6 py-5 active:bg-red-500/10">
              <Text className="text-red-500 text-[17px] font-semibold">Delete for Everyone</Text>
              <View className="bg-red-500/10 p-2 rounded-2xl"><Ionicons name="trash-outline" size={22} color="#ef4444" /></View>
            </TouchableOpacity>
            <View className="h-[0.5px] bg-white/5 mx-6" />
            <TouchableOpacity onPress={handleDeleteMe} className="flex-row items-center justify-between px-6 py-5 active:bg-white/5">
              <Text className="text-white/90 text-[17px] font-medium">Delete for Me</Text>
              <View className="bg-white/10 p-2 rounded-2xl"><Ionicons name="person-outline" size={22} color="white" /></View>
            </TouchableOpacity>
            <View className="h-[0.5px] bg-white/5 mx-6" />
            <TouchableOpacity onPress={closePopup} className="flex-row items-center justify-between px-6 py-5 mb-2 active:bg-white/5">
              <Text className="text-zinc-500 text-[17px] font-medium">Close</Text>
              <View className="bg-zinc-800 p-2 rounded-2xl"><Ionicons name="close" size={22} color="#a1a1aa" /></View>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <Animated.View style={[rIconStyle, { position: 'absolute', [isSent ? 'right' : 'left']: 25 }]}>
        <Ionicons name="arrow-undo" size={22} color="#71717a" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={rBubbleStyle}>
          <View className={`flex-row w-full px-4 ${isSent ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
            <View className={`flex-row items-end max-w-[85%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {!isSent && (
                <View className="w-8 h-8 mr-2">
                  {isLastInGroup && message.avatar && (
                    <Image 
                      source={typeof message.avatar === 'string' ? { uri: message.avatar } : message.avatar} 
                      className="w-8 h-8 rounded-full bg-zinc-800" 
                    />
                  )}
                </View>
              )}

              <View className={`items-${isSent ? 'end' : 'start'}`}>
                  {!isSent && isLastInGroup && message.senderName && message.messageType !== 'system' && (
                    <Text className="text-zinc-500 text-[12px] font-rubik-medium mb-1 ml-1">{message.senderName}</Text>
                  )}

                  <TouchableOpacity onLongPress={() => setShowPopup(true)} delayLongPress={400} activeOpacity={0.9}>
                    <BubbleContainer isSent={isSent}>
                    
                    {message.replyTo && (
                      <TouchableOpacity 
                        onPress={() => onReplyMessagePress?.(message.replyTo!.id)}
                        activeOpacity={0.7}
                        className={`mb-2 py-2 px-3 border-l-4 rounded-xl ${isSent ? 'border-white/40 bg-black/10' : 'border-[#2563EB] bg-white/5'}`}>
                        <Text className={`text-[12px] font-bold mb-0.5 ${isSent ? 'text-white' : 'text-[#2563EB]'}`}>
                          {message.replyTo.isSent ? 'You' : (message.replyTo.senderName || 'Sender')}
                        </Text>
                        <Text className={`text-[13.5px] ${isSent ? 'text-white/80' : 'text-zinc-400'}`} numberOfLines={1}>
                          {message.replyTo.isAudio ? "🎤 Voice Note" : message.replyTo.text}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {message.messageType === 'poll' && message.pollData && (
                      <View className="w-[240px] py-1">
                         <Text className="text-white font-rubik-bold text-[16px] mb-3">{message.pollData.question}</Text>
                         {message.pollData.options.map((opt: any) => (
                           <TouchableOpacity key={opt.id} className="bg-white/5 border border-white/10 rounded-xl p-3 mb-2 flex-row justify-between items-center">
                              <Text className="text-white/90 font-rubik-medium">{opt.text}</Text>
                              <View className="w-5 h-5 rounded-full border border-white/30" />
                           </TouchableOpacity>
                         ))}
                         <Text className="text-zinc-500 text-[11px] mt-1">{message.pollData.totalVotes || 0} votes • Select one</Text>
                      </View>
                    )}

                    {message.messageType === 'screenshot' && (
                      <View className="flex-row items-center py-1 w-[240px]">
                         <View className="bg-red-500/20 p-2 rounded-full mr-3">
                            <Ionicons name="alert-circle" size={24} color="#ef4444" />
                         </View>
                         <View className="flex-1">
                            <Text className="text-white font-rubik-bold text-[14px]">Screenshot Detected</Text>
                            <Text className="text-zinc-400 text-[12px]">{isSent ? 'You took' : 'They took'} a screenshot of this chat.</Text>
                         </View>
                      </View>
                    )}

                    {message.messageType === 'image' && message.chat_images && message.chat_images.length > 0 && (
                      <View className="mb-1 rounded-2xl overflow-hidden">
                        <Image source={{ uri: message.chat_images[0].url }} className="w-[240px] h-[240px] bg-zinc-800" />
                        {message.text && message.text !== '📷 Image' && (
                           <Text className={`mt-2 font-rubik-regular text-[15.5px] ${isSent ? 'text-white' : 'text-zinc-100'}`}>
                             {message.text}
                           </Text>
                        )}
                      </View>
                    )}

                    {message.messageType === 'video' && message.chat_videos && message.chat_videos.length > 0 && (
                      <View className="mb-1 rounded-2xl overflow-hidden relative">
                        <Image source={{ uri: message.chat_videos[0].thumbnail || message.chat_videos[0].url }} className="w-[240px] h-[240px] bg-zinc-800" />
                        <View className="absolute inset-0 items-center justify-center bg-black/20">
                           <Ionicons name="play-circle" size={50} color="white" />
                        </View>
                      </View>
                    )}

                    {message.messageType === 'file' && message.chat_files && message.chat_files.length > 0 && (
                      <View className={`flex-row items-center p-3 rounded-xl bg-black/20 w-[230px]`}>
                        <View className="w-10 h-10 bg-[#2563EB]/20 rounded-lg items-center justify-center mr-3">
                          <Ionicons name="document-text" size={24} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-[14px] font-rubik-medium" numberOfLines={1}>{message.chat_files[0].name}</Text>
                          <Text className="text-zinc-400 text-[11px] uppercase">{message.chat_files[0].extension}</Text>
                        </View>
                      </View>
                    )}

                    {message.isAudio ? (
                    <View className="flex-row items-center py-1 w-[240px]">
                      <Animated.View style={[rPulseStyle, { position: 'relative' }]}>
                        <Image 
                          source={typeof message.avatar === 'string' ? { uri: message.avatar } : message.avatar} 
                          className="w-11 h-11 rounded-full bg-zinc-800 border-2 border-zinc-200/20" 
                        />
                        <TouchableOpacity 
                          onPress={handlePlayVoice} 
                          className={`absolute -right-1 -bottom-1 w-6 h-6 rounded-full items-center justify-center shadow-lg ${isSent ? 'bg-white' : 'bg-[#2563EB]'}`}
                        >
                          <Ionicons name={isPlaying ? "pause" : "play"} size={14} color={isSent ? "#2563EB" : "white"} />
                        </TouchableOpacity>
                      </Animated.View>
                      
                      <View className="flex-1 px-3">
                        <Pressable onPress={handleScrub} className="h-6 justify-center">
                          <View style={{ width: SCRUBBER_WIDTH }} className={`h-[4px] rounded-full ${isSent ? 'bg-white/30' : 'bg-white/10'}`}>
                            <View 
                              style={{ width: `${progressPercent * 100}%` }} 
                              className={`h-full rounded-full ${isSent ? 'bg-white' : 'bg-[#2563EB]'}`} 
                            />
                          </View>
                          <View 
                            style={{ left: knobLeftPosition, position: 'absolute' }} 
                            className={`w-3.5 h-3.5 rounded-full -ml-1.5 shadow-sm bg-white`} 
                          />
                        </Pressable>
                        
                        <View className="flex-row justify-between w-[130px] mt-1">
                          <Text className={`text-[10px] font-medium ${isSent ? 'text-white/80' : 'text-zinc-500'}`}>
                            {formatTime(position)}
                          </Text>
                          <Text className={`text-[10px] font-medium ${isSent ? 'text-white/80' : 'text-zinc-500'}`}>
                            {duration > 0 ? formatTime(duration) : '0:00'}
                          </Text>
                        </View>
                      </View>

                      <View className={`p-2 rounded-full ${isSent ? 'bg-white/10' : 'bg-white/5'}`}>
                        <Ionicons name="mic" size={18} color={isSent ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)"} />
                      </View>
                    </View>
                  ) : (
                    <Text className={`font-rubik-regular text-[16px] leading-[22px] ${isSent ? 'text-white' : 'text-zinc-100'}`}>
                      {message.text}
                    </Text>
                  )}
                  </BubbleContainer>
                </TouchableOpacity>

                {isLastInGroup && (
                  <View className={`flex-row items-center mt-1.5 px-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <Text className="text-zinc-500 text-[10px] font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isSent && (
                      <Ionicons 
                        name={message.status === 'read' ? "checkmark-done" : (message.status === 'delivered' ? "checkmark-done" : "checkmark")} 
                        size={15} 
                        color={message.status === 'read' ? '#2563EB' : '#52525B'} 
                        style={{ marginLeft: 4 }} 
                      />
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};
