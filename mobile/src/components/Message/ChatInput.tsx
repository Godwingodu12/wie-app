import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard, Platform, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import { Audio } from 'expo-av';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';

export const ChatInput = ({ onSendMessage, replyingTo, onCancelReply }: any) => {

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState('');
  const isTyping = message.trim().length > 0;
  const hasAudio = !!recordedUri;
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  // Animation values
  const pulseAnim = useSharedValue(1);
  const micScale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulseAnim.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })), 
        -1
      );
      micScale.value = withRepeat(
        withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1
      );
      const interval = setInterval(() => setDuration(prev => prev + 1), 1000);
      return () => {
        clearInterval(interval);
        pulseAnim.value = 1;
        micScale.value = 1;
      };
    }
  }, [isRecording]);

  const rDotStyle = useAnimatedStyle(() => ({ opacity: pulseAnim.value }));
  const rMicPulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      setRecordedUri(null);
    } catch (err) { console.error("Mic Error:", err); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      setRecording(null);
      if (uri) setRecordedUri(uri);
    } catch (err) { console.error("Stop Error:", err); }
  };

  const handleSend = () => {
    if (recordedUri) {
      onSendMessage(recordedUri, replyingTo, true); 
      setRecordedUri(null);
      setDuration(0);
    } else if (message.trim()) {
      onSendMessage(message.trim(), replyingTo, false);
      setMessage('');
    }
  };
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const RESPONSIVE_PANEL_HEIGHT = SCREEN_HEIGHT * 0.38;
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      setIsEmojiPickerOpen(false); // Close emoji if keyboard opens
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  return (
    <View className="bg-black">
      {/* Recording Overlay */}
      {isRecording && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black z-50 flex-row items-center px-4 justify-between"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="flex-row items-center flex-1">
            <Animated.View style={rDotStyle} className="w-2.5 h-2.5 rounded-full bg-red-600 mr-3" />
            <Text className="text-white font-rubik-medium text-lg mr-4">{formatTime(duration)}</Text>
            <Animated.Text 
              entering={FadeIn.delay(300)}
              className="text-zinc-500 font-rubik-regular text-[15px]"
            >
              Release to save
            </Animated.Text>
          </View>
          
          <Animated.View style={rMicPulseStyle} className="bg-red-600/20 p-3 rounded-full">
            <Ionicons name="mic" size={24} color="#ef4444" />
          </Animated.View>
        </Animated.View>
      )}

      {replyingTo && (
        <View className="flex-row items-center justify-between px-4 py-2 bg-zinc-900 border-t border-zinc-800">
          <View className="flex-1 flex-row items-center">
            <View className="w-0.5 h-8 bg-blue-500 mr-2" />
            <View className="flex-1">
              <Text className="text-blue-400 text-xs font-rubik-medium mb-0.5">Replying to {replyingTo.isSent ? 'yourself' : 'them'}</Text>
              <Text className="text-zinc-400 text-xs font-rubik-regular" numberOfLines={1}>
                {replyingTo.isAudio ? "🎤 Voice Note" : replyingTo.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onCancelReply}><Ionicons name="close" size={20} color="#71717a" /></TouchableOpacity>
        </View>
      )}

      <View className="px-3 flex-row items-end justify-center pt-2 pb-2">
        <View className="flex-1 flex-row items-center bg-zinc-900 rounded-[25px] px-3 py-2 min-h-[48px]">
          <TouchableOpacity onPress={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}>
            <MaterialCommunityIcons name={isEmojiPickerOpen ? "keyboard-outline" : "emoticon-outline"} size={26} color="#a1a1aa" />
          </TouchableOpacity>
          
          {recordedUri ? (
            <Animated.View layout={Layout} className="flex-1 flex-row items-center px-2">
              <View className="bg-red-500/10 px-2 py-1 rounded-full flex-row items-center">
                <Ionicons name="mic" size={14} color="#ef4444" />
                <Text className="text-red-500 ml-1 text-xs font-rubik-medium">Recorded</Text>
              </View>
              <Text className="text-zinc-400 ml-2 font-rubik-regular">Voice Note</Text>
              <TouchableOpacity onPress={() => {setRecordedUri(null); setDuration(0);}} className="ml-auto">
                <Ionicons name="trash-outline" size={20} color="#71717a" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TextInput 
              ref={inputRef}
              placeholder="Message" 
              placeholderTextColor="#71717a"
              value={message}
              onChangeText={setMessage}
              multiline
              className="flex-1 text-white px-2 font-rubik-regular text-[17px] max-h-32 pt-1 pb-1"
            />
          )}
        </View>

        <TouchableOpacity 
          onLongPress={(!isTyping && !hasAudio) ? startRecording : undefined}
          onPressOut={isRecording ? stopRecording : undefined}
          onPress={(isTyping || hasAudio) ? handleSend : undefined}
          activeOpacity={0.7}
          className={`w-12 h-12 rounded-full items-center justify-center ml-2 ${(isTyping || hasAudio) ? 'bg-white' : 'bg-zinc-800'}`}
        >
          <Ionicons name={(isTyping || hasAudio) ? "send" : "mic"} size={22} color={(isTyping || hasAudio) ? "black" : "white"} />
        </TouchableOpacity>
      </View>
      {isEmojiPickerOpen ? (
        <View style={{ height: RESPONSIVE_PANEL_HEIGHT }}>
          <EmojiKeyboard 
            onEmojiSelected={(emojiObject) => setMessage(prev => prev + emojiObject.emoji)}
            theme={{ 
              container: '#18181b', 
              category: { 
                iconActive: '#000', 
                container: '#27272a', 
                icon: '#a1a1aa'
              },
            }} 
          />
        </View>
      ) : (
        /* The Bottom Fix:
           Height is 0 when keyboard is active (system handles position).
           Height is insets.bottom when keyboard is closed (restores initial position).
        */
        <View style={{ height: isKeyboardVisible ? 340 : Math.max(insets.bottom, 5) }} />
      )}
    </View>
  );
};
