import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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
  isAudio?: boolean;
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
  const pulseScale = useSharedValue(1); // For the avatar pulse
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
      ['transparent', 'rgba(59, 130, 246, 0.2)']
    ),
  }));

  // Handle Pulse Animation
  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1, // Infinite
        true // Reverse
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
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: message.text },
        { shouldPlay: true, isLooping: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback failed", err);
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

  return (
    <Animated.View style={[rHighlightStyle, { width: '100%', paddingVertical: 2 }]} className="relative justify-center">
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
          <View className={`flex-row w-full px-4 ${isSent ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-4' : 'mb-1'}`}>
            <View className={`flex-row items-end max-w-[85%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {!isSent && !message.isAudio && (
                <View className="w-8 h-8 mr-2">
                  {isLastInGroup && message.avatar && <Image source={{ uri: message.avatar }} className="w-8 h-8 rounded-full bg-zinc-800" />}
                </View>
              )}

              <View className={`items-${isSent ? 'end' : 'start'}`}>
                <TouchableOpacity onLongPress={() => setShowPopup(true)} delayLongPress={400} activeOpacity={0.9} 
                  className={`px-3 py-2.5 shadow-sm ${isSent ? 'bg-white rounded-[24px]' : 'bg-[#1C1C1E] rounded-[24px]'} ${isLastInGroup ? (isSent ? 'rounded-br-[4px]' : 'rounded-bl-[4px]') : ''}`}>
                  
                  {message.replyTo && (
                    <TouchableOpacity 
                      onPress={() => onReplyMessagePress?.(message.replyTo!.id)}
                      className={`mb-2 py-1.5 px-3 border-l-2 rounded-lg ${isSent ? 'border-zinc-300 bg-zinc-100' : 'border-[#007AFF] bg-white/5'}`}>
                      <Text className={`text-[11px] font-bold mb-0.5 ${isSent ? 'text-zinc-500' : 'text-[#007AFF]'}`}>{message.replyTo.senderName}</Text>
                      <Text className={`text-[13px] ${isSent ? 'text-zinc-600' : 'text-zinc-400'}`} numberOfLines={1}>
                        {message.replyTo.isAudio ? "🎤 Voice Note" : message.replyTo.text}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {message.isAudio ? (
                    <View className="flex-row items-center py-1 w-[240px]">
                      {/* Pulsing Avatar with Play/Pause Button */}
                      <Animated.View style={[rPulseStyle, { position: 'relative' }]}>
                        <Image 
                          source={{ uri: message.avatar }} 
                          className="w-11 h-11 rounded-full bg-zinc-800 border-2 border-zinc-200/20" 
                        />
                        <TouchableOpacity 
                          onPress={handlePlayVoice} 
                          className={`absolute -right-1 -bottom-1 w-6 h-6 rounded-full items-center justify-center shadow-lg ${isSent ? 'bg-black' : 'bg-white'}`}
                        >
                          <Ionicons name={isPlaying ? "pause" : "play"} size={14} color={isSent ? "white" : "black"} />
                        </TouchableOpacity>
                      </Animated.View>
                      
                      <View className="flex-1 px-3">
                        <Pressable onPress={handleScrub} className="h-6 justify-center">
                          <View style={{ width: SCRUBBER_WIDTH }} className={`h-[4px] rounded-full ${isSent ? 'bg-black/10' : 'bg-white/10'}`}>
                            <View 
                              style={{ width: `${progressPercent * 100}%` }} 
                              className={`h-full rounded-full ${isSent ? 'bg-black' : 'bg-[#007AFF]'}`} 
                            />
                          </View>
                          <View 
                            style={{ left: knobLeftPosition, position: 'absolute' }} 
                            className={`w-3.5 h-3.5 rounded-full -ml-1.5 shadow-sm ${isSent ? 'bg-black' : 'bg-white'}`} 
                          />
                        </Pressable>
                        
                        <View className="flex-row justify-between w-[130px] mt-1">
                          <Text className={`text-[10px] font-medium ${isSent ? 'text-black/50' : 'text-zinc-500'}`}>
                            {formatTime(position)}
                          </Text>
                          <Text className={`text-[10px] font-medium ${isSent ? 'text-black/50' : 'text-zinc-500'}`}>
                            {duration > 0 ? formatTime(duration) : '0:00'}
                          </Text>
                        </View>
                      </View>

                      <View className={`p-2 rounded-full ${isSent ? 'bg-black/5' : 'bg-white/5'}`}>
                        <Ionicons name="mic" size={18} color={isSent ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)"} />
                      </View>
                    </View>
                  ) : (
                    <Text className={`font-rubik-regular text-[15.5px] leading-[21px] ${isSent ? 'text-black' : 'text-zinc-100'}`}>
                      {message.text}
                    </Text>
                  )}
                </TouchableOpacity>

                {isLastInGroup && (
                  <View className={`flex-row items-center mt-1.5 px-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <Text className="text-zinc-500 text-[10px] font-medium uppercase">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isSent && <Ionicons name="checkmark-done" size={14} color={message.status === 'read' ? '#007AFF' : '#a1a1aa'} style={{ marginLeft: 4 }} />}
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
