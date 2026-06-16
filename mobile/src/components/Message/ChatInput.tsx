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

import { BlurView } from 'expo-blur';
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
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert("Location Error", "Please enable location services in your device settings.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to share your location.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      onSendMessage('📍 Location', replyingTo, false, 'location', { 
        latitude: location.coords.latitude, 
        longitude: location.coords.longitude 
    });
    } catch (error: any) {
      console.error("Location Error:", error);
      Alert.alert("Location Unavailable", "Could not retrieve your current location. Please check your GPS settings.");
    }
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

  const recordingLock = useRef(false);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const startRecording = async () => {
    if (recordingLock.current) return;
    recordingLock.current = true;
    
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        recordingLock.current = false;
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Ensure any existing recording is cleared
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (e) {}
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      setRecordedUri(null);
    } catch (err) { 
      console.error("Mic Error:", err); 
    } finally {
      recordingLock.current = false;
    }
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) return;
    setIsRecording(false);
    
    try {
      const status = await recording.getStatusAsync();
      if (status.canRecord) {
        await recording.stopAndUnloadAsync();
      }
      
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      
      setRecording(null);
      if (uri) {
        // Automatically send on release if it's a valid recording
        onSendMessage(uri, replyingTo, true, 'voice');
        setDuration(0);
      }
    } catch (err) { 
      console.error("Stop Error:", err); 
      setRecording(null);
    }
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
    { label: 'Gallery', icon: 'images', color: '#3B82F6', onPress: () => { pickImage(); setIsAttachModalVisible(false); } },
    { label: 'Camera', icon: 'camera', color: '#EF4444', onPress: () => { takePhoto(); setIsAttachModalVisible(false); } },
    { label: 'Location', icon: 'location', color: '#10B981', onPress: () => { 
        setIsAttachModalVisible(false);
        router.push({ pathname: '/Message/LocationPicker', params: { chatId } });
    } },
    { label: 'Contacts', icon: 'person', color: '#3B82F6', onPress: () => { setIsAttachModalVisible(false); } },
    { label: 'Document', icon: 'document', color: '#8B5CF6', onPress: () => { setIsAttachModalVisible(false); } },
    { label: 'Audio', icon: 'musical-notes', color: '#F59E0B', onPress: () => { setIsAttachModalVisible(false); } },
    { label: 'Poll', icon: 'stats-chart', color: '#EAB308', onPress: () => { 
        setIsAttachModalVisible(false);
        router.push({ pathname: '/Message/CreatePoll', params: { chatId } });
    } },
    { label: 'Contacts', icon: 'card', color: '#EC4899', onPress: () => { setIsAttachModalVisible(false); } },
  ];

  return (
    <View className="bg-black">
      {/* Attachment Modal */}
      <Modal
        visible={isAttachModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAttachModalVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/40 justify-end" 
          onPress={() => setIsAttachModalVisible(false)}
        >
          <View className="bg-[#18181B] rounded-t-[36px] overflow-hidden border-t border-white/10 shadow-2xl">
            <View className="p-6 pb-12">
              <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-8" />
              <View className="flex-row flex-wrap justify-between">
                {attachmentOptions.map((opt, index) => (
                  <TouchableOpacity 
                    key={`${opt.label}-${index}`}
                    onPress={opt.onPress}
                    className="w-[23%] items-center mb-8"
                  >
                    <View 
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                      className="w-16 h-16 rounded-[22px] items-center justify-center mb-2.5 border border-white/5 shadow-sm"
                    >
                      <Ionicons name={opt.icon as any} size={28} color={opt.color} />
                    </View>
                    <Text className="text-zinc-400 text-[12px] font-rubik-medium">{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
          className="px-5 py-2.5 bg-[#0F0F12] border-t border-white/5"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-zinc-400 text-[12px] font-rubik-medium mb-1">
                Replied to {replyingTo.isSent ? 'you' : 'them'}
              </Text>
              <View className="flex-row items-center bg-white/5 rounded-xl px-3 py-2 border-l-4 border-primary">
                <Text className="text-zinc-300 text-[13px] font-rubik-regular flex-1" numberOfLines={1}>
                  {replyingTo.isAudio ? "🎤 Voice Note" : replyingTo.text}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={onCancelReply}
              className="w-7 h-7 bg-white/10 rounded-full items-center justify-center ml-4 mt-4"
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <View className="px-3 flex-row items-center justify-center pt-2 pb-6 bg-black">
        <View className="flex-1 flex-row items-center bg-[#1C1C1E] rounded-[30px] px-3 py-1.5 min-h-[48px]">
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
            <>
              <TouchableOpacity 
                onPress={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className="p-1.5"
              >
                <Ionicons 
                  name={isEmojiPickerOpen ? "keyboard-outline" : "happy-outline"} 
                  size={26} 
                  color="#A1A1AA" 
                />
              </TouchableOpacity>

              <TextInput 
                ref={inputRef}
                placeholder="Message..." 
                placeholderTextColor="#71717A"
                value={message}
                onChangeText={setMessage}
                multiline
                className="flex-1 text-white px-2 font-rubik-regular text-[16px] max-h-32"
                selectionColor="#8b5cf6"
                onFocus={() => setIsEmojiPickerOpen(false)}
              />

              <View className="flex-row items-center gap-1">
                <TouchableOpacity onPress={handleAttachPress} className="p-1.5">
                  <Ionicons name="attach" size={28} color="#A1A1AA" style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={takePhoto} className="p-1.5">
                  <Ionicons name="camera-outline" size={26} color="#A1A1AA" />
                </TouchableOpacity>
              </View>
            </>
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
            colors={['#A855F7', '#7C3AED']}
            className="w-[48px] h-[48px] rounded-full items-center justify-center shadow-lg"
          >
            <Ionicons 
              name={(!isTyping && !hasAudio) ? "mic" : "paper-plane"} 
              size={22} 
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
