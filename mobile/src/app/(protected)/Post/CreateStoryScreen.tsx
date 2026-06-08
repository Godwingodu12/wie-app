import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { mediaService } from '@/services/mediaService';
import { wieUserService } from '@/services/wieUserService';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useToast } from '@/context/ToastContext';

const { width, height } = Dimensions.get('window');
const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// --- ADJUSTABLE BACKGROUND COMPONENT ---
const AdjustableBackground = ({ children }: { children: React.ReactNode }) => {
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
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;
      translateY.value = event.translationY + context.value.y;
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
    };
  });

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[{ width: width, height: height }, animatedStyle]}>
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
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'none' | 'music' | 'music_trimmer' | 'stickers' | 'text' | 'location' | 'mention' | 'options' | 'ai_label' | 'filters'>('none');
  const { showToast } = useToast();

  // Shared values for Delete Zone
  const isDragging = useSharedValue(false);
  const deleteActive = useSharedValue(false);

  const [activeFilterCategory, setActiveFilterCategory] = useState('Patterns');
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [musicSearch, setMusicSearch] = useState('');
  const [musicTab, setMusicTab] = useState<'for_you' | 'trending' | 'liked'>('for_you');
  const [isAiLabelEnabled, setIsAiLabelEnabled] = useState(false);
  const [isCommentingEnabled, setIsCommentingEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

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

  const fetchUserProfile = async () => {
    try {
      const profile = await wieUserService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const FILTER_CATEGORIES = ['Patterns', 'Colours', 'Gradient', 'Gradient', 'Gradient'];
  const MOCK_FILTERS = [
    { id: 0, type: 'none' },
    { id: 1, type: 'gradient', colors: ['#8B5CF6', '#D946EF'] },
    { id: 2, type: 'gradient', colors: ['#3B82F6', '#2DD4BF'] },
    { id: 3, type: 'gradient', colors: ['#F59E0B', '#EF4444'] },
    { id: 4, type: 'gradient', colors: ['#10B981', '#3B82F6'] },
  ];

  const [songs, setSongs] = useState<any[]>([]); // Future API integration

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

      showToast({ message: "Story shared successfully!", type: 'success' });
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast({ message: error.message || "Failed to share story", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

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
                <Ionicons name="musical-notes-outline" size={48} color="#555" />
                <Text className="text-gray-500 mt-4 text-center">Music integration coming soon.</Text>
              </View>
            ) : (
              songs.map((song) => (
                <TouchableOpacity key={song.id} onPress={() => { setSelectedSong(song); setActiveTab('music_trimmer'); }} className="flex-row items-center justify-between mb-6">
                  <View className="flex-row items-center flex-1">
                    <Image source={{ uri: song.cover }} className="w-16 h-16 rounded-2xl" />
                    <View className="ml-4 flex-1">
                      <Text className="text-white font-bold text-lg" numberOfLines={1}>{song.title}</Text>
                      <Text className="text-gray-400 text-sm mt-0.5">{song.artist} • {song.duration}</Text>
                    </View>
                  </View>
                  <TouchableOpacity className="p-2"><Ionicons name="heart-outline" size={26} color="white" /></TouchableOpacity>
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
            <TextInput placeholder="Search your stickers..." placeholderTextColor="#888" className="flex-1 text-white ml-2 text-base" />
          </View>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {['🍀', '🌈', '🍺', '☘️', '🎁', '🔥', '✨', '🌟', '❤️', '💰', '🎷', '🎈', '🎉', '🎃', '🎸', '📷'].map((emoji, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => { setSelectedSticker(emoji); onClose(); }}
                className="w-[22%] aspect-square items-center justify-center bg-zinc-800/40 rounded-3xl mb-4"
              >
                <Text className="text-4xl">{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderTextEditor = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70] bg-black/85">
      <SafeAreaView className="flex-1">
        <View className="flex-row justify-between items-center px-4 py-4">
           <TouchableOpacity onPress={onClose}><Ionicons name="close" size={32} color="white" /></TouchableOpacity>
           <TouchableOpacity onPress={onClose} className="bg-white px-8 py-2 rounded-full"><Text className="font-bold text-black text-base">Done</Text></TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <TextInput autoFocus multiline value={text} onChangeText={setText} placeholder="Type something..." placeholderTextColor="#666" className="text-white text-4xl font-bold text-center w-full" />
        </View>
        <View className="pb-12 px-4">
           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-8">
             {['SF Pro', 'Roboto', 'Arial', 'Courier', 'Inter', 'Serif'].map(f => (
               <TouchableOpacity key={f} className="bg-zinc-800/90 px-6 py-2.5 rounded-full mr-2.5 border border-white/10">
                 <Text className="text-white font-bold text-base">{f}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
           <View className="flex-row justify-between px-1">
             {['#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'].map(c => (
               <TouchableOpacity key={c} style={{ backgroundColor: c }} className="w-9 h-9 rounded-full border-2 border-white/50 shadow-xl" />
             ))}
           </View>
        </View>
      </SafeAreaView>
    </View>
  );

  const renderLocationSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] min-h-[85%] p-6 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Add location</Text>
          <View className="flex-row items-center bg-zinc-800/60 rounded-xl px-4 py-4 mb-6">
            <Ionicons name="search" size={22} color="#888" />
            <TextInput placeholder="Search your location" placeholderTextColor="#888" className="flex-1 text-white ml-2 text-base" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {['Vismaya Cinemas, Perinthalmanna', 'Plaza Movies, Perinthalmanna', 'Parambikkulam Tiger Reserve', 'Nagarhole Tiger Reserve', 'Kabani Tiger Reserve', 'Periyar Tiger Reserve'].map((loc, i) => (
              <TouchableOpacity key={i} className="py-5 border-b border-white/5 flex-row items-center">
                <Ionicons name="location-outline" size={22} color="white" className="mr-4" />
                <Text className="text-white text-lg flex-1 ml-3">{loc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderMentionSheet = (onClose: () => void) => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] min-h-[85%] p-6 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Add mentions</Text>
          
          <View className="flex-row mb-6">
            {[1, 2, 3, 4, 5].map((_, i) => (
               <View key={i} className="mr-4 items-center">
                  <View className="relative">
                    <Image source={{ uri: `https://i.pravatar.cc/150?u=${i+10}` }} className="w-16 h-16 rounded-full" />
                    <TouchableOpacity className="absolute -top-1 -right-1 bg-zinc-800 rounded-full w-5 h-5 items-center justify-center border border-zinc-700">
                       <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-400 text-xs mt-2">Sangeeth</Text>
               </View>
            ))}
          </View>

          <View className="flex-row items-center bg-zinc-800/60 rounded-xl px-4 py-4 mb-6">
            <Ionicons name="search" size={22} color="#888" />
            <TextInput placeholder="Search here..." placeholderTextColor="#888" className="flex-1 text-white ml-2 text-base" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6].map((_, i) => (
              <TouchableOpacity key={i} className="flex-row items-center justify-between py-4">
                <View className="flex-row items-center">
                  <Image source={{ uri: `https://i.pravatar.cc/150?u=${i+20}` }} className="w-14 h-14 rounded-full" />
                  <View className="ml-4">
                    <Text className="text-white font-bold text-lg">Sangeeth P</Text>
                    <Text className="text-gray-400 text-sm">sangeeth_palliyal</Text>
                  </View>
                </View>
                <Ionicons name={i === 0 ? "radio-button-on" : "radio-button-off"} size={28} color={i === 0 ? "#8B5CF6" : "#555"} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
              <View className="flex-row justify-between mb-6">
                {['15sec', '30sec', '1min'].map((d) => (
                  <TouchableOpacity key={d} className="bg-zinc-800/90 px-8 py-2 rounded-2xl border border-white/5">
                    <Text className="text-white text-sm font-bold">{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="h-14 flex-row items-end justify-between px-2 mb-2">
                {Array.from({ length: 50 }).map((_, i) => (
                  <View key={i} style={{ height: Math.random() * 45 + 5, width: 3.5, backgroundColor: i > 15 && i < 35 ? '#8B5CF6' : '#555', borderRadius: 2 }} />
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black overflow-hidden">
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Adjustable Background */}
      <View className="absolute inset-0">
        <AdjustableBackground>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: width, height: height }} resizeMode="cover" />
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

      <SafeAreaView className="flex-1" pointerEvents="box-none">
        <View className="flex-1 px-4 py-2 justify-between" pointerEvents="box-none">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center mt-3">
            <TouchableOpacity onPress={() => router.back()} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setActiveTab('mention')} className="flex-row items-center bg-black/40 px-5 h-12 rounded-full mr-2.5 border border-white/10">
                <MaterialCommunityIcons name="at" size={20} color="white" />
                <Text className="text-white font-bold ml-1.5 text-base">Mention</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('location')} className="flex-row items-center bg-black/40 px-5 h-12 rounded-full mr-2.5 border border-white/10">
                <Ionicons name="location-outline" size={20} color="white" />
                <Text className="text-white font-bold ml-1.5 text-base">Location</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('options')} className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
                <Ionicons name="ellipsis-horizontal" size={26} color="white" />
              </TouchableOpacity>
            </View>
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
                 <View className="bg-black/50 px-8 py-4 rounded-3xl border border-white/10 shadow-2xl">
                   <Text className="text-white text-4xl font-bold text-center">{text}</Text>
                 </View>
               </DraggableSticker>
             )}

             {/* Emoji Sticker */}
             {selectedSticker && (
                <DraggableSticker 
                  onDelete={() => setSelectedSticker(null)} 
                  isDragging={isDragging} 
                  deleteActive={deleteActive}
                >
                  <Text className="text-8xl">{selectedSticker}</Text>
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
          </View>

          {/* Delete Zone */}
          <DeleteZone isDragging={isDragging} deleteActive={deleteActive} />

          {/* Center Content / Side Bar */}
          <View className="flex-1 flex-row" pointerEvents="box-none">
            <View className="justify-center mt-10">
              {renderSideButton('sticker-emoji', 'stickers', 'community')}
              {renderSideButton('color-filter-outline', 'filters')}
              {renderSideButton('musical-notes', 'music')}
              {renderSideButton('text', 'text')}
            </View>
            <View className="flex-1 items-center justify-center" pointerEvents="none">
               {/* This view is now just a placeholder since stickers are absolute positioned above */}
            </View>
            
            {/* Right Side Buttons (Flip & Undo) */}
            <View className="justify-end mb-40">
               <TouchableOpacity className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10 mb-4">
                  <MaterialIcons name="flip-camera-android" size={26} color="white" />
               </TouchableOpacity>
               <TouchableOpacity className="w-12 h-12 items-center justify-center bg-black/40 rounded-full border border-white/10">
                  <Ionicons name="arrow-undo-outline" size={26} color="white" />
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

          {/* Bottom Bar */}
          <View className="flex-row items-center justify-between mb-10 px-4 gap-x-3">
            <TouchableOpacity className="flex-1 h-12 bg-black/40 flex-row items-center justify-center rounded-full border border-white/10 shadow-lg">
              <View className="w-8 h-8 rounded-full bg-[#10B981] mr-1.5 items-center justify-center">
                 <Ionicons name="star" size={16} color="white" />
              </View>
              <Text className="text-white font-bold text-sm" numberOfLines={1}>Close groups</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleShare} 
              disabled={isUploading}
              className="flex-1 h-12 shadow-lg"
            >
              <LinearGradient 
                colors={['#8B5CF6', '#D946EF']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
                className="flex-row items-center justify-center h-full rounded-full"
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Image 
                      source={{ uri: userProfile?.profile_picture || 'https://i.pravatar.cc/150?u=me' }} 
                      className="w-8 h-8 rounded-full border border-white/30 mr-1.5" 
                    />
                    <Text className="text-white font-bold text-sm" numberOfLines={1}>Your story</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
