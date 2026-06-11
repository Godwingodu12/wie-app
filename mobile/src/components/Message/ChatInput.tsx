import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard, Platform, Dimensions, Alert, Modal, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmojiKeyboard } from 'rn-emoji-keyboard';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
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

import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';

export const ChatInput = ({ onSendMessage, replyingTo, onCancelReply, chatId }: any) => {

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [message, setMessage] = useState('');
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
       onSendMessage('📷 Media', replyingTo, false, result.assets[0].type === 'video' ? 'video' : 'image', { assets: result.assets });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
       onSendMessage('📷 Photo', replyingTo, false, 'image', { assets: result.assets });
    }
  };

  const shareLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const location = await Location.getCurrentPositionAsync({});
    onSendMessage('📍 Location', replyingTo, false, 'location', { 
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude 
    });
  };

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
      onSendMessage(recordedUri, replyingTo, true, 'voice'); 
      setRecordedUri(null);
      setDuration(0);
    } else if (message.trim()) {
      onSendMessage(message.trim(), replyingTo, false, 'text');
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

  const [isAttachModalVisible, setIsAttachModalVisible] = useState(false);

  const handleAttachPress = () => {
    setIsAttachModalVisible(true);
  };

  const attachmentOptions = [
    { label: 'Media', icon: 'images', color: '#7C4DFF', onPress: () => { pickImage(); setIsAttachModalVisible(false); } },
    { label: 'Camera', icon: 'camera', color: '#FF4D4D', onPress: () => { takePhoto(); setIsAttachModalVisible(false); } },
    { label: 'File', icon: 'document', color: '#4D94FF', onPress: () => { setIsAttachModalVisible(false); } },
    { label: 'Poll', icon: 'stats-chart', color: '#FFB84D', onPress: () => { 
        setIsAttachModalVisible(false);
        router.push({ pathname: '/Message/CreatePoll', params: { chatId } });
    } },
    { label: 'Contact', icon: 'person', color: '#4DFF88', onPress: () => { setIsAttachModalVisible(false); } },
    { label: 'Location', icon: 'location', color: '#FF4DFF', onPress: () => { shareLocation(); setIsAttachModalVisible(false); } },
  ];

  return (
    <View className="bg-black">
      {/* Attachment Modal */}
      <Modal
        visible={isAttachModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAttachModalVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-end" 
          onPress={() => setIsAttachModalVisible(false)}
        >
          <View className="bg-[#1C1C1E] rounded-t-[32px] p-6 pb-12 border-t border-white/5 shadow-2xl">
            <View className="w-12 h-1 bg-white/10 rounded-full self-center mb-8" />
            <View className="flex-row flex-wrap justify-between">
              {attachmentOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt.label}
                  onPress={opt.onPress}
                  className="w-[30%] items-center mb-8"
                >
                  <View 
                    style={{ backgroundColor: opt.color + '20' }}
                    className="w-16 h-14 rounded-2xl items-center justify-center mb-2 border border-white/5"
                  >
                    <Ionicons name={opt.icon as any} size={28} color={opt.color} />
                  </View>
                  <Text className="text-zinc-400 text-[13px] font-rubik-medium">{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

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
        <Animated.View 
          entering={FadeIn} 
          exiting={FadeOut}
          className="flex-row items-center justify-between px-4 py-2.5 bg-[#1C1C1E]/90 border-t border-white/5"
        >
          <View className="flex-1 flex-row items-center">
            <View className="w-1 h-10 bg-[#7C4DFF] rounded-full mr-3" />
            <View className="flex-1">
              <Text className="text-[#7C4DFF] text-[12px] font-rubik-bold mb-0.5">
                Replying to {replyingTo.isSent ? 'yourself' : 'them'}
              </Text>
              <Text className="text-zinc-400 text-[13.5px] font-rubik-regular" numberOfLines={1}>
                {replyingTo.isAudio ? "🎤 Voice Note" : replyingTo.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={onCancelReply}
            className="p-1.5 bg-white/5 rounded-full"
          >
            <Ionicons name="close" size={18} color="#71717a" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <View className="px-3 flex-row items-center justify-center pt-2.5 pb-6">
        <TouchableOpacity 
          onPress={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
          className="mr-2"
        >
          <MaterialCommunityIcons 
            name={isEmojiPickerOpen ? "keyboard-outline" : "emoticon-outline"} 
            size={28} 
            color="#A1A1AA" 
          />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-[#1F1F23] rounded-[28px] px-4 py-2 min-h-[52px] border border-white/5">
          {recordedUri ? (
            <Animated.View layout={Layout} className="flex-1 flex-row items-center">
              <View className="bg-red-500/10 px-3 py-1.5 rounded-full flex-row items-center">
                <Ionicons name="mic" size={14} color="#ef4444" />
                <Text className="text-red-500 ml-1.5 text-[13px] font-rubik-medium">Recorded</Text>
              </View>
              <Text className="text-zinc-400 ml-3 font-rubik-regular text-[14px]">Voice Note</Text>
              <TouchableOpacity onPress={() => {setRecordedUri(null); setDuration(0);}} className="ml-auto p-1">
                <Ionicons name="trash-outline" size={20} color="#71717a" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TextInput 
              ref={inputRef}
              placeholder="Message..." 
              placeholderTextColor="#52525B"
              value={message}
              onChangeText={setMessage}
              multiline
              className="flex-1 text-white px-1 font-rubik-regular text-[16px] max-h-32"
              selectionColor="#7C4DFF"
            />
          )}

          {!isTyping && !hasAudio && (
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleAttachPress} className="p-1 ml-1">
                <Ionicons name="add" size={26} color="#A1A1AA" />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} className="p-1 ml-1">
                <Ionicons name="camera-outline" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          onLongPress={(!isTyping && !hasAudio) ? startRecording : undefined}
          onPressOut={isRecording ? stopRecording : undefined}
          onPress={(isTyping || hasAudio) ? handleSend : undefined}
          activeOpacity={0.8}
          className="ml-2.5"
        >
          <LinearGradient
            colors={['#7C4DFF', '#6236FF']}
            className="w-[52px] h-[52px] rounded-full items-center justify-center shadow-lg"
          >
            <Ionicons 
              name={(isTyping || hasAudio) ? "send" : "mic"} 
              size={24} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {isEmojiPickerOpen ? (
        <View style={{ height: RESPONSIVE_PANEL_HEIGHT }}>
          <EmojiKeyboard 
            onEmojiSelected={(emojiObject) => setMessage(prev => prev + emojiObject.emoji)}
            theme={{ 
              container: '#18181b', 
              category: { 
                iconActive: '#7C4DFF', 
                container: '#27272a', 
                icon: '#a1a1aa'
              },
            }} 
          />
        </View>
      ) : (
        <View style={{ height: isKeyboardVisible ? 340 : Math.max(insets.bottom, 5) }} />
      )}
    </View>
  );
};
