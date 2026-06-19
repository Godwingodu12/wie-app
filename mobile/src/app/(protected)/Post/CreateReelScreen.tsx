import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, Video, ResizeMode } from 'expo-av';
import { ReactNativeZoomableView } from '@dudigital/react-native-zoomable-view';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS 
} from 'react-native-reanimated';
import { 
  Gesture, 
  GestureDetector, 
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/context/ToastContext';

const { width, height } = Dimensions.get('window');

type Step = 'selection' | 'edit' | 'finalize';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
  audioUrl: string;
  isLiked?: boolean;
}

const CreateReelScreen = () => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('selection');
  
  // Media State
  const [selectedVideo, setSelectedVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  // Post Data State
  const [caption, setCaption] = useState('');
  const [activeSheet, setActiveSheet] = useState<'none' | 'music' | 'tags' | 'location' | 'overlay' | 'music-edit' | 'crop'>('none');
  
  // Edit State (Instagram Style)
  const [aspectRatio, setAspectRatio] = useState<number>(9 / 16);
  const [rotation, setRotation] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  // Mention / Hashtag State
  const [mentionQuery, setMentionQuery] = useState<{ type: '@' | '#', text: string } | null>(null);
  const mockMentions = ['john_doe', 'alex_smith', 'sarah_connor', 'mike_wazowski'];
  const mockHashtags = ['trending', 'viral', 'reels', 'foryou', 'explore'];
  
  // Music State
  const [musicList, setMusicList] = useState<MusicTrack[]>([]);
  const [musicTab, setMusicTab] = useState<'for-you' | 'trending' | 'liked'>('for-you');
  const [musicSearch, setMusicSearch] = useState('');
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [selectedSong, setSelectedSong] = useState<MusicTrack | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [musicDuration, setMusicDuration] = useState(15);
  const [musicStartTime, setMusicStartTime] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animated values for trimmer
  const trackPanX = useSharedValue(0);
  const trackContextX = useSharedValue(0);

  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draftStr = await AsyncStorage.getItem('reel_draft');
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft.selectedVideo) {
             setSelectedVideo(draft.selectedVideo);
             setCaption(draft.caption || '');
             setAspectRatio(draft.aspectRatio || 9/16);
             setRotation(draft.rotation || 0);
             setIsFlipped(draft.isFlipped || false);
             setCoverImage(draft.coverImage || null);
             setSelectedSong(draft.selectedSong || null);
             setMusicStartTime(draft.musicStartTime || 0);
             setMusicDuration(draft.musicDuration || 15);
             setStep('edit');
             return;
          }
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
      
      if (!selectedVideo && step === 'selection') {
        setTimeout(pickMedia, 150);
      }
    };
    
    if (step === 'selection' && !selectedVideo) {
       loadDraft();
    }
  }, [step]);

  const handleCaptionChange = (text: string) => {
    setCaption(text);
    const words = text.split(/[\s\n]+/);
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery({ type: '@', text: lastWord.slice(1).toLowerCase() });
    } else if (lastWord.startsWith('#') && lastWord.length > 1) {
      setMentionQuery({ type: '#', text: lastWord.slice(1).toLowerCase() });
    } else {
      setMentionQuery(null);
    }
  };

  const insertMentionOrTag = (item: string) => {
    if (!mentionQuery) return;
    const words = caption.split(/[\s\n]+/);
    words[words.length - 1] = `${mentionQuery.type}${item} `;
    setCaption(words.join(' '));
    setMentionQuery(null);
  };

  const formattedCaptionNodes = React.useMemo(() => {
    if (!caption) return null;
    const parts = caption.split(/([@#][a-zA-Z0-9_]+|\s+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) return <Text key={i} className="text-blue-400 font-bold">{part}</Text>;
      if (part.startsWith('#')) return <Text key={i} className="text-purple-400 font-bold">{part}</Text>;
      return <Text key={i} className="text-white">{part}</Text>;
    });
  }, [caption]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSheet === 'music') {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        fetchMusic();
      }, 500);
    }
  }, [activeSheet, musicTab, musicSearch]);

  const fetchMusic = async () => {
    setIsLoadingMusic(true);
    try {
      let response;
      if (musicTab === 'liked') {
        response = await mediaService.getLikedMusic();
      } else {
        response = await mediaService.getMusic({
          type: musicTab,
          search: musicSearch,
          limit: 20
        });
      }

      if (response && response.data) {
        const mappedMusic: MusicTrack[] = response.data.map((item: any) => ({
          id: item.id || item._id || String(item.trackId),
          title: item.title || item.trackName || 'Unknown Title',
          artist: item.artist || item.artistName || 'Unknown Artist',
          duration: item.duration || '0:00',
          coverUrl: item.coverUrl || item.albumArt || item.artworkUrl100 || item.thumbnail || 'https://i.pravatar.cc/150?u=music',
          audioUrl: item.audioUrl || item.previewUrl || item.url,
          isLiked: item.isLiked || musicTab === 'liked'
        }));
        setMusicList(mappedMusic);
      } else {
        setMusicList([]);
      }
    } catch (error: any) {
      console.error("Music fetch error:", error);
      setMusicList([]);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  const handlePlayPause = async (track: MusicTrack) => {
    try {
      if (playingSongId === track.id) {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
             await soundRef.current.pauseAsync();
          }
        }
        setPlayingSongId(null);
      } else {
        if (soundRef.current) {
          try {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
               await soundRef.current.unloadAsync();
            }
          } catch (e) {}
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { shouldPlay: true, isMuted: isMuted }
        );
        await sound.setIsLoopingAsync(true);
        soundRef.current = sound;
        setPlayingSongId(track.id);
        
        sound.setOnPlaybackStatusUpdate((status) => {
           if (status.isLoaded && status.didJustFinish) {
             sound.replayAsync();
           }
        });
      }
    } catch (error) {
      console.log("Audio playback note:", error);
    }
  };

  const handleToggleMusicLike = async (track: MusicTrack) => {
    try {
      const response = await mediaService.toggleMusicLike(track);
      if (response.success) {
        setMusicList(prev => prev.map(t => 
          t.id === track.id ? { ...t, isLiked: response.liked } : t
        ));
        if (musicTab === 'liked' && !response.liked) {
          setMusicList(prev => prev.filter(t => t.id !== track.id));
        }
      }
    } catch (error) {
      console.error("Error toggling music like:", error);
    }
  };

  const toggleMute = async () => {
    try {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.setIsMutedAsync(newMuted);
        }
      }
    } catch (error) {
      console.log("Mute note:", error);
    }
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedVideo(result.assets[0]);
        setStep('edit');
      } else {
        if (selectedVideo) {
          setStep('edit'); // Restore if they cancelled picking new media
        } else if (step === 'selection') {
          router.back();
        }
      }
    } catch (error: any) {
      console.error("Gallery Error:", error);
      showToast({ message: "Failed to open gallery", type: 'error' });
    }
  };

  const handleNext = () => {
    if (step === 'edit') {
      setStep('finalize');
    }
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('selection');
      pickMedia();
    } else if (step === 'finalize') {
      setStep('edit');
    } else {
      router.back();
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        selectedVideo, caption, aspectRatio, rotation, isFlipped, coverImage, selectedSong, musicStartTime, musicDuration
      };
      await AsyncStorage.setItem('reel_draft', JSON.stringify(draftData));
      showToast({ message: 'Draft saved successfully!', type: 'success' });
      router.replace('/(protected)/(tabs)');
    } catch (error) {
      showToast({ message: 'Failed to save draft', type: 'error' });
    }
  };

  // --- ANIMATED STYLES & GESTURES ---
  const animatedTrackStyle = useAnimatedStyle(() => {
    return { transform: [{ translateX: trackPanX.value }] };
  });

  const handleDoneTrimming = async () => {
    setActiveSheet('none');
    if (soundRef.current && selectedSong) {
      try {
        await soundRef.current.setPositionAsync(musicStartTime * 1000);
        await soundRef.current.playAsync();
      } catch (e) {
        console.log("Error seeking after trim:", e);
      }
    }
  };

  const updateSoundPosition = async (offset: number) => {
    // Map the pan offset to a start time in seconds. 
    // Assuming the waveform represents 60 seconds and track is ~500px wide.
    const startTime = Math.round((Math.abs(offset) / 200) * 30); 
    setMusicStartTime(startTime);
    
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(startTime * 1000);
      } catch (e) {}
    }
  };

  const trackGesture = Gesture.Pan()
    .onStart(() => {
       trackContextX.value = trackPanX.value;
    })
    .onUpdate((event) => {
       trackPanX.value = Math.max(-200, Math.min(200, trackContextX.value + event.translationX));
    })
    .onEnd(() => {
       runOnJS(updateSoundPosition)(trackPanX.value);
    });


  const renderHeader = () => (
    <Stack.Screen options={{ 
        headerShown: activeSheet === 'none', 
        title: 'New Reel',
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack}>
              <Ionicons name={step === 'selection' ? "close" : "chevron-back"} size={28} color="white" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          step === 'finalize' ? (
              <TouchableOpacity onPress={handleUpload} disabled={isUploading}>
                  {isUploading ? <ActivityIndicator size="small" color="#3b82f6" /> : <Text className="text-purple-500 font-bold text-lg">Share</Text>}
              </TouchableOpacity>
          ) : (
              <TouchableOpacity onPress={handleNext}>
                  <Text className="text-blue-500 font-bold text-lg">Next</Text>
              </TouchableOpacity>
          )
        )
    }} />
  );

  const handleUpload = async () => {
    if (!selectedVideo) {
      showToast({ message: "Please select media first", type: 'error' });
      return;
    }
    if (!selectedVideo.uri) {
      showToast({ message: "Unsupported or corrupted media.", type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      const isImage = selectedVideo.type === 'image' || selectedVideo.uri.match(/\.(jpg|jpeg|png)$/i);
      const formData = new FormData();
      formData.append('media', {
        uri: selectedVideo.uri,
        name: isImage ? `reel_${Date.now()}.jpg` : `reel_${Date.now()}.mp4`,
        type: isImage ? 'image/jpeg' : 'video/mp4'
      } as any);
      formData.append('caption', caption || '');
      formData.append('type', 'reel');
      formData.append('visibility', 'public');
      formData.append('musicStartAt', String(musicStartTime));
      formData.append('musicDuration', String(musicDuration));
      
      if (coverImage) {
        formData.append('cover', {
          uri: coverImage,
          name: `cover_${Date.now()}.jpg`,
          type: 'image/jpeg'
        } as any);
      }
      
      const getRatioString = (num: number) => {
        if (num === 9/16) return '9:16';
        if (num === 4/5) return '4:5';
        if (num === 1) return '1:1';
        if (num === 16/9) return '16:9';
        return '9:16';
      };
      formData.append('ratio', getRatioString(aspectRatio));
      
      if (selectedSong) {
        formData.append('musicId', selectedSong.id);
      }

      await mediaService.createPost(formData);
      await AsyncStorage.removeItem('reel_draft'); // Clear draft on successful upload
      showToast({ message: "Reel uploaded successfully!", type: 'success' });
      router.replace('/(protected)/(tabs)');
    } catch (error: any) {
      showToast({ message: error.message || "Failed to upload reel", type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const renderMusicSheet = () => (
    <View style={StyleSheet.absoluteFill} className="z-[100]">
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={() => { 
          setActiveSheet('none'); 
          setPlayingSongId(null); 
          soundRef.current?.unloadAsync(); 
        }} 
        style={StyleSheet.absoluteFill}
      >
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <View 
          style={{ height: height * 0.85 }}
          className="bg-[#1C2024] rounded-t-[40px] p-6 border-t border-gray-800 shadow-2xl"
        >
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-6" />
          <Text className="text-white text-xl font-bold text-center mb-6">Choose song</Text>
          <View className="bg-zinc-800/80 rounded-2xl flex-row items-center px-4 py-3 mb-6">
            <Ionicons name="search" size={20} color="#888" />
            <TextInput placeholder="Search your songs..." placeholderTextColor="#888" className="flex-1 text-white ml-3 text-base" value={musicSearch} onChangeText={setMusicSearch} autoFocus={false} />
          </View>
          <View className="flex-row gap-x-3 mb-6">
            {['For you', 'Trending', 'Liked'].map((tab) => {
              const val = tab.toLowerCase().replace(' ', '-') as any;
              const isActive = musicTab === val;
              return (
                <TouchableOpacity key={tab} onPress={() => setMusicTab(val)} className={`px-5 py-2 rounded-full border ${isActive ? 'bg-white border-white' : 'bg-transparent border-zinc-700'}`}>
                  <Text className={`font-bold text-sm ${isActive ? 'text-black' : 'text-white'}`}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FlatList
            data={musicList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: track }) => (
              <TouchableOpacity onPress={() => { setSelectedSong(track); setActiveSheet('music-edit'); handlePlayPause(track); }} className={`flex-row items-center justify-between mb-4 p-2 rounded-2xl ${selectedSong?.id === track.id ? 'bg-white/10' : ''}`}>
                <View className="flex-row items-center flex-1">
                  <View className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
                    <Image source={{ uri: track.coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); handlePlayPause(track); }} className="absolute inset-0 items-center justify-center bg-black/30">
                      <Ionicons name={playingSongId === track.id ? "pause" : "play"} size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>{track.title}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{track.artist} • {track.duration}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleToggleMusicLike(track); }} className="p-2"><Ionicons name={track.isLiked ? "heart" : "heart-outline"} size={24} color={track.isLiked ? "#3b82f6" : "white"} /></TouchableOpacity>
              </TouchableOpacity>
            )}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  const renderMusicEditSheet = () => {
    if (!selectedSong) return null;
    return (
      <View style={StyleSheet.absoluteFill} className="z-[110] bg-black">
        {selectedVideo && <Video source={{ uri: selectedVideo.uri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping />}
        
        <SafeAreaView className="flex-1 bg-black/30">
          <View className="flex-row justify-between items-center px-6 py-4">
            <TouchableOpacity onPress={() => setActiveSheet('music')} className="bg-black/50 p-2 rounded-full">
                <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDoneTrimming} className="bg-white/90 px-6 py-2 rounded-full">
                <Text className="text-black font-bold">Done</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-1 justify-end pb-10 px-4">
            {/* Music Card */}
            <View className="bg-black/60 p-4 rounded-3xl border border-white/10 flex-row items-center mb-6">
                <Image source={{ uri: selectedSong.coverUrl }} className="w-14 h-14 rounded-xl" />
                <View className="ml-4 flex-1">
                    <Text className="text-white font-bold text-lg" numberOfLines={1}>{selectedSong.title}</Text>
                    <Text className="text-gray-400 text-sm mt-0.5">{selectedSong.artist} • {selectedSong.duration}</Text>
                </View>
                <View className="flex-row items-center gap-x-4">
                    <TouchableOpacity><MaterialCommunityIcons name="playlist-music" size={26} color="white" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelectedSong(null); setActiveSheet('none'); }}><Ionicons name="trash-outline" size={24} color="white" /></TouchableOpacity>
                </View>
            </View>

            {/* Duration Presets */}
            <View className="flex-row justify-around mb-8">
                {[
                    { label: '15sec', value: 15 },
                    { label: '30sec', value: 30 },
                    { label: '1min', value: 60 },
                ].map((preset) => (
                    <TouchableOpacity 
                        key={preset.label} 
                        onPress={() => setMusicDuration(preset.value)}
                        className={`px-8 py-3 rounded-2xl ${musicDuration === preset.value ? 'bg-zinc-700' : 'bg-zinc-800/60'}`}
                    >
                        <Text className={`font-bold ${musicDuration === preset.value ? 'text-white' : 'text-gray-400'}`}>{preset.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Favorite Stars */}
            <View className="flex-row justify-around mb-2 px-10">
                <Ionicons name="star" size={18} color="#D946EF" />
                <Ionicons name="star" size={18} color="#D946EF" />
                <Ionicons name="star" size={18} color="#D946EF" />
            </View>

            {/* Waveform Trimmer */}
            <GestureDetector gesture={trackGesture}>
                <View className="h-16 overflow-hidden relative justify-center">
                  <Animated.View style={animatedTrackStyle} className="flex-row items-center px-4 w-[200%]">
                    {Array.from({ length: 100 }).map((_, i) => {
                       const isPurple = i > 40 && i < 60;
                       return (
                         <View 
                           key={i} 
                           style={{ 
                             height: Math.random() * 30 + 10, 
                             width: 3, 
                             backgroundColor: isPurple ? '#9333ea' : '#555', 
                             borderRadius: 1.5,
                             marginHorizontal: 2
                           }} 
                         />
                       );
                    })}
                  </Animated.View>
                  
                  {/* Selection Highlight Window (matching design) */}
                  <View pointerEvents="none" className="absolute top-0 bottom-0 self-center bg-white/10 rounded-xl border border-white/50 overflow-hidden" style={{ width: (musicDuration / 60) * 100 + '%' }}>
                    <View className="absolute right-0 top-0 bottom-0 w-1.5 bg-purple-400 rounded-full" />
                  </View>
                </View>
            </GestureDetector>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  const renderOverlaySheet = () => (
    <View style={StyleSheet.absoluteFill} className="z-[100]">
      <TouchableOpacity activeOpacity={1} onPress={() => setActiveSheet('none')} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024] rounded-t-[40px] h-[80%] p-6 border-t border-gray-800">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Select Overlay</Text>
          <FlatList data={[...Array(12)]} numColumns={3} renderItem={() => (
              <TouchableOpacity className="flex-1 aspect-square m-1 bg-zinc-800 rounded-2xl overflow-hidden">
                <Image source={{ uri: 'https://via.placeholder.com/150' }} className="w-full h-full opacity-60" />
              </TouchableOpacity>
            )} />
          <TouchableOpacity onPress={() => setActiveSheet('none')} className="mt-6 bg-purple-600 py-4 rounded-full">
            <LinearGradient colors={['#8B5CF6', '#D946EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0 rounded-full" />
            <Text className="text-white text-center font-bold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEdit = () => {
    const isImage = selectedVideo?.type === 'image' || selectedVideo?.uri.match(/\.(jpg|jpeg|png)$/i);
    const mediaWidth = width * 0.9;
    const mediaHeight = mediaWidth / aspectRatio;

    return (
      <View className="flex-1 bg-black">
        <View className="flex-1 bg-black justify-center items-center relative overflow-hidden mt-4">
          <View style={{ width: '100%', aspectRatio: aspectRatio, maxHeight: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: 'black' }}>
            <ReactNativeZoomableView
               maxZoom={3}
               minZoom={0.5}
               zoomStep={0.5}
               initialZoom={1}
               bindToBorders={false}
            >
              <View style={{ width: '100%', height: '100%', transform: [{ rotate: `${rotation}deg` }, { scaleX: isFlipped ? -1 : 1 }] }}>
                {isImage ? (
                  <Image source={{ uri: selectedVideo!.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  selectedVideo && <Video source={{ uri: selectedVideo.uri }} style={{ width: '100%', height: '100%' }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={isMuted} />
                )}
              </View>
            </ReactNativeZoomableView>
          </View>
          
          {selectedSong && (
              <View style={{ top: 30 }} className="absolute flex-row items-center justify-center px-4 z-50">
                  <View className="bg-zinc-700/80 rounded-2xl h-14 flex-row items-center px-4">
                      <Image source={{ uri: selectedSong.coverUrl }} className="w-10 h-10 rounded-lg" />
                      <Text className="text-white font-bold ml-3 max-w-[150px]" numberOfLines={1}>{selectedSong.title}</Text>
                      <View className="w-px h-full bg-white/10 mx-4" />
                      <MaterialCommunityIcons name="waveform" size={24} color="white" />
                  </View>
                  <TouchableOpacity onPress={toggleMute} className="ml-3 bg-zinc-700/80 w-14 h-14 items-center justify-center rounded-2xl">
                      <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={26} color="white" />
                  </TouchableOpacity>
              </View>
          )}
        </View>

        <View className="mb-6 px-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 8 }}>
            {[
              { label: 'Text', icon: 'format-text', action: () => {} }, 
              { label: 'Music', icon: 'music-note', action: () => setActiveSheet('music') }, 
              { label: 'Overlay', icon: 'layers-outline', action: () => setActiveSheet('overlay') },
              { label: 'Ratio', icon: 'crop-free', action: () => setActiveSheet('crop') },
              { label: 'Rotate', icon: 'rotate-right', action: () => setRotation(r => r + 90) },
              { label: 'Flip', icon: 'flip-horizontal', action: () => setIsFlipped(f => !f) },
              { label: 'Mute', icon: isMuted ? 'volume-off' : 'volume-high', action: toggleMute },
              { label: 'Reset', icon: 'refresh', action: () => { setRotation(0); setIsFlipped(false); setAspectRatio(9/16); } }
            ].map((tool) => (
              <TouchableOpacity key={tool.label} onPress={tool.action} className="bg-zinc-800/60 py-3 px-5 rounded-[24px] items-center border border-white/5">
                <MaterialCommunityIcons name={tool.icon as any} size={24} color="white" />
                <Text className="text-white text-[10px] mt-1 font-bold">{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="px-6 pb-12">
          <TouchableOpacity onPress={handleNext} className="h-16 bg-purple-600 rounded-full items-center justify-center">
            <LinearGradient colors={['#8B5CF6', '#D946EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0 rounded-full" />
            <Text className="text-white font-bold text-lg">Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const pickCoverImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio === 9/16 ? [9, 16] : aspectRatio === 4/5 ? [4, 5] : aspectRatio === 1/1 ? [1, 1] : [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderFinalize = () => {
    const isImage = selectedVideo?.type === 'image' || selectedVideo?.uri.match(/\.(jpg|jpeg|png)$/i);
    const filteredMentions = mentionQuery ? (mentionQuery.type === '@' ? mockMentions : mockHashtags).filter(item => item.includes(mentionQuery.text)) : [];

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="mt-6 flex-row gap-x-4">
             {/* Thumbnail & Cover Selection */}
             <View style={{ width: 100, height: 100 / aspectRatio }} className="bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800">
                {coverImage ? (
                   <Image source={{ uri: coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                   <View style={{ width: '100%', height: '100%', transform: [{ rotate: `${rotation}deg` }, { scaleX: isFlipped ? -1 : 1 }] }}>
                     {isImage ? (
                       <Image source={{ uri: selectedVideo!.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                     ) : (
                       selectedVideo && <Video source={{ uri: selectedVideo.uri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} />
                     )}
                   </View>
                )}
                <TouchableOpacity onPress={pickCoverImage} className="absolute inset-0 bg-black/40 items-center justify-center">
                   <Text className="text-white font-bold text-xs text-center px-2">Edit cover</Text>
                </TouchableOpacity>
             </View>

             {/* Caption Input with Highlight Overlay */}
             <View className="flex-1 relative min-h-[120px]">
                {/* Text Formatter Overlay */}
                <View className="absolute inset-0 z-0 px-2 pt-2" pointerEvents="none">
                   <Text className="text-base leading-relaxed">
                     {caption ? formattedCaptionNodes : <Text className="text-zinc-500 text-base">Write a caption...</Text>}
                   </Text>
                </View>
                {/* Invisible Input */}
                <TextInput 
                  multiline 
                  value={caption} 
                  onChangeText={handleCaptionChange} 
                  className="text-base leading-relaxed px-2 pt-2 min-h-[120px] text-left align-top z-10" 
                  style={{ color: 'transparent' }} 
                  maxLength={2200}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text className="absolute bottom-0 right-2 text-zinc-600 text-[10px]">{caption.length}/2200</Text>
             </View>
          </View>

          {/* Autocomplete Popup */}
          {mentionQuery && filteredMentions.length > 0 && (
            <View className="bg-zinc-900 rounded-xl mt-2 max-h-40 overflow-hidden border border-zinc-800 shadow-xl">
               <ScrollView keyboardShouldPersistTaps="handled">
                  {filteredMentions.map(item => (
                    <TouchableOpacity key={item} onPress={() => insertMentionOrTag(item)} className="px-4 py-3 border-b border-zinc-800 flex-row items-center">
                       <Text className="text-white font-bold text-base">{mentionQuery.type}{item}</Text>
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>
          )}

          <View className="mt-8 space-y-2 mb-8">
              <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900">
                  <View className="flex-row items-center"><Ionicons name="person-outline" size={22} color="white" /><Text className="text-white ml-4 text-base">Tag people</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900">
                  <View className="flex-row items-center"><Ionicons name="location-outline" size={22} color="white" /><Text className="text-white ml-4 text-base">Add location</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900">
                  <View className="flex-row items-center"><MaterialCommunityIcons name="music-note" size={22} color="white" /><Text className="text-white ml-4 text-base">Add music</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900">
                  <View className="flex-row items-center"><Ionicons name="eye-outline" size={22} color="white" /><Text className="text-white ml-4 text-base">Who can see your reel</Text></View>
                  <View className="flex-row items-center"><Text className="text-gray-400 mr-2 text-sm">Followers</Text><Ionicons name="chevron-forward" size={18} color="#52525b" /></View>
              </TouchableOpacity>
          </View>
        </ScrollView>

        <SafeAreaView edges={['bottom']} className="px-6 py-4 flex-row gap-x-4 bg-black border-t border-zinc-900">
            <TouchableOpacity onPress={saveDraft} className="flex-1 h-14 bg-zinc-900 rounded-[28px] items-center justify-center border border-zinc-800"><Text className="text-white font-bold text-base">Save Draft</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} className="flex-1 h-14 bg-purple-600 rounded-[28px] items-center justify-center overflow-hidden">
                <LinearGradient colors={['#8B5CF6', '#D946EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0" />
                <Text className="text-white font-bold text-base">Share</Text>
            </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  };

  const renderCropSheet = () => (
    <View style={StyleSheet.absoluteFill} className="z-[100]">
      <TouchableOpacity activeOpacity={1} onPress={() => setActiveSheet('none')} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024] rounded-t-[40px] p-6 border-t border-gray-800 pb-12">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Aspect Ratio (Crop)</Text>
          <View className="flex-row justify-around">
            {[
              { label: '9:16', ratio: 9/16 },
              { label: '4:5', ratio: 4/5 },
              { label: '1:1', ratio: 1/1 },
              { label: '16:9', ratio: 16/9 },
            ].map(item => (
              <TouchableOpacity 
                key={item.label} 
                onPress={() => { setAspectRatio(item.ratio); setActiveSheet('none'); }} 
                className={`py-4 px-6 rounded-2xl border ${aspectRatio === item.ratio ? 'bg-purple-600/30 border-purple-500' : 'bg-zinc-800 border-zinc-700'} items-center`}
              >
                <Text className="text-white font-bold">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
        {renderHeader()}
        {step === 'edit' && renderEdit()}
        {step === 'finalize' && renderFinalize()}
        {activeSheet === 'music' && renderMusicSheet()}
        {activeSheet === 'music-edit' && renderMusicEditSheet()}
        {activeSheet === 'overlay' && renderOverlaySheet()}
        {activeSheet === 'crop' && renderCropSheet()}
    </GestureHandlerRootView>
  );
};

export default CreateReelScreen;
