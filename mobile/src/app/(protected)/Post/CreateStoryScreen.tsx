import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { mediaService } from '@/services/mediaService';
import { wieUserService } from '@/services/wieUserService';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, withRepeat, withTiming, withSequence, interpolate, useAnimatedReaction, cancelAnimation } from 'react-native-reanimated';
import { useToast } from '@/context/ToastContext';

const { width, height } = Dimensions.get('window');
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedText = Animated.createAnimatedComponent(Text);

// --- ADJUSTABLE BACKGROUND COMPONENT ---
const AdjustableBackground = ({ children, transformState, onTransformEnd }: { children: React.ReactNode, transformState: any, onTransformEnd: (state: any) => void }) => {
  const translateX = useSharedValue(transformState?.translateX || 0);
  const translateY = useSharedValue(transformState?.translateY || 0);
  const scale = useSharedValue(transformState?.scale || 1);
  const rotate = useSharedValue(transformState?.rotate || 0);

  // Sync when prop changes (Undo/Redo)
  useEffect(() => {
    if (transformState) {
      translateX.value = withSpring(transformState.translateX);
      translateY.value = withSpring(transformState.translateY);
      scale.value = withSpring(transformState.scale);
      rotate.value = withSpring(transformState.rotate);
    }
  }, [transformState]);

  const context = useSharedValue({ x: 0, y: 0 });
  const startScale = useSharedValue(1);
  const startRotate = useSharedValue(0);

  const handleEnd = () => {
    runOnJS(onTransformEnd)({
      translateX: translateX.value,
      translateY: translateY.value,
      scale: scale.value,
      rotate: rotate.value,
    });
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;
    })
    .onEnd(handleEnd);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = startScale.value * event.scale;
    })
    .onEnd(handleEnd);

  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      startRotate.value = rotate.value;
    })
    .onUpdate((event) => {
      rotate.value = startRotate.value + event.rotation;
    })
    .onEnd(handleEnd);

  const composedGesture = Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotateGesture));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}rad` },
      ],
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

// --- DRAGGABLE STICKER COMPONENT ---
const DraggableSticker = ({ children, onDelete, isDragging, deleteActive }: any) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const context = useSharedValue({ x: 0, y: 0 });
  const startScale = useSharedValue(1);
  const startRotate = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value };
      if (isDragging) isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;

      // Check for delete zone (bottom center)
      const centerX = width / 2;
      const centerY = height - 160; 
      const dist = Math.sqrt(Math.pow(event.absoluteX - centerX, 2) + Math.pow(event.absoluteY - centerY, 2));
      
      if (deleteActive) {
        if (dist < 100) { 
          deleteActive.value = true;
        } else {
          deleteActive.value = false;
        }
      }
    })
    .onEnd(() => {
      if (deleteActive && deleteActive.value) {
        runOnJS(onDelete)();
      }
      if (isDragging) isDragging.value = false;
      if (deleteActive) deleteActive.value = false;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = startScale.value * event.scale;
    });

  const rotateGesture = Gesture.Rotation()
    .onStart(() => {
      startRotate.value = rotate.value;
    })
    .onUpdate((event) => {
      rotate.value = startRotate.value + event.rotation;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, Gesture.Simultaneous(pinchGesture, rotateGesture));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}rad` },
      ],
      zIndex: isDragging.value ? 1000 : 10,
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ position: 'absolute' }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

// --- DELETE ZONE COMPONENT ---
const DeleteZone = ({ isDragging, deleteActive }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(isDragging.value ? 0 : 300) }],
      opacity: withSpring(isDragging.value ? 1 : 0),
    };
  });

  const circleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(deleteActive.value ? 1.4 : 1) }],
      backgroundColor: withSpring(deleteActive.value ? 'rgba(255, 59, 48, 0.5)' : 'rgba(255, 255, 255, 0.1)'),
      borderColor: withSpring(deleteActive.value ? '#ff3b30' : 'rgba(255, 255, 255, 0.5)'),
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(deleteActive.value ? 0.4 : 1),
    };
  });

  return (
    <Animated.View 
      className="absolute bottom-32 self-center z-[100] items-center"
      style={animatedStyle}
      pointerEvents="none"
    >
      <Animated.Text className="text-white text-lg font-bold mb-5 tracking-wide" style={textStyle}>
        Drag to Delete
      </Animated.Text>
      <Animated.View 
        style={circleStyle}
        className="w-16 h-16 rounded-full items-center justify-center border-2 shadow-2xl"
      >
        <Ionicons name="trash-outline" size={32} color="white" />
      </Animated.View>
    </Animated.View>
  );
};

const CreateStoryScreen = () => {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  // --- STATE ---
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'none' | 'music' | 'music_trimmer' | 'stickers' | 'text' | 'location' | 'mention' | 'options' | 'ai_label' | 'filters'>('none');
  const [activeFilterCategory, setActiveFilterCategory] = useState('Patterns');
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedFont, setSelectedFont] = useState('SF Pro');
  const [textAlign, setTextAlign] = useState<'center' | 'left' | 'right'>('center');
  const [hasTextBackground, setHasTextBackground] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState('None');
  const [selectedAnimation, setSelectedAnimation] = useState('None');
  const [activeTextTool, setActiveTextTool] = useState<'font' | 'color' | 'effects' | 'animations' | 'none'>('font');
  const [selectedSticker, setSelectedSticker] = useState<any | null>(null);
  const [stickers, setStickers] = useState<any[]>([]);
  const [isLoadingStickers, setIsLoadingStickers] = useState(false);
  const [stickerSearch, setStickerSearch] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [musicSearch, setMusicSearch] = useState('');
  const [musicTab, setMusicTab] = useState<'for_you' | 'trending' | 'liked'>('for_you');
  const [isAiLabelEnabled, setIsAiLabelEnabled] = useState(false);
  const [isCommentingEnabled, setIsCommentingEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [musicDuration, setMusicDuration] = useState(15);
  const [musicStartTime, setMusicStartTime] = useState(0);

  // Undo/Redo State
  const initialTransform = { translateX: 0, translateY: 0, scale: 1, rotate: 0 };
  const [history, setHistory] = useState<any[]>([initialTransform]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- SHARED VALUES ---
  const isDragging = useSharedValue(false);
  const deleteActive = useSharedValue(false);
  const textAnimationProgress = useSharedValue(0);
  const selectedEffectSV = useSharedValue('None');
  const selectedAnimationSV = useSharedValue('None');
  const textColorSV = useSharedValue('#ffffff');
  const durationScale = useSharedValue(1);
  const bubbleY = useSharedValue(0);
  const trackPanX = useSharedValue(0);
  const trackContextX = useSharedValue(0);

  // --- REFS ---
  const soundRef = React.useRef<Audio.Sound | null>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // --- FUNCTIONS ---
  const fetchUserProfile = async () => {
    try {
      const profile = await wieUserService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMusic = async () => {
    setIsLoadingMusic(true);
    try {
      let response;
      if (musicTab === 'liked') {
        response = await mediaService.getLikedMusic();
      } else {
        response = await mediaService.getMusic({ type: musicTab, search: musicSearch, limit: 20 });
      }

      if (response && response.data) {
        const mappedMusic = response.data.map((item: any) => ({
          id: item.id || item._id || String(item.trackId),
          title: item.title || item.trackName || 'Unknown Title',
          artist: item.artist || item.artistName || 'Unknown Artist',
          duration: item.duration || '0:00',
          cover: item.coverUrl || item.albumArt || item.artworkUrl100 || item.thumbnail || 'https://i.pravatar.cc/150?u=music',
          audioUrl: item.audioUrl || item.previewUrl || item.url,
          isLiked: item.isLiked || musicTab === 'liked'
        }));
        setSongs(mappedMusic);
      } else {
        setSongs([]);
      }
    } catch (error: any) {
      console.error("Music fetch error:", error);
      setSongs([]);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const handleTransformEnd = (newState: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleDraw = () => {
    showToast({ message: 'Drawing tool activated.', type: 'info' });
  };

  const handleSave = () => {
    showToast({ message: 'Story saved to gallery!', type: 'success' });
  };

  const toggleCommenting = () => {
    setIsCommentingEnabled(!isCommentingEnabled);
    showToast({ message: !isCommentingEnabled ? 'Commenting turned on' : 'Commenting turned off', type: 'info' });
  };

  const toggleMention = (user: any) => {
    const exists = selectedMentions.find(m => m.id === user.id);
    if (exists) {
      setSelectedMentions(selectedMentions.filter(m => m.id !== user.id));
    } else {
      setSelectedMentions([...selectedMentions, user]);
    }
  };

  const handlePlayPause = async (track: any) => {
    try {
      if (playingSongId === track.id) {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) await soundRef.current.pauseAsync();
        }
        setPlayingSongId(null);
      } else {
        if (soundRef.current) {
          try {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) await soundRef.current.unloadAsync();
          } catch (e) {}
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { shouldPlay: true, isLooping: true }
        );
        soundRef.current = sound;
        setPlayingSongId(track.id);
        
        sound.setOnPlaybackStatusUpdate((status) => {
           if (status.isLoaded && status.didJustFinish) sound.replayAsync();
        });
      }
    } catch (error) {
      console.log("Audio playback note:", error);
    }
  };

  const handleShare = async () => {
    if (!imageUri) {
      showToast({ message: 'No image selected', type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'story.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore
      formData.append('media', {
       uri: imageUri,
       name: filename,
       type: type,
      } as any);

      formData.append('caption', text || '');
      formData.append('visibility', 'public');

      await mediaService.createFlux(formData);

      showToast({ message: "Flux shared successfully!", type: 'success' });
      router.replace('/(tabs)');
      } catch (error: any) {
      showToast({ message: error.message || "Failed to share flux", type: 'error' });
      }
 finally {
      setIsUploading(false);
    }
  };

  const fetchStickers = async (query: string = '') => {
    setIsLoadingStickers(true);
    try {
      const response = query 
        ? await mediaService.searchStickers(query) 
        : await mediaService.getTrendingStickers();
      
      if (response && response.stickers) {
        setStickers(response.stickers);
      } else {
        setStickers([]);
      }
    } catch (error) {
      console.error('Error fetching stickers:', error);
      setStickers([]);
    } finally {
      setIsLoadingStickers(false);
    }
  };

  const fetchLocations = async (query: string = '') => {
    if (query.length < 2) {
      setLocations([
        { name: 'Vismaya Cinemas, Perinthalmanna', placeId: '1' },
        { name: 'Plaza Movies, Perinthalmanna', placeId: '2' },
        { name: 'Parambikkulam Tiger Reserve', placeId: '3' },
        { name: 'Nagarhole Tiger Reserve', placeId: '4' },
        { name: 'Kabani Tiger Reserve', placeId: '5' },
        { name: 'Periyar Tiger Reserve', placeId: '6' },
      ]);
      setIsLoadingLocations(false);
      return;
    }
    setIsLoadingLocations(true);
    try {
      const response = await mediaService.searchLocations(query);
      if (response && response.success) {
        setLocations(response.data || []);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const fetchUsers = async (query: string = '') => {
    if (!query) {
      setUserResults([]);
      setIsLoadingUsers(false);
      return;
    }
    setIsLoadingUsers(true);
    try {
      const results = await wieUserService.searchUsers(query);
      setUserResults(results || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUserResults([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'stickers') {
      fetchStickers(stickerSearch);
    }
  }, [activeTab, stickerSearch]);

  useEffect(() => {
    if (activeTab === 'location') {
      const delayDebounceFn = setTimeout(() => {
        fetchLocations(locationSearch);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [activeTab, locationSearch]);

  useEffect(() => {
    if (activeTab === 'mention') {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers(userSearch);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [activeTab, userSearch]);

  useEffect(() => {
    selectedEffectSV.value = selectedEffect;
    selectedAnimationSV.value = selectedAnimation;
    textColorSV.value = textColor;
  }, [selectedEffect, selectedAnimation, textColor]);

  useEffect(() => {
    if (selectedEffect !== 'None' || selectedAnimation !== 'None') {
      cancelAnimation(textAnimationProgress);
      textAnimationProgress.value = 0;
      textAnimationProgress.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      cancelAnimation(textAnimationProgress);
      textAnimationProgress.value = 0;
    }
  }, [selectedEffect, selectedAnimation]);

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'music') {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        fetchMusic();
      }, 500);
    }
  }, [activeTab, musicTab, musicSearch]);

  // --- ANIMATED STYLES ---
  const animatedTextStyle = useAnimatedStyle(() => {
    let transform: any[] = [];
    let opacity = 1;
    let textShadowRadius = 0;
    let textShadowOffset = { width: 0, height: 0 };
    let textShadowColor = 'transparent';

    const effect = selectedEffectSV.value;
    const anim = selectedAnimationSV.value;
    const progress = textAnimationProgress.value;

    // Effects logic (using directions from icons)
    if (effect === 'Left') {
      transform.push({ translateX: interpolate(progress, [0, 1], [-15, 15]) });
      textShadowColor = 'rgba(0, 0, 0, 0.5)';
      textShadowOffset = { width: -3, height: 0 };
      textShadowRadius = 10;
    } else if (effect === 'Right') {
      transform.push({ translateX: interpolate(progress, [0, 1], [15, -15]) });
      textShadowColor = 'rgba(0, 0, 0, 0.5)';
      textShadowOffset = { width: 3, height: 0 };
      textShadowRadius = 10;
    } else if (effect === 'Top') {
      transform.push({ translateY: interpolate(progress, [0, 1], [-15, 15]) });
      textShadowColor = 'rgba(0, 0, 0, 0.5)';
      textShadowOffset = { width: 0, height: -3 };
      textShadowRadius = 10;
    } else if (effect === 'Bottom') {
      transform.push({ translateY: interpolate(progress, [0, 1], [15, -15]) });
      textShadowColor = 'rgba(0, 0, 0, 0.5)';
      textShadowOffset = { width: 0, height: 3 };
      textShadowRadius = 10;
    }

    // Animations logic
    if (anim === 'Faded') {
      opacity = interpolate(progress, [0, 1], [0.3, 1]);
    } else if (anim === 'Shine') {
      textShadowColor = textColorSV.value;
      textShadowRadius = interpolate(progress, [0, 1], [2, 30]);
    } else if (anim === 'Multiple') {
      transform.push({ scale: interpolate(progress, [0, 1], [1, 1.15]) });
      transform.push({ rotate: `${interpolate(progress, [0, 1], [-0.08, 0.08])}rad` });
      textShadowColor = 'rgba(255,255,255,0.4)';
      textShadowRadius = 15;
    }

    return {
      transform: transform.length > 0 ? transform : undefined,
      opacity,
      textShadowRadius,
      textShadowOffset,
      textShadowColor,
    };
  });

  const animatedBubbleStyle = useAnimatedStyle(() => {
     return {
       transform: [
         { scale: durationScale.value },
         { translateY: bubbleY.value }
       ]
     };
  });

  const animatedTrackStyle = useAnimatedStyle(() => {
     return { transform: [{ translateX: trackPanX.value }] };
  });

  // --- GESTURES ---
  const durationGesture = Gesture.Pan()
    .onStart(() => {
       durationScale.value = withSpring(1.2);
    })
    .onUpdate((event) => {
       bubbleY.value = event.translationY;
    })
    .onEnd((event) => {
       durationScale.value = withSpring(1);
       bubbleY.value = withSpring(0);
       
       const change = Math.round(event.translationY / -10);
       runOnJS(setMusicDuration)(Math.min(60, Math.max(5, musicDuration + change)));
    });

  const trackGesture = Gesture.Pan()
    .onStart(() => {
       trackContextX.value = trackPanX.value;
    })
    .onUpdate((event) => {
       trackPanX.value = Math.max(-200, Math.min(200, trackContextX.value + event.translationX));
    })
    .onEnd(() => {
       runOnJS(setMusicStartTime)(Math.abs(trackPanX.value));
    });

  // --- CONSTANTS ---
  const FILTER_CATEGORIES = ['Patterns', 'Colours', 'Gradient', 'Gradient', 'Gradient'];
  const MOCK_FILTERS = [
    { id: 0, type: 'none' },
    { id: 1, type: 'gradient', colors: ['#8B5CF6', '#D946EF'] },
    { id: 2, type: 'gradient', colors: ['#3B82F6', '#2DD4BF'] },
    { id: 3, type: 'gradient', colors: ['#F59E0B', '#EF4444'] },
    { id: 4, type: 'gradient', colors: ['#10B981', '#3B82F6'] },
  ];

  const renderSideButton = (icon: any, tab: any, type: 'ionic' | 'material' | 'community' = 'ionic') => (
    <TouchableOpacity 
      onPress={() => setActiveTab(tab)}
      className="items-center mb-5"
    >
      <View className="w-12 h-12 items-center justify-center bg-black/30 rounded-full border border-white/5">
        {type === 'ionic' && <Ionicons name={icon} size={24} color="white" />}
        {type === 'material' && <MaterialIcons name={icon} size={24} color="white" />}
        {type === 'community' && <MaterialCommunityIcons name={icon} size={24} color="white" />}
      </View>
    </TouchableOpacity>
  );

  const renderMusicSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] min-h-[75%] p-6 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-6">Choose song</Text>
          <View className="flex-row items-center bg-zinc-800/60 rounded-2xl px-4 py-4 mb-6">
            <Ionicons name="search" size={22} color="#888" />
            <TextInput placeholder="Search your songs..." placeholderTextColor="#888" className="flex-1 text-white ml-2 text-base" value={musicSearch} onChangeText={setMusicSearch} />
          </View>
          <View className="flex-row justify-center mb-8">
            {['For you', 'Trending', 'Liked'].map((tab) => {
              const tabId = tab.toLowerCase().replace(' ', '_') as any;
              return (
                <TouchableOpacity key={tab} onPress={() => setMusicTab(tabId)} className={`px-8 py-2.5 rounded-full mx-1.5 ${musicTab === tabId ? 'bg-zinc-700' : ''}`}>
                  <Text className={`font-bold text-base ${musicTab === tabId ? 'text-white' : 'text-gray-400'}`}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {songs.length === 0 ? (
              <View className="items-center justify-center py-10">
                {isLoadingMusic ? <ActivityIndicator size="large" color="white" /> : (
                  <>
                    <Ionicons name="musical-notes-outline" size={48} color="#555" />
                    <Text className="text-gray-500 mt-4 text-center">No music found.</Text>
                  </>
                )}
              </View>
            ) : (
              songs.map((song) => (
                <TouchableOpacity key={song.id} onPress={() => { setSelectedSong(song); setActiveTab('music_trimmer'); }} className="flex-row items-center justify-between mb-6 p-2 rounded-2xl">
                  <View className="flex-row items-center flex-1">
                    <View className="relative">
                      <Image source={{ uri: song.cover }} className="w-16 h-16 rounded-2xl" />
                      <TouchableOpacity 
                        onPress={(e) => { e.stopPropagation(); handlePlayPause(song); }}
                        className="absolute inset-0 items-center justify-center bg-black/20 rounded-2xl"
                      >
                        <Ionicons 
                          name={playingSongId === song.id ? "pause" : "play"} 
                          size={24} 
                          color="white" 
                        />
                      </TouchableOpacity>
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-white font-bold text-lg" numberOfLines={1}>{song.title}</Text>
                      <Text className="text-gray-400 text-sm mt-0.5">{song.artist} • {song.duration}</Text>
                    </View>
                  </View>
                  <TouchableOpacity className="p-2">
                    <Ionicons name={song.isLiked ? "heart" : "heart-outline"} size={26} color={song.isLiked ? "#3b82f6" : "white"} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderStickerSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] min-h-[55%] p-6 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Choose a sticker</Text>
          <View className="flex-row items-center bg-zinc-800/60 rounded-2xl px-4 py-4 mb-6">
            <Ionicons name="search" size={22} color="#888" />
            <TextInput 
              placeholder="Search your stickers..." 
              placeholderTextColor="#888" 
              className="flex-1 text-white ml-2 text-base" 
              value={stickerSearch}
              onChangeText={setStickerSearch}
            />
          </View>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {isLoadingStickers ? (
              <View className="w-full items-center justify-center py-10">
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : stickers.length === 0 ? (
              <View className="w-full items-center justify-center py-10">
                <Text className="text-gray-500">No stickers found.</Text>
              </View>
            ) : (
              stickers.map((sticker, index) => (
                <TouchableOpacity 
                  key={sticker.id || index} 
                  onPress={() => { setSelectedSticker(sticker); onClose(); }}
                  className="w-[22%] aspect-square items-center justify-center bg-zinc-800/40 rounded-3xl mb-4"
                >
                  <Image source={{ uri: sticker.url }} className="w-16 h-16" resizeMode="contain" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderTextEditor = (onClose: () => void) => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
      style={[StyleSheet.absoluteFill, { zIndex: 100 }]} 
      className="bg-black/60"
      keyboardVerticalOffset={Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0}
    >
      <SafeAreaView className="flex-1">
        {/* Top Bar */}
          <View className="flex-row items-center justify-between px-4 py-4">
            <TouchableOpacity onPress={onClose} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-x-2">
              <TouchableOpacity onPress={() => setActiveTab('mention')} className="flex-row items-center bg-black/40 px-4 h-12 rounded-full border border-white/10">
                <MaterialCommunityIcons name="at" size={20} color="white" />
                <Text className="text-white font-bold ml-1.5 text-sm">Mention</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('location')} className="flex-row items-center bg-black/40 px-4 h-12 rounded-full border border-white/10">
                <Ionicons name="location-outline" size={20} color="white" />
                <Text className="text-white font-bold ml-1.5 text-sm">Location</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {}} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
                <Ionicons name="ellipsis-horizontal" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content Area (Input + Slider) */}
          <View className="flex-1 flex-row">
            {/* Left Vertical Slider Placeholder */}
            <View className="w-12 items-center justify-center py-10">
               <View className="w-1 h-64 bg-white/30 rounded-full items-center">
                  <View className="w-5 h-5 bg-white rounded-full absolute top-[40%] -mt-2.5 shadow-md" />
               </View>
            </View>

          {/* Text Input */}
          <View className="flex-1 justify-center pr-12">
            <AnimatedTextInput 
              autoFocus 
              multiline 
              value={text} 
              onChangeText={setText} 
              placeholder="Type something..." 
              placeholderTextColor="#ffffff80" 
              style={[
                { 
                  color: textColor, 
                  textAlign: textAlign, 
                  backgroundColor: hasTextBackground ? 'rgba(0,0,0,0.6)' : 'transparent',
                  borderRadius: 15,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  fontFamily: selectedFont === 'SF Pro' ? undefined : selectedFont,
                },
                animatedTextStyle
              ]}
              className="text-5xl font-bold w-full" 
            />
          </View>
        </View>

        {/* Bottom Tools (Keyboard attached) */}
        <View className="pb-2">
           {/* Dynamic Tool Rows */}
           {activeTextTool === 'font' && (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 pl-4">
               {[
                 { label: 'Classic', family: 'SF Pro', icon: 'text' },
                 { label: 'Modern', family: 'Roboto', icon: 'flash' },
                 { label: 'Brush', family: 'Road Rage', icon: 'brush' },
                 { label: 'Strong', family: 'Inter', icon: 'barbell' },
                 { label: 'Serif', family: 'Serif', icon: 'print' },
               ].map((f) => (
                 <TouchableOpacity 
                   key={f.label} 
                   onPress={() => setSelectedFont(f.family)}
                   className={`h-12 flex-row items-center px-6 rounded-full mr-3 border ${selectedFont === f.family ? 'border-white bg-black/60' : 'border-white/20 bg-black/40'}`}
                 >
                   <Ionicons name={f.icon as any} size={18} color="white" />
                   <Text className="text-white font-bold text-sm ml-2">{f.label}</Text>
                 </TouchableOpacity>
               ))}<View className="w-4" />
             </ScrollView>
           )}

           {activeTextTool === 'color' && (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 pl-4">
               <TouchableOpacity className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3 border border-white/20">
                  <Ionicons name="eyedropper-outline" size={18} color="white" />
               </TouchableOpacity>
               {['#FF0000', '#3B82F6', '#10B981', '#FBBF24', '#F472B6', '#8B5CF6', '#ffffff', '#000000'].map((c) => (
                 <TouchableOpacity 
                   key={c} 
                   onPress={() => setTextColor(c)}
                   style={{ backgroundColor: c }}
                   className={`w-10 h-10 rounded-full mr-3 border-2 ${textColor === c ? 'border-white' : 'border-transparent'}`}
                 />
               ))}<View className="w-4" />
             </ScrollView>
           )}

           {activeTextTool === 'effects' && (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 pl-4">
               {[
                 { label: 'None', icon: 'circle-off-outline' },
                 { label: 'Left', icon: 'format-horizontal-align-left' },
                 { label: 'Right', icon: 'format-horizontal-align-right' },
                 { label: 'Top', icon: 'format-vertical-align-top' },
                 { label: 'Bottom', icon: 'format-vertical-align-bottom' },
               ].map((e) => (
                 <TouchableOpacity 
                   key={e.label} 
                   onPress={() => setSelectedEffect(e.label)}
                   className={`h-12 flex-row items-center px-6 rounded-full mr-3 border ${selectedEffect === e.label ? 'border-white bg-black/60' : 'border-white/20 bg-black/40'}`}
                 >
                   <MaterialCommunityIcons name={e.icon as any} size={20} color="white" />
                   <Text className="text-white font-bold text-sm ml-2">{e.label}</Text>
                 </TouchableOpacity>
               ))}<View className="w-4" />
             </ScrollView>
           )}

           {activeTextTool === 'animations' && (
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 pl-4">
               {[
                 { label: 'None', icon: 'circle-off-outline' },
                 { label: 'Shine', icon: 'auto-fix' },
                 { label: 'Multiple', icon: 'layers-outline' },
                 { label: 'Faded', icon: 'contrast-circle' },
               ].map((a) => (
                 <TouchableOpacity 
                   key={a.label} 
                   onPress={() => setSelectedAnimation(a.label)}
                   className={`h-12 flex-row items-center px-6 rounded-full mr-3 border ${selectedAnimation === a.label ? 'border-white bg-black/60' : 'border-white/20 bg-black/40'}`}
                 >
                   <MaterialCommunityIcons name={a.icon as any} size={20} color="white" />
                   <Text className="text-white font-bold text-sm ml-2">{a.label}</Text>
                 </TouchableOpacity>
               ))}<View className="w-4" />
             </ScrollView>
           )}
           
           {/* Styling Toolbar */}
           <View className="bg-[#2A2A2A] mx-4 h-14 rounded-full flex-row items-center justify-between px-2 border border-white/5 mb-2 shadow-xl">
             <TouchableOpacity 
               onPress={() => setActiveTextTool(activeTextTool === 'font' ? 'none' : 'font')}
               className={`w-10 h-10 items-center justify-center rounded-full ${activeTextTool === 'font' ? 'bg-white/20' : 'bg-transparent'}`}
             >
                <MaterialCommunityIcons name="format-text" size={20} color="white" />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setActiveTextTool(activeTextTool === 'color' ? 'none' : 'color')}
               className={`w-8 h-8 rounded-full overflow-hidden border-2 ${activeTextTool === 'color' ? 'border-white' : 'border-transparent'}`}
             >
                <LinearGradient colors={['#FF0000', '#00FF00', '#0000FF']} start={{x:0, y:0}} end={{x:1, y:1}} className="flex-1" />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setActiveTextTool(activeTextTool === 'effects' ? 'none' : 'effects')}
               className={`w-10 h-10 items-center justify-center rounded-full ${activeTextTool === 'effects' ? 'bg-white/20' : 'bg-transparent'}`}
             >
                <Ionicons name="color-filter-outline" size={22} color="white" />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setActiveTextTool(activeTextTool === 'animations' ? 'none' : 'animations')}
               className={`w-10 h-10 items-center justify-center rounded-full ${activeTextTool === 'animations' ? 'bg-white/20' : 'bg-transparent'}`}
             >
                <Ionicons name="sparkles-outline" size={22} color="white" />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setTextAlign(textAlign === 'center' ? 'left' : textAlign === 'left' ? 'right' : 'center')}
               className="w-10 h-10 items-center justify-center"
             >
                <MaterialCommunityIcons 
                  name={textAlign === 'center' ? "format-align-center" : textAlign === 'left' ? "format-align-left" : "format-align-right"} 
                  size={22} 
                  color="white" 
                />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setHasTextBackground(!hasTextBackground)}
               className={`w-8 h-8 items-center justify-center rounded-lg mx-1 ${hasTextBackground ? 'bg-white' : 'bg-white/20'}`}
             >
                <Text className={`font-bold ${hasTextBackground ? 'text-black' : 'text-white'}`}>T</Text>
             </TouchableOpacity>
           </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );

  const renderLocationSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[110]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <View style={StyleSheet.absoluteFill} className="bg-black/40" />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <BlurView intensity={90} tint="dark" className="rounded-t-[40px] min-h-[85%] border-t border-white/5 shadow-2xl overflow-hidden">
          <View className="p-6 flex-1">
            <View className="w-12 h-1.5 bg-white/20 self-center rounded-full mb-8" />
            <Text className="text-white text-xl font-bold text-center mb-8 tracking-tight">Add location</Text>
            
            <View className="flex-row items-center bg-white/5 rounded-[18px] px-5 py-4 mb-10">
              <Ionicons name="search" size={22} color="#666" />
              <TextInput 
                placeholder="Search your location" 
                placeholderTextColor="#666" 
                className="flex-1 text-white ml-3 text-lg font-medium" 
                value={locationSearch}
                onChangeText={setLocationSearch}
                autoFocus={false}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {isLoadingLocations ? (
                <View className="mt-20">
                  <ActivityIndicator size="large" color="white" />
                </View>
              ) : locations.length === 0 ? (
                <View className="mt-20">
                  <Text className="text-gray-500 text-center text-lg">No locations found</Text>
                </View>
              ) : (
                locations.map((loc, i) => (
                  <TouchableOpacity 
                    key={loc.place_id || i} 
                    onPress={() => { setSelectedLocation(loc.display_name); onClose(); }}
                    className="py-5"
                  >
                    <Text className="text-white text-lg font-medium tracking-tight">
                      {loc.display_name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <View className="h-20" />
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </View>
  );

  const renderMentionSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[110]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <View style={StyleSheet.absoluteFill} className="bg-black/40" />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <BlurView intensity={90} tint="dark" className="rounded-t-[40px] min-h-[85%] border-t border-white/5 shadow-2xl overflow-hidden">
          <View className="p-6 flex-1">
            <View className="w-12 h-1.5 bg-white/20 self-center rounded-full mb-8" />
            <Text className="text-white text-xl font-bold text-center mb-8 tracking-tight">Add mentions</Text>
            
            {selectedMentions.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0 mb-8">
                {selectedMentions.map((user) => (
                  <View key={user.id} className="mr-5 items-center w-16">
                      <View className="relative">
                        <Image source={{ uri: user.profile_picture || 'https://i.pravatar.cc/150?u=' + user.id }} className="w-16 h-16 rounded-full border border-white/10" />
                        <TouchableOpacity 
                          onPress={() => toggleMention(user)}
                          className="absolute top-0 -right-1 bg-white rounded-full w-6 h-6 items-center justify-center shadow-lg"
                        >
                           <Ionicons name="close" size={14} color="black" />
                        </TouchableOpacity>
                      </View>
                      <Text className="text-white text-[11px] mt-2 font-medium text-center" numberOfLines={1}>{user.username}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View className="flex-row items-center bg-white/5 rounded-[18px] px-5 py-4 mb-8">
              <Ionicons name="search" size={22} color="#666" />
              <TextInput 
                placeholder="Search here..." 
                placeholderTextColor="#666" 
                className="flex-1 text-white ml-3 text-lg font-medium" 
                value={userSearch}
                onChangeText={setUserSearch}
                autoFocus={false}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {isLoadingUsers ? (
                <View className="mt-20">
                  <ActivityIndicator size="large" color="white" />
                </View>
              ) : userResults.length === 0 ? (
                <View className="mt-20">
                  <Text className="text-gray-500 text-center text-lg">No users found</Text>
                </View>
              ) : (
                userResults.map((user) => {
                  const isSelected = selectedMentions.find(m => m.id === user.id);
                  return (
                    <TouchableOpacity 
                      key={user.id} 
                      onPress={() => toggleMention(user)}
                      className="flex-row items-center justify-between py-4"
                    >
                      <View className="flex-row items-center flex-1">
                        <Image source={{ uri: user.profile_picture || 'https://i.pravatar.cc/150?u=' + user.id }} className="w-14 h-14 rounded-full" />
                        <View className="ml-4 flex-1">
                          <Text className="text-white font-bold text-lg">{user.name || user.username}</Text>
                          <Text className="text-gray-400 text-base">{user.username}</Text>
                        </View>
                      </View>
                      <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-white/20'}`}>
                        {isSelected && <Ionicons name="checkmark" size={20} color="black" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
              <View className="h-20" />
            </ScrollView>
            
            <TouchableOpacity 
              onPress={onClose}
              className="mt-4 bg-white py-4 rounded-[28px]"
            >
              <Text className="text-black text-center font-bold text-lg">Done</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );

  const renderAiLabelSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] p-8 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <View className="items-center mb-8">
            <Text className="text-white text-2xl font-bold mb-4">AI label</Text>
            <Text className="text-gray-400 text-center text-base px-6 leading-6">
              We require you to label certain realistic content that's made with AI. <Text className="text-blue-400 font-bold">Learn more</Text>
            </Text>
          </View>
          <View className="flex-row items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/5">
            <Text className="text-white text-lg font-bold">Add AI Label</Text>
            <TouchableOpacity 
              onPress={() => setIsAiLabelEnabled(!isAiLabelEnabled)}
              className={`w-14 h-8 rounded-full px-1 justify-center ${isAiLabelEnabled ? 'bg-blue-500 items-end' : 'bg-zinc-700 items-start'}`}
            >
              <View className="w-6 h-6 bg-white rounded-full shadow-sm" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} className="mt-10 bg-white py-4 rounded-3xl">
            <Text className="text-black text-center font-bold text-lg">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderOptionsMenu = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill} />
      <View className="absolute top-20 right-4 w-64 bg-zinc-900/98 rounded-3xl p-2 border border-white/10 shadow-2xl overflow-hidden">
         {[
           { label: 'Draw', icon: 'brush-outline', action: () => { handleDraw(); } },
           { label: 'AI label', icon: 'sparkles-outline', action: () => { setActiveTab('ai_label'); } },
           { label: 'Turn off commenting', icon: 'chatbox-outline', action: () => { toggleCommenting(); } },
           { label: 'Save', icon: 'download-outline', action: () => { handleSave(); } },
         ].map((item, i) => (
           <TouchableOpacity 
             key={i} 
             onPress={() => { item.action(); if (item.label !== 'AI label') onClose(); }}
             className="flex-row items-center px-5 py-4 border-b border-white/5 last:border-0"
           >
             <Ionicons name={item.icon as any} size={24} color="white" />
             <Text className="text-white ml-4 font-bold text-base">{item.label}</Text>
           </TouchableOpacity>
         ))}
      </View>
    </View>
  );

  const renderMusicTrimmer = () => {
    if (!selectedSong) return null;
    return (
      <View style={StyleSheet.absoluteFill} className="z-[80] bg-black/60">
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-end px-4 py-4">
            <TouchableOpacity onPress={() => setActiveTab('none')} className="bg-white px-8 py-2 rounded-full">
              <Text className="font-bold text-black text-base">Done</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 justify-end pb-40">
            <View className="bg-[#1C2024] p-6 rounded-[32px] border border-white/10 shadow-2xl mx-4">
              <View className="flex-row items-center mb-6">
                <Image source={{ uri: selectedSong.cover }} className="w-14 h-14 rounded-2xl" />
                <View className="ml-4 flex-1">
                  <Text className="text-white font-bold text-lg" numberOfLines={1}>{selectedSong.title}</Text>
                  <Text className="text-gray-400 text-sm mt-0.5">{selectedSong.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => { setSelectedSong(null); setActiveTab('none'); }} className="bg-white/10 p-2.5 rounded-full">
                  <Ionicons name="trash-outline" size={22} color="white" />
                </TouchableOpacity>
              </View>

              {/* Duration Bubble */}
              <View className="items-center mb-8">
                <GestureDetector gesture={durationGesture}>
                   <Animated.View style={animatedBubbleStyle} className="bg-white w-20 h-20 rounded-full items-center justify-center shadow-xl">
                      <Text className="text-black font-bold text-2xl">{musicDuration}</Text>
                      <Text className="text-gray-500 font-bold text-xs -mt-1">SEC</Text>
                      <View className="absolute -top-3"><Ionicons name="chevron-up" size={16} color="white" /></View>
                      <View className="absolute -bottom-3"><Ionicons name="chevron-down" size={16} color="white" /></View>
                   </Animated.View>
                </GestureDetector>
                <Text className="text-gray-400 text-xs mt-4">Swipe up/down to adjust</Text>
              </View>

              {/* Draggable Waveform Track */}
              <GestureDetector gesture={trackGesture}>
                <View className="h-16 overflow-hidden bg-black/20 rounded-2xl relative border border-white/5 justify-center">
                  <Animated.View style={animatedTrackStyle} className="flex-row items-center px-4 w-[200%]">
                    {Array.from({ length: 100 }).map((_, i) => {
                       const isPopular = i > 40 && i < 60; // Simulate popular section
                       return (
                         <View 
                           key={i} 
                           style={{ 
                             height: Math.random() * 40 + 10, 
                             width: 4, 
                             backgroundColor: isPopular ? '#D946EF' : '#555', 
                             borderRadius: 2,
                             marginHorizontal: 2
                           }} 
                         />
                       );
                    })}
                  </Animated.View>
                  
                  {/* Selection Highlight Window */}
                  <View pointerEvents="none" className="absolute top-0 bottom-0 self-center border-2 border-white bg-white/10 rounded-xl" style={{ width: (musicDuration / 60) * 100 + '%' }} />
                </View>
              </GestureDetector>

            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black overflow-hidden">
      <StatusBar barStyle="light-content" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Media Card */}
        <View className="flex-1 mx-2 mb-6 rounded-[40px] overflow-hidden bg-zinc-900 relative border border-white/5 shadow-2xl">
        {/* Adjustable Background */}
        <View className="absolute inset-0">
          <AdjustableBackground 
            transformState={history[historyIndex]} 
            onTransformEnd={handleTransformEnd}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View className="flex-1 bg-zinc-900" />
            )}
          </AdjustableBackground>

          {/* Filter Overlay */}
          {selectedFilter !== 0 && MOCK_FILTERS[selectedFilter].type === 'gradient' && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}>
              <LinearGradient
                colors={MOCK_FILTERS[selectedFilter].colors as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
          )}
        </View>

        {/* Top/Bottom Protection Gradients */}
        <View pointerEvents="none" className="absolute top-0 w-full h-32">
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} className="flex-1" />
        </View>
        <View pointerEvents="none" className="absolute bottom-0 w-full h-40">
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} className="flex-1" />
        </View>

        <View className="flex-1 px-4 py-4 justify-between" pointerEvents="box-none">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveTab('options')} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
              <Ionicons name="ellipsis-horizontal" size={26} color="white" />
            </TouchableOpacity>
          </View>

          {/* Canvas for Adjustable Stickers */}
          <View style={StyleSheet.absoluteFill} className="items-center justify-center" pointerEvents="box-none">
             {/* Text Sticker */}
             {text && activeTab !== 'text' && (
               <DraggableSticker 
                 onDelete={() => setText('')} 
                 isDragging={isDragging} 
                 deleteActive={deleteActive}
               >
                 <Animated.View 
                   style={[
                     { 
                       backgroundColor: hasTextBackground ? 'rgba(0,0,0,0.6)' : 'transparent',
                       borderRadius: 20,
                       paddingHorizontal: 20,
                       paddingVertical: 10,
                       borderWidth: hasTextBackground ? 1 : 0,
                       borderColor: 'rgba(255,255,255,0.1)'
                     },
                     animatedTextStyle
                   ]}
                   className="shadow-2xl"
                 >
                   <AnimatedText 
                     style={{ 
                        color: textColor, 
                        textAlign: textAlign,
                        fontFamily: selectedFont === 'SF Pro' ? undefined : selectedFont
                     }}
                     className="text-4xl font-bold"
                   >
                     {text}
                   </AnimatedText>
                 </Animated.View>
               </DraggableSticker>
             )}

             {/* Sticker */}
             {selectedSticker && (
                <DraggableSticker 
                  onDelete={() => setSelectedSticker(null)} 
                  isDragging={isDragging} 
                  deleteActive={deleteActive}
                >
                  {typeof selectedSticker === 'string' ? (
                    <Text className="text-8xl">{selectedSticker}</Text>
                  ) : (
                    <Image source={{ uri: selectedSticker.url }} className="w-48 h-48" resizeMode="contain" />
                  )}
                </DraggableSticker>
             )}

             {/* Music Sticker */}
             {selectedSong && activeTab === 'none' && (
                <DraggableSticker 
                  onDelete={() => setSelectedSong(null)} 
                  isDragging={isDragging} 
                  deleteActive={deleteActive}
                >
                  <View className="bg-black/60 p-4 rounded-2xl border border-white/10 flex-row items-center w-64 shadow-2xl">
                    <Image source={{ uri: selectedSong.cover }} className="w-12 h-12 rounded-lg" />
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-bold text-sm" numberOfLines={1}>{selectedSong.title}</Text>
                      <Text className="text-gray-300 text-xs" numberOfLines={1}>{selectedSong.artist}</Text>
                    </View>
                    <Ionicons name="musical-note" size={20} color="white" />
                  </View>
                </DraggableSticker>
             )}

             {/* Location Sticker */}
             {selectedLocation && (
               <DraggableSticker 
                 onDelete={() => setSelectedLocation(null)} 
                 isDragging={isDragging} 
                 deleteActive={deleteActive}
               >
                 <View className="bg-white px-6 py-3 rounded-full flex-row items-center shadow-2xl">
                   <Ionicons name="location" size={20} color="#3B82F6" />
                   <Text className="text-black font-bold ml-2 text-lg">{selectedLocation}</Text>
                 </View>
               </DraggableSticker>
             )}

             {/* Mention Stickers */}
             {selectedMentions.map((user) => (
               <DraggableSticker 
                 key={user.id}
                 onDelete={() => toggleMention(user)} 
                 isDragging={isDragging} 
                 deleteActive={deleteActive}
               >
                 <View className="bg-purple-500 px-6 py-3 rounded-xl flex-row items-center shadow-2xl">
                   <Text className="text-white font-bold text-xl">@{user.username}</Text>
                 </View>
               </DraggableSticker>
             ))}
          </View>

          {/* Delete Zone */}
          <DeleteZone isDragging={isDragging} deleteActive={deleteActive} />

          {/* Center Content / Side Bar */}
          <View className="flex-1 flex-row" pointerEvents="box-none">
            <View className="justify-center">
              {renderSideButton('sticker-emoji', 'stickers', 'community')}
              {renderSideButton('color-filter-outline', 'filters')}
              {renderSideButton('musical-notes', 'music')}
              {renderSideButton('text', 'text')}
            </View>
            <View className="flex-1 items-center justify-center" pointerEvents="none">
               {/* This view is now just a placeholder since stickers are absolute positioned above */}
            </View>

            {/* Right Side Buttons (Undo & Redo) */}
            <View className="justify-end mb-20">
               <TouchableOpacity onPress={handleUndo} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10 mb-4">
                  <Ionicons name="arrow-undo-outline" size={26} color={historyIndex > 0 ? "white" : "gray"} />
               </TouchableOpacity>
               <TouchableOpacity onPress={handleRedo} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
                  <Ionicons name="arrow-redo-outline" size={26} color={historyIndex < history.length - 1 ? "white" : "gray"} />
               </TouchableOpacity>
            </View>
          </View>

          {/* Music Trimmer Overlay */}
          {activeTab === 'music_trimmer' && renderMusicTrimmer()}

          {/* Filter / Pattern Section Overlay */}
          {activeTab === 'filters' && (
            <View className="absolute bottom-28 w-full px-4 z-40">
              <BlurView intensity={20} tint="dark" className="rounded-[32px] overflow-hidden border border-white/10 py-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-5">
                  {FILTER_CATEGORIES.map((cat, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setActiveFilterCategory(cat)}
                      className={`px-5 py-2 rounded-full mr-2 ${activeFilterCategory === cat ? 'bg-white' : 'bg-white/10'}`}
                    >
                      <Text className={`font-bold text-sm ${activeFilterCategory === cat ? 'text-black' : 'text-white'}`}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                  {MOCK_FILTERS.map((filter, i) => (
                    <TouchableOpacity 
                      key={i} 
                      onPress={() => setSelectedFilter(i)}
                      className={`w-16 h-16 rounded-full mr-4 items-center justify-center border-2 ${selectedFilter === i ? 'border-white' : 'border-transparent'}`}
                    >
                      {filter.type === 'none' ? (
                        <View className="w-14 h-14 rounded-full bg-white/10 items-center justify-center">
                          <MaterialCommunityIcons name="slash-forward" size={24} color="white" />
                        </View>
                      ) : (
                        <LinearGradient 
                          colors={filter.colors as any} 
                          className="w-14 h-14 rounded-full"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </BlurView>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Actions Area */}
      <View className="flex-row items-center justify-between px-4 pb-4 gap-x-4">
        <TouchableOpacity className="flex-1 h-14 bg-zinc-900/80 flex-row items-center justify-center rounded-full border border-white/10 shadow-lg">
          <Text className="text-white font-bold text-base" numberOfLines={1}>Close groups</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleShare} 
          disabled={isUploading}
          className="flex-1 h-14 shadow-xl"
        >
          <LinearGradient 
            colors={['#A78BFA', '#7C3AED']} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
            className="flex-row items-center justify-center h-full rounded-full"
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Image 
                  source={{ uri: userProfile?.profile_picture || 'https://i.pravatar.cc/150?u=me' }} 
                  className="w-8 h-8 rounded-full border border-white/30 mr-2" 
                />
                <Text className="text-white font-bold text-base" numberOfLines={1}>Your flux</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </SafeAreaView>

      {/* Overlays / Bottom Sheets */}
      {activeTab === 'music' && renderMusicSheet(() => setActiveTab('none'))}
      {activeTab === 'stickers' && renderStickerSheet(() => setActiveTab('none'))}
      {activeTab === 'text' && renderTextEditor(() => setActiveTab('none'))}
      {activeTab === 'location' && renderLocationSheet(() => setActiveTab('none'))}
      {activeTab === 'mention' && renderMentionSheet(() => setActiveTab('none'))}
      {activeTab === 'options' && renderOptionsMenu(() => setActiveTab('none'))}
      {activeTab === 'ai_label' && renderAiLabelSheet(() => setActiveTab('none'))}

    </View>
  );
};

export default CreateStoryScreen;
