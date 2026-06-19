import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { getImageSource } from '@/utils/imageUtils';
import { router } from 'expo-router';
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
  postShareData?: {
    postId: string;
    postOwnerId: string;
    postOwnerName?: string;
    postOwnerUsername?: string;
    postOwnerAvatar?: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    sharerName?: string;
    postUrl?: string;
    ratio?: string;
  };
  storyShareData?: {
    fluxId: string;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    ownerId: string;
    ownerName: string;
    ownerAvatar?: string;
    text?: string;
  };
  pollData?: any;
  voiceData?: {
    url: string;
    duration: number;
    mimeType?: string;
  };
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
  onMediaPress?: (media: { url: string; type: 'image' | 'video' }) => void;
  isHighlighted?: boolean;
  isLastInGroup?: boolean; 
}

export const MessageBubble = React.memo(({ 
  message, 
  onReply, 
  onDeleteForMe, 
  onDeleteForEveryone, 
  onReplyMessagePress,
  onMediaPress,
  isHighlighted = false,
  isLastInGroup = true 
}: MessageBubbleProps) => {
  const [showPopup, setShowPopup] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const [mapLoading, setMapLoading] = useState(true);
  
  const isSent = message.isSent;
  const translateX = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const highlightAnim = useSharedValue(0);
  const SCRUBBER_WIDTH = 130;

  const cyclePlaybackRate = async () => {
    const nextRate = playbackRate === 1 ? 1.5 : (playbackRate === 1.5 ? 2 : 1);
    setPlaybackRate(nextRate);
    if (sound && isPlaying) {
      await sound.setRateAsync(nextRate, true);
    }
  };

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
            await sound.setRateAsync(playbackRate, true);
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
        return;
      }

      // Ensure audio mode is configured for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 1. Gather all potential URIs (remote and local)
      const candidateUris = [];
      if (message.voiceData?.url) candidateUris.push(message.voiceData.url);
      if (message.chat_audio && message.chat_audio.length > 0) candidateUris.push(message.chat_audio[0].url);
      if (message.text && message.text.startsWith('file://')) candidateUris.push(message.text);

      const validUris = candidateUris.filter(uri => uri && uri !== '🎤 Voice message' && uri !== '🎤 Voice Note');

      if (validUris.length === 0) return;

      const getFormattedUri = (inputUri: string) => {
        let finalUri = inputUri;
        if (Platform.OS === 'android' && !finalUri.startsWith('http') && !finalUri.startsWith('file://')) {
          finalUri = `file://${finalUri.startsWith('/') ? '' : '/'}${finalUri}`;
        }
        return finalUri;
      };

      // 2. Try to play the most likely URI
      let success = false;
      for (const uri of validUris) {
        const formattedUri = getFormattedUri(uri);
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: formattedUri },
            { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
            onPlaybackStatusUpdate
          );
          setSound(newSound);
          setIsPlaying(true);
          success = true;
          break;
        } catch (playErr) {
          console.log(`DEBUG: Failed to play URI ${formattedUri}`);
        }
      }
    } catch (err: any) {
      console.error("Playback failed:", err.message);
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

  const MapSkeleton = () => (
    <View style={{ backgroundColor: '#2c2c2e' }} className="absolute inset-0 overflow-hidden">
      <Svg height="100%" width="100%" viewBox="0 0 250 130">
        {/* Intricate High-Density Building Grid */}
        {[...Array(50)].map((_, i) => (
          <Rect 
            key={`b-${i}`}
            x={(i % 10) * 45 + (i * 7 % 25)} 
            y={Math.floor(i / 10) * 35 + (i * 3 % 20)} 
            width={6 + (i % 8)} 
            height={5 + (i % 6)} 
            rx="1" 
            fill="#3a3a3a" 
          />
        ))}

        {/* Realistic Curved Route Paths */}
        <Path d="M 0 45 Q 125 38, 250 48" fill="none" stroke="#3e3e3e" strokeWidth="2.8" />
        <Path d="M 0 90 Q 125 98, 250 85" fill="none" stroke="#3e3e3e" strokeWidth="2.5" />
        <Path d="M 55 0 Q 65 65, 50 130" fill="none" stroke="#3e3e3e" strokeWidth="2.5" />
        <Path d="M 185 0 Q 175 65, 195 130" fill="none" stroke="#3e3e3e" strokeWidth="2.5" />
        
        <Path d="M 0 20 Q 125 25, 250 15" fill="none" stroke="#3e3e3e" strokeWidth="1" opacity="0.6" />
        <Path d="M 0 110 Q 125 105, 250 115" fill="none" stroke="#3e3e3e" strokeWidth="1" opacity="0.6" />
        <Path d="M 115 0 Q 110 65, 120 130" fill="none" stroke="#3e3e3e" strokeWidth="1" opacity="0.6" />

        {/* Visible Map Place Labels */}
        <SvgText x="15" y="41" fontSize="4.5" fill="#5a5a5c" fontWeight="bold">Shornur Road</SvgText>
        <SvgText x="135" y="44" fontSize="4.5" fill="#5a5a5c" fontWeight="bold">Main Ave</SvgText>
        <SvgText x="65" y="85" fontSize="4.5" fill="#5a5a5c" fontWeight="bold">Town Center</SvgText>
        <SvgText x="200" y="25" fontSize="4" fill="#4a4a4c">Industrial Area</SvgText>
        <SvgText x="205" y="105" fontSize="4.5" fill="#5a5a5c" fontWeight="bold">West Link</SvgText>
      </Svg>
    </View>
  );

  const rPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleReplyTrigger = () => { if (onReply) onReply(message); };
  const closePopup = () => setShowPopup(false);
  const handleDeleteMe = () => { if (onDeleteForMe) onDeleteForMe(message.id); closePopup(); };
  const handleDeleteEveryone = () => { if (onDeleteForEveryone) onDeleteForEveryone(message.id); closePopup(); };

  const [localReactions, setLocalReactions] = useState<string[]>([]);

  const handleReaction = (emoji: string) => {
    setLocalReactions(prev => prev.includes(emoji) ? prev.filter(e => e !== emoji) : [...prev, emoji]);
    setShowPopup(false);
  };

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleReaction)('❤️');
    });

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

  const composedGesture = Gesture.Simultaneous(panGesture, doubleTapGesture);

  const rBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rIconStyle = useAnimatedStyle(() => {
    const opacity = interpolate(Math.abs(translateX.value), [0, 50], [0, 1], Extrapolate.CLAMP);
    return { opacity, transform: [{ scale: opacity }] };
  });

  const renderTextWithMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[\w\.]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') && part.length > 1) {
        const username = part.substring(1);
        return (
          <Text
            key={index}
            style={{ color: '#3897f0', fontWeight: 'bold' }}
            onPress={() => router.push({ pathname: '/Profile/OtherProfile', params: { username, type: 'user' } })}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const BubbleContainer = ({ children, isSent, hasReply, messageType }: { children: React.ReactNode, isSent: boolean, hasReply: boolean, messageType?: string }) => {
    const isPostShare = messageType === 'post_share';
    const isFluxShare = ['flux_share', 'flux_mention', 'flux_remention'].includes(messageType || '');
    const isLocation = messageType === 'location' || messageType === 'live_location';
    const isAudio = messageType === 'audio' || messageType === 'voice';
    const isMedia = messageType === 'image' || messageType === 'video';
    const bubbleRadius = (isLocation || isMedia) ? 32 : (isAudio ? 36 : (hasReply ? 24 : 20));
    const sharpRadius = isAudio ? 36 : 4;
    
    const content = (
      <View
        style={{
          paddingHorizontal: (isPostShare || isFluxShare || isLocation || isMedia) ? 0 : (isAudio ? 10 : (hasReply ? 12 : 16)),
          paddingVertical: (isPostShare || isFluxShare || isLocation || isMedia) ? 0 : (isAudio ? 10 : (hasReply ? 10 : 8)),
          borderRadius: bubbleRadius,
          borderBottomRightRadius: (isSent && isLastInGroup) ? ((isLocation || isMedia) ? 32 : sharpRadius) : bubbleRadius,
          borderBottomLeftRadius: (!isSent && isLastInGroup) ? ((isLocation || isMedia) ? 32 : sharpRadius) : bubbleRadius,
          width: isLocation ? 290 : undefined,
          minWidth: (isLocation || isMedia) ? (isMedia ? 240 : 290) : undefined,
          maxWidth: '100%',
          borderWidth: (isMedia || isPostShare || isFluxShare) ? 0 : ((hasReply || isAudio) ? 1 : 0),
          borderColor: isSent ? 'rgba(255,255,255,0.15)' : 'rgba(139, 92, 246, 0.2)',
          overflow: 'hidden',
          backgroundColor: (isAudio || isLocation || isPostShare || isFluxShare || isMedia) ? 'transparent' : (isSent ? '#8b5cf6' : '#1c1c1e'),
        }}
      >
        {children}
      </View>
    );

    if (isAudio) {
      return (
        <LinearGradient
          colors={['#C084FC', '#8B5CF6']} // Lighter lavender gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: bubbleRadius,
            borderBottomRightRadius: (isSent && isLastInGroup) ? sharpRadius : bubbleRadius,
            borderBottomLeftRadius: (!isSent && isLastInGroup) ? sharpRadius : bubbleRadius,
          }}
        >
          {content}
        </LinearGradient>
      );
    }

    return content;
  };

  const WAVE_BARS = [
    6, 10, 8, 12, 18, 16, 10, 8, 12, 18, 16, 10, 8, 12, 18, 16, 10, 8, 12, 18, 16, 10, 8,
    6, 10, 8, 12, 18, 16, 10, 8, 12, 18, 16, 10, 8, 12, 18, 16, 10, 8, 12, 18, 16, 10, 8
  ];

  return (
    <Animated.View style={[rHighlightStyle, { width: '100%', paddingVertical: 0.5 }]} className="relative justify-center">
      <Modal transparent visible={showPopup} animationType="none" onRequestClose={closePopup}>
        <Pressable className="flex-1 bg-black/70 justify-center items-center px-10" onPress={closePopup}>
          <Animated.View entering={ZoomIn.duration(250)} exiting={ZoomOut.duration(200)} className="w-full bg-[#1c1c1e] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
            <View className="items-center pt-4 pb-2"><View className="w-12 h-1 bg-white/10 rounded-full" /></View>
            <View className="flex-row justify-between px-6 py-4 border-b border-white/5">
              {['❤️', '😂', '😮', '😢', '🙏', '👍'].map(emoji => (
                <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} className="p-2 bg-white/5 rounded-full">
                  <Text className="text-[20px]">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <TouchableOpacity onPress={() => { handleReplyTrigger(); closePopup(); }} className="flex-row items-center justify-between px-6 py-5 active:bg-white/5">
              <Text className="text-white/90 text-[17px] font-medium">Reply</Text>
              <View className="bg-white/10 p-2 rounded-2xl"><Ionicons name="arrow-undo-outline" size={22} color="white" /></View>
            </TouchableOpacity>
            <View className="h-[0.5px] bg-white/5 mx-6" />
            <TouchableOpacity onPress={closePopup} className="flex-row items-center justify-between px-6 py-5 mb-2 active:bg-white/5">
              <Text className="text-zinc-500 text-[17px] font-medium">Close</Text>
              <View className="bg-zinc-800 p-2 rounded-2xl"><Ionicons name="close" size={22} color="#a1a1aa" /></View>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <Animated.View style={[rIconStyle, { position: 'absolute', [isSent ? 'right' : 'left']: 0, top: '45%' }]}>
        <View style={{ [isSent ? 'marginRight' : 'marginLeft']: -40 }}>
           <Ionicons name="arrow-undo" size={20} color="#71717a" />
        </View>
      </Animated.View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={rBubbleStyle}>
          <View className={`flex-row w-full px-4 ${isSent ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-4' : 'mb-1'}`}>
            <View className={`flex-row items-end max-w-[85%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {!isSent && !message.isAudio && (
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
                  {!isSent && isLastInGroup && message.senderName && message.messageType !== 'system' && !message.isAudio && (
                    <Text className="text-zinc-500 text-[12px] font-rubik-medium mb-1.5 ml-2">{message.senderName}</Text>
                  )}

                  {message.replyTo && message.replyTo.id && (
                    <View className={`mb-1 px-1 ${isSent ? 'items-end' : 'items-start'}`}>
                      <Text className="text-zinc-500 text-[11px] font-rubik-medium">
                        Replied to {message.replyTo.isSent ? 'you' : 'them'}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity onLongPress={() => setShowPopup(true)} delayLongPress={400} activeOpacity={0.9}>
                    <View className={(message.messageType === 'post_share' || message.messageType === 'image' || message.messageType === 'video') ? "flex-row items-center" : ""}>
                      {isSent && (message.messageType === 'post_share' || message.messageType === 'image' || message.messageType === 'video') && (
                        <TouchableOpacity className="mr-3 p-2 bg-zinc-800/30 rounded-full">
                          <Ionicons name="paper-plane-outline" size={18} color="white" />
                        </TouchableOpacity>
                      )}
                      
                      <BubbleContainer isSent={isSent} hasReply={!!(message.replyTo && message.replyTo.id)} messageType={message.isAudio ? 'audio' : message.messageType}>
                      
                      {message.replyTo && message.replyTo.id ? (
                        <TouchableOpacity 
                          onPress={() => {
                            if (message.replyTo?.id) {
                              onReplyMessagePress?.(message.replyTo.id);
                            }
                          }}
                          activeOpacity={0.7}
                          className={`mb-2 py-2 px-3 border-l-4 rounded-xl flex-col bg-black/20 border-white/20`}>
                          <Text className={`text-[13px] font-rubik-regular text-zinc-300`} numberOfLines={1}>
                            {message.replyTo.isAudio ? "🎤 Voice Note" : (message.replyTo.text || 'Original Message')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}

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
                        <TouchableOpacity 
                          activeOpacity={0.9} 
                          onPress={() => onMediaPress?.({ url: message.chat_images![0].url, type: 'image' })}
                          className="mb-1 rounded-2xl overflow-hidden"
                        >
                          <Image source={{ uri: message.chat_images[0].url }} className="w-[240px] h-[240px] bg-zinc-800" />
                          {message.text && !['📷 Image', '📷 Photo'].includes(message.text) && (
                             <Text className={`mt-2 font-rubik-regular text-[15.5px] text-white`}>
                               {message.text}
                             </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {message.messageType === 'video' && message.chat_videos && message.chat_videos.length > 0 && (
                        <TouchableOpacity 
                          activeOpacity={0.9}
                          onPress={() => onMediaPress?.({ url: message.chat_videos![0].url, type: 'video' })}
                          className="mb-1 rounded-2xl overflow-hidden relative"
                        >
                          <Image source={{ uri: message.chat_videos[0].thumbnail || message.chat_videos[0].url }} className="w-[240px] h-[240px] bg-zinc-800" />
                          <View className="absolute inset-0 items-center justify-center bg-black/20">
                             <Ionicons name="play-circle" size={50} color="white" />
                          </View>
                        </TouchableOpacity>
                      )}

                      {message.messageType === 'file' && message.chat_files && message.chat_files.length > 0 && (
                        <View className={`flex-row items-center p-3 rounded-xl bg-black/20 w-[230px]`}>
                          <View className="w-10 h-10 bg-primary/20 rounded-lg items-center justify-center mr-3">
                            <Ionicons name="document-text" size={24} color="#8b5cf6" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white text-[14px] font-rubik-medium" numberOfLines={1}>{message.chat_files[0].name}</Text>
                            <Text className="text-zinc-400 text-[11px] uppercase">{message.chat_files[0].extension}</Text>
                          </View>
                        </View>
                      )}

                      {message.messageType === 'post_share' && message.postShareData && (() => {
                        const shareRatio = message.postShareData.ratio || '4:5';
                        const ratioValue = ({
                          '1:1': 1,
                          '4:5': 0.8,
                          '9:16': 9/16,
                          '16:9': 363/196,
                          '4:3': 4/3
                        } as any)[shareRatio] || 0.8;
                        const bubbleWidth = 240;
                        const calculatedHeight = bubbleWidth / ratioValue;
                        // Limit height to avoid extremely tall bubbles from stretching strangely
                        const bubbleHeight = Math.min(calculatedHeight, 320);

                        return (
                          <View style={{ width: bubbleWidth }} className="rounded-3xl overflow-hidden bg-zinc-900">
                            <View className="relative">
                              {message.postShareData.mediaType === 'video' ? (
                                <Video
                                  source={{ uri: message.postShareData.mediaUrl }}
                                  style={{ width: bubbleWidth, height: bubbleHeight, borderRadius: 24 }}
                                  className="bg-zinc-900/50"
                                  resizeMode={ResizeMode.COVER}
                                  shouldPlay={true}
                                  isLooping={true}
                                  isMuted={true}
                                />
                              ) : (
                                <Image 
                                  source={getImageSource(message.postShareData.mediaUrl, null)} 
                                  style={{ width: bubbleWidth, height: bubbleHeight, borderRadius: 24 }}
                                  className="bg-zinc-900/50"
                                  resizeMode="cover"
                                />
                              )}
                              
                              {/* Glass Effect Header Overlay */}
                              <View 
                                className="absolute top-0 left-0 right-0 flex-row items-center p-2.5"
                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                              >
                                <View className="w-5 h-5 rounded-full bg-black/40 mr-2 overflow-hidden items-center justify-center">
                                 <Image 
                                   source={getImageSource(message.postShareData.postOwnerAvatar)} 
                                   className="w-full h-full"
                                   resizeMode="cover"
                                 />
                                </View>
                                <Text className="text-white font-rubik-medium text-[12px] flex-1" numberOfLines={1}>
                                  {message.postShareData.postOwnerName || message.postShareData.postOwnerUsername || message.postShareData.sharerName || 'User'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      })()}

                      {(message.messageType === 'flux_share' || message.messageType === 'flux_mention' || message.messageType === 'flux_remention') && message.storyShareData && (
                        <View className="w-[240px] rounded-3xl overflow-hidden bg-zinc-900">
                          <View className="relative">
                            {message.storyShareData.mediaType === 'video' ? (
                              <Video
                                source={{ uri: message.storyShareData.mediaUrl }}
                                style={{ width: 240, height: 320, borderRadius: 24 }}
                                className="bg-zinc-900/50"
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={true}
                                isLooping={true}
                                isMuted={true}
                              />
                            ) : (
                              <Image 
                                source={getImageSource(message.storyShareData.mediaUrl, null)} 
                                style={{ width: 240, height: 320, borderRadius: 24 }}
                                className="bg-zinc-900/50"
                                resizeMode="cover"
                              />
                            )}
                            
                            {/* Glass Effect Header Overlay */}
                            <View 
                              className="absolute top-0 left-0 right-0 flex-row items-center p-2.5"
                              style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                            >
                              <View className="w-5 h-5 rounded-full bg-black/40 mr-2 overflow-hidden items-center justify-center">
                               <Image 
                                 source={getImageSource(message.storyShareData.ownerAvatar)} 
                                 className="w-full h-full"
                                 resizeMode="cover"
                               />
                              </View>
                              <Text className="text-white font-rubik-medium text-[12px] flex-1" numberOfLines={1}>
                                {message.storyShareData.ownerName || 'User'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                        {(message.messageType === 'location' || message.messageType === 'live_location') && message.locationData && (
                        <View style={{ width: 290, backgroundColor: '#2c2c2e' }} className="rounded-[32px] overflow-hidden border border-white/10 shadow-sm">
                          <View style={{ height: 135 }} className="w-full relative bg-[#121212] overflow-hidden">
                             {mapLoading && <MapSkeleton />}
                             
                             <Image 
                               source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${message.locationData.longitude},${message.locationData.latitude},15/580x270?access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ''}` }}
                               style={{ width: '100%', height: '100%' }}
                               resizeMode="cover"
                               onLoadEnd={() => setMapLoading(false)}
                             />

                             {message.messageType === 'live_location' && (
                               <View className="absolute top-3 left-3 bg-red-500 px-2 py-0.5 rounded-md flex-row items-center">
                                 <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
                                 <Text className="text-white text-[10px] font-rubik-bold uppercase">Live</Text>
                               </View>
                             )}
                             
                             {!mapLoading && (
                               <View className="absolute inset-0 items-center justify-center">
                                  <View className="w-3.5 h-3.5 rounded-full bg-white/25 items-center justify-center">
                                     <View className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                  </View>
                                </View>
                             )}
                          </View>
                          
                          <View style={{ backgroundColor: '#2c2c2e' }} className="px-5 py-4 flex-row items-center justify-between">
                             <View className="flex-1 mr-3">
                                <Text className="text-white font-rubik-bold text-[15px] mb-0.5" numberOfLines={1}>
                                  {message.locationData.name || 'Nahdi Kuzhimanthi'}
                                </Text>
                                <Text className="text-zinc-400 text-[11px] leading-[14px]" numberOfLines={2}>
                                  {message.locationData.address || 'Shornur-Perinthalmanna Rd, Perinthalmanna, 679322, KL, IN'}
                                </Text>
                                <Text className="text-zinc-500 text-[10.5px] mt-1.5" numberOfLines={1}>
                                  www.nahdimandi.com
                                </Text>
                             </View>
                             
                             <TouchableOpacity className="w-9 h-9 rounded-full bg-[#8b5cf6] items-center justify-center shadow-lg active:opacity-80">
                                <Ionicons name="paper-plane" size={17} color="white" />
                             </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {message.isAudio ? (
                      <View className="flex-row items-center w-[260px]">
                        <View className="mr-2">
                          <Image 
                            source={typeof message.avatar === 'string' ? { uri: message.avatar } : message.avatar} 
                            className="w-10 h-10 rounded-full bg-zinc-800" 
                          />
                        </View>
                        
                        <View className="flex-1 flex-row items-center">
                          <View className="items-center mr-2">
                            <TouchableOpacity 
                              onPress={handlePlayVoice} 
                              activeOpacity={0.8}
                            >
                              <Ionicons name={isPlaying ? "pause" : "play"} size={26} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white font-rubik-medium text-[10px] mt-1">
                              {formatTime(position)}
                            </Text>
                          </View>

                          <View className="flex-1 h-10 justify-center">
                            <Pressable onPress={handleScrub} className="flex-row items-center gap-[1.5px] h-6">
                              {WAVE_BARS.map((height, i) => {
                                 const progress = (i / WAVE_BARS.length);
                                 const isPlayed = progressPercent > progress;
                                 return (
                                   <View 
                                     key={i} 
                                     style={{ 
                                       height, 
                                       width: 2, 
                                       borderRadius: 1,
                                       backgroundColor: isPlayed ? 'white' : 'rgba(255,255,255,0.4)'
                                     }} 
                                   />
                                 );
                              })}
                            </Pressable>
                          </View>
                        </View>

                        <TouchableOpacity 
                          onPress={cyclePlaybackRate}
                          className="ml-2 bg-black/20 px-2 py-1 rounded-full border border-white/10 min-w-[34px] items-center"
                        >
                           <Text className="text-white text-[10px] font-rubik-bold">{playbackRate}X</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      message.messageType !== 'post_share' && message.messageType !== 'location' && message.messageType !== 'live_location' && message.messageType !== 'image' && message.messageType !== 'video' && (
                        <Text className={`font-rubik-regular text-[16px] leading-[22px] text-white`}>
                          {renderTextWithMentions(message.text)}
                        </Text>
                      )
                    )}
                    </BubbleContainer>

                    {localReactions.length > 0 && (
                      <View 
                        className={`absolute -bottom-3 ${isSent ? 'right-2' : 'left-2'} bg-[#1c1c1e] rounded-full px-1.5 py-0.5 flex-row items-center border border-white/10 z-10 shadow-lg`}
                      >
                        {localReactions.map((emoji, idx) => (
                          <Text key={idx} className="text-[13px] mx-0.5">{emoji}</Text>
                        ))}
                      </View>
                    )}

                    {!isSent && (message.messageType === 'post_share' || message.messageType === 'image' || message.messageType === 'video') && (
                      <TouchableOpacity className="ml-3 p-2 bg-zinc-800/30 rounded-full">
                        <Ionicons name="paper-plane-outline" size={18} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>

                {isLastInGroup && !message.isAudio && (
                  <View className={`flex-row items-center mt-1.5 px-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <Text className="text-zinc-500 text-[10px] font-medium">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isSent && (
                      <Ionicons 
                        name={message.status === 'read' ? "checkmark-done" : (message.status === 'delivered' ? "checkmark-done" : "checkmark")} 
                        size={15} 
                        color={message.status === 'read' ? '#8b5cf6' : '#52525B'} 
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
}, (prevProps, nextProps) => {
  return (
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isLastInGroup === nextProps.isLastInGroup &&
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.avatar === nextProps.message.avatar
  );
});

