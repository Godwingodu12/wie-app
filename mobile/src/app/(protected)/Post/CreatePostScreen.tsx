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
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  runOnJS,
  withSpring 
} from 'react-native-reanimated';
import { 
  Gesture, 
  GestureDetector,
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/context/ToastContext';

const { width, height } = Dimensions.get('window');

const DraggableMediaItem = ({ 
  item, 
  containerWidth, 
  containerHeight, 
  initialOffset = { x: 0, y: 0, scale: 1 },
  onOffsetChange 
}: { 
  item: ImagePicker.ImagePickerAsset, 
  containerWidth: number, 
  containerHeight: number,
  initialOffset?: { x: number, y: number, scale: number },
  onOffsetChange: (offset: { x: number, y: number, scale: number }) => void
}) => {
  const scale = useSharedValue(initialOffset.scale || 1);
  const translateX = useSharedValue(initialOffset.x || 0);
  const translateY = useSharedValue(initialOffset.y || 0);
  
  const context = useSharedValue({ x: 0, y: 0, scale: 1 });

  // Dimensions
  const imgWidth = item.width || containerWidth;
  const imgHeight = item.height || containerHeight;
  const imgAspectRatio = imgWidth / imgHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let baseWidth: number, baseHeight: number;
  if (imgAspectRatio > containerAspectRatio) {
    baseHeight = containerHeight;
    baseWidth = containerHeight * imgAspectRatio;
  } else {
    baseWidth = containerWidth;
    baseHeight = containerWidth / imgAspectRatio;
  }

  const updateOffsets = (nextScale: number, nextX: number, nextY: number, animate = false) => {
    'worklet';
    const displayedWidth = baseWidth * nextScale;
    const displayedHeight = baseHeight * nextScale;

    // Boundary logic: prevent pulling image away from edges (no black gaps)
    const maxOffsetX = Math.max(0, (displayedWidth - containerWidth) / 2);
    const maxOffsetY = Math.max(0, (displayedHeight - containerHeight) / 2);

    const targetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, nextX));
    const targetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, nextY));

    if (animate) {
      translateX.value = withSpring(targetX, { damping: 20 });
      translateY.value = withSpring(targetY, { damping: 20 });
    } else {
      translateX.value = targetX;
      translateY.value = targetY;
    }
  };

  // Sync with prop changes
  useEffect(() => {
    const currentScale = initialOffset?.scale || 1;
    const currentX = initialOffset?.x || 0;
    const currentY = initialOffset?.y || 0;
    
    scale.value = currentScale;
    updateOffsets(currentScale, currentX, currentY);
  }, [initialOffset?.scale, initialOffset?.x, initialOffset?.y, containerWidth, containerHeight]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value, scale: scale.value };
    })
    .onUpdate((event) => {
      updateOffsets(scale.value, event.translationX + context.value.x, event.translationY + context.value.y);
    })
    .onEnd(() => {
      runOnJS(onOffsetChange)({ x: translateX.value, y: translateY.value, scale: scale.value });
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      context.value = { x: translateX.value, y: translateY.value, scale: scale.value };
    })
    .onUpdate((event) => {
      const nextScale = Math.max(1, Math.min(5, context.value.scale * event.scale));
      scale.value = nextScale;
      updateOffsets(nextScale, translateX.value, translateY.value);
    })
    .onEnd(() => {
      runOnJS(onOffsetChange)({ x: translateX.value, y: translateY.value, scale: scale.value });
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <View style={{ width: containerWidth, height: containerHeight, overflow: 'hidden', borderRadius: 32, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ width: baseWidth, height: baseHeight, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
          <Image 
            key={`${item.uri}-${containerWidth}-${containerHeight}`}
            source={{ uri: item.uri }} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="cover"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

type Step = 'selection' | 'edit' | 'finalize';
type PostType = 'post' | 'story' | 'reel';
type MediaRatio = '1:1' | '4:5' | '9:16' | '16:9' | '4:3';

const RATIOS: Record<MediaRatio, number> = { 
  '1:1': 1, 
  '4:5': 0.8, 
  '9:16': 9/16, 
  '16:9': 16/9, 
  '4:3': 4/3 
};

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
  audioUrl: string;
  isLiked?: boolean;
}

const CreatePostScreen = () => {
  const [step, setStep] = useState<Step>('selection');
  const [postType, setPostType] = useState<PostType>('post');
  
  // Media State
  const [originalMedia, setOriginalMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  
  // Post Data State
  const [caption, setCaption] = useState('');
  const [activeSheet, setActiveSheet] = useState<'none' | 'music' | 'tags' | 'location' | 'crop'>('none');
  
  // Crop State
  const [cropRatio, setCropRatio] = useState<MediaRatio>('1:1');
  const [cropMode, setCropMode] = useState<'adjust' | 'ratio'>('ratio');
  const [mediaOffsets, setMediaOffsets] = useState<Record<string, { x: number, y: number, scale: number }>>({});

  // Music State
  const [musicList, setMusicList] = useState<MusicTrack[]>([]);
  const [musicTab, setMusicTab] = useState<'for-you' | 'trending' | 'liked'>('for-you');
  const [musicSearch, setMusicSearch] = useState('');
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [selectedSong, setSelectedSong] = useState<MusicTrack | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    if (selectedMedia.length === 0) {
      // Delay slightly to ensure navigation transition or tab switch UI update finishes
      const timer = setTimeout(pickImage, 150);
      return () => clearTimeout(timer);
    }
  }, [postType]);

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
      // Debounce search to avoid too many API calls
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

      console.log(`[CreatePost] Music API loaded ${response?.data?.length || 0} tracks`);

      if (response && response.data) {
        // Map API response to our MusicTrack interface
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
      showToast({ message: "Failed to load music from server", type: 'error' });
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

  const handleCrop = () => {
    if (selectedMedia.length === 0) return;
    setActiveSheet('crop');
  };

  const pickImage = async () => {
    try {
      if (!ImagePicker) {
        console.error("ImagePicker module is not available");
        return;
      }

      // Use MediaTypeOptions (legacy but stable for this SDK version)
      const mediaTypes = postType === 'reel' 
        ? (ImagePicker.MediaTypeOptions?.Videos || 'Videos') 
        : (ImagePicker.MediaTypeOptions?.All || 'All');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes as any,
        allowsMultipleSelection: postType !== 'reel',
        selectionLimit: postType === 'reel' ? 1 : 20,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("[CreatePost] Selected images, creating persistent copies...");
        
        // Create persistent copies immediately to avoid cache invalidation
        const persistentAssets = [];
        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          if (asset.type === 'video') {
            persistentAssets.push(asset);
            continue;
          }

          try {
            // NORMALIZE EXIF: 
            // We apply rotate: 0 to force baking the orientation into raw pixels.
            const normalized = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ rotate: 0 }], 
              { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
            );

            const filename = normalized.uri.split('/').pop() || `draft_${Date.now()}_${i}.jpg`;
            const destUri = `${FileSystem.documentDirectory}${filename}`;
            
            await FileSystem.copyAsync({
              from: normalized.uri,
              to: destUri
            });
            
            const info = await FileSystem.getInfoAsync(destUri);
            if (info.exists && info.size > 0) {
              persistentAssets.push({
                ...asset,
                uri: destUri,
                width: normalized.width,
                height: normalized.height
              });
            } else {
              console.warn(`[Persistence] Failed to verify copy for ${filename}. Using original.`);
              persistentAssets.push(asset);
            }
          } catch (e: any) {
             console.warn(`[Persistence] Error copying/normalizing file ${asset.uri}:`, e.message);
             persistentAssets.push(asset);
          }
        }

        setOriginalMedia(persistentAssets);
        setSelectedMedia(persistentAssets);
        setMediaOffsets({});
        setStep('edit');
      }
    } catch (error: any) {
      console.error("Gallery Error:", error);
      showToast({ message: "Failed to open gallery", type: 'error' });
    }
  };

  const handleNext = async () => {
    if (step === 'selection') {
      if (selectedMedia.length === 0) {
        pickImage();
        return;
      }
      setStep('edit');
    } else if (step === 'edit') {
      if (originalMedia.length === 0) return;
      
      setIsUploading(true);
      try {
        console.log(`[CreatePost] Starting crop processing for ${originalMedia.length} items...`);
        
        const croppedAssets = await Promise.all(originalMedia.map(async (asset) => {
          if (asset.type === 'video') return asset;
          
          const offset = mediaOffsets[asset.uri] || { x: 0, y: 0, scale: 1 };
          const userScale = offset.scale || 1;
          const targetRatio = RATIOS[cropRatio];
          const containerWidth = width * 0.8;
          const containerHeight = containerWidth / targetRatio;
          
          let sourceUri = asset.uri;
          if (Platform.OS === 'android' && !sourceUri.startsWith('file://') && !sourceUri.startsWith('content://')) {
            sourceUri = `file://${sourceUri}`;
          }
          
          const imgWidth = asset.width;
          const imgHeight = asset.height;
          
          if (!imgWidth || !imgHeight) {
            console.warn("[Crop] Missing dimensions for asset, skipping crop.");
            return asset;
          }

          const imgAspectRatio = imgWidth / imgHeight;
          
          let baseWidth: number, baseHeight: number;
          if (imgAspectRatio > targetRatio) {
            baseHeight = containerHeight;
            baseWidth = containerHeight * imgAspectRatio;
          } else {
            baseWidth = containerWidth;
            baseHeight = containerWidth / imgAspectRatio;
          }

          const displayedWidth = baseWidth * userScale;
          const displayedHeight = baseHeight * userScale;

          const scaleToOriginal = imgWidth / displayedWidth;

          const initialHiddenLeft = (displayedWidth - containerWidth) / 2;
          const initialHiddenTop = (displayedHeight - containerHeight) / 2;

          const visibleOriginX = initialHiddenLeft - offset.x;
          const visibleOriginY = initialHiddenTop - offset.y;

          const originX = Math.max(0, Math.round(visibleOriginX * scaleToOriginal));
          const originY = Math.max(0, Math.round(visibleOriginY * scaleToOriginal));
          
          const cropWidth = Math.min(imgWidth - originX, Math.round(containerWidth * scaleToOriginal));
          const cropHeight = Math.min(imgHeight - originY, Math.round(containerHeight * scaleToOriginal));
          
          try {
            console.log(`[Crop] Processing ${sourceUri} -> origin:(${originX},${originY}) size:${cropWidth}x${cropHeight}`);

            const result = await ImageManipulator.manipulateAsync(
              sourceUri,
              [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            return { ...asset, uri: result.uri, width: result.width, height: result.height };
          } catch (manipError: any) {
            console.error(`[Crop] Critical failure for ${asset.uri}: ${manipError.message}`);
            return asset; 
          }
        }));
        
        setSelectedMedia(croppedAssets);
        setStep('finalize');
      } catch (e: any) {
        console.error("Processing error:", e.message);
        showToast({ message: "Error processing images.", type: 'error' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('selection');
    } else if (step === 'finalize') {
      setSelectedMedia(originalMedia);
      setStep('edit');
    } else {
      router.back();
    }
  };

  const renderHeader = () => {
    let title = 'New Post';
    if (step === 'finalize') title = 'New post';
    
    return (
      <Stack.Screen options={{ 
          headerShown: activeSheet === 'none', 
          title: title,
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
                    {isUploading ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                        <Text className="text-purple-500 font-bold text-lg">Share</Text>
                    )}
                </TouchableOpacity>
            ) : (
                <TouchableOpacity onPress={handleNext}>
                    <Text className="text-blue-500 font-bold text-lg">Next</Text>
                </TouchableOpacity>
            )
          )
      }} />
    );
  };

  const handleUpload = async () => {
    if (selectedMedia.length === 0) {
      showToast({ message: "Please select media first", type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      console.log("[Upload] Starting pre-flight validation...");
      const formData = new FormData();
      
      // 1. Rigorous File Verification
      for (let i = 0; i < selectedMedia.length; i++) {
        const asset = selectedMedia[i];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        
        if (!fileInfo.exists) {
          throw new Error(`Media file ${i + 1} not found on device. Please re-edit.`);
        }
        
        if (fileInfo.size === 0) {
          throw new Error(`Media file ${i + 1} is empty (0 bytes).`);
        }

        const uri = asset.uri;
        const filename = uri.split('/').pop() || `upload_${Date.now()}_${i}.jpg`;
        const type = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
        
        console.log(`[Upload] Verified ${filename} (${fileInfo.size} bytes)`);
        
        formData.append('media', {
          uri: uri,
          name: filename,
          type: type
        } as any);
      }

      // 2. Metadata Verification
      formData.append('caption', caption || '');
      formData.append('visibility', 'public');
      formData.append('isStory', postType === 'story' ? 'true' : 'false');
      formData.append('isPersistent', 'true');
      formData.append('type', postType === 'reel' ? 'reel' : 'post');
      formData.append('ratio', cropRatio);
      
      if (selectedLocation) formData.append('locationLabel', selectedLocation);
      
      if (selectedSong) {
        formData.append('musicId', selectedSong.id);
        formData.append('musicTitle', selectedSong.title);
        formData.append('musicArtist', selectedSong.artist);
        formData.append('musicPreviewUrl', selectedSong.audioUrl);
        formData.append('musicAlbumArt', selectedSong.coverUrl);
      }

      console.log("[Upload] Validation successful. Calling API...");

      await mediaService.createPost(formData);
      showToast({ message: "Post uploaded successfully!", type: 'success' });
      router.replace('/(protected)/(tabs)');
    } catch (error: any) {
      console.error("[Upload] Error:", error.message);
      showToast({ 
        message: error.message || "Failed to upload. Please check your connection and try again.", 
        type: 'error' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- MUSIC SHEET ---

  const handleToggleMusicLike = async (track: MusicTrack) => {
    try {
      const response = await mediaService.toggleMusicLike(track);
      if (response.success) {
        // Update local state
        setMusicList(prev => prev.map(t => 
          t.id === track.id ? { ...t, isLiked: response.liked } : t
        ));
        
        // If we are on Liked tab and just unliked, remove it
        if (musicTab === 'liked' && !response.liked) {
          setMusicList(prev => prev.filter(t => t.id !== track.id));
        }
      }
    } catch (error) {
      console.error("Error toggling music like:", error);
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
            <TextInput 
              placeholder="Search your songs..." 
              placeholderTextColor="#888" 
              className="flex-1 text-white ml-3 text-base"
              value={musicSearch}
              onChangeText={setMusicSearch}
              autoFocus={false}
            />
          </View>

          <View className="flex-row gap-x-3 mb-6">
            {['For you', 'Trending', 'Liked'].map((tab) => {
              const val = tab.toLowerCase().replace(' ', '-') as any;
              const isActive = musicTab === val;
              return (
                <TouchableOpacity 
                  key={tab} 
                  onPress={() => setMusicTab(val)}
                  className={`px-5 py-2 rounded-full border ${isActive ? 'bg-white border-white' : 'bg-transparent border-zinc-700'}`}
                >
                  <Text className={`font-bold text-sm ${isActive ? 'text-black' : 'text-white'}`}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <FlatList
            data={musicList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              isLoadingMusic ? (
                <ActivityIndicator color="white" className="mt-10" />
              ) : (
                <Text className="text-gray-500 text-center mt-10">No music found</Text>
              )
            )}
            renderItem={({ item: track }) => (
              <TouchableOpacity 
                onPress={() => { 
                  setSelectedSong(track); 
                  setActiveSheet('none'); 
                  handlePlayPause(track);
                }} 
                className={`flex-row items-center justify-between mb-4 p-2 rounded-2xl ${selectedSong?.id === track.id ? 'bg-white/10' : ''}`}
              >
                <View className="flex-row items-center flex-1">
                  <View className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-800">
                    <Image 
                      source={{ uri: track.coverUrl }} 
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />
                    <TouchableOpacity 
                      onPress={(e) => { e.stopPropagation(); handlePlayPause(track); }}
                      className="absolute inset-0 items-center justify-center bg-black/30"
                    >
                      <Ionicons 
                        name={playingSongId === track.id ? "pause" : "play"} 
                        size={20} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>{track.title}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{track.artist} • {track.duration}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={(e) => { e.stopPropagation(); handleToggleMusicLike(track); }}
                  className="p-2"
                >
                  <Ionicons 
                    name={track.isLiked ? "heart" : "heart-outline"} 
                    size={24} 
                    color={track.isLiked ? "#3b82f6" : "white"} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListFooterComponent={<View style={{ height: 100 }} />}
          />
          
          <View className="absolute bottom-6 left-6 right-6">
            <TouchableOpacity 
                onPress={() => setActiveSheet('none')}
                className="h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg overflow-hidden"
            >
                <LinearGradient 
                    colors={['#8B5CF6', '#D946EF']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }} 
                    className="absolute inset-0" 
                />
                <Text className="text-white font-bold text-lg">Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );


  const renderTagSheet = () => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={() => setActiveSheet('none')} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] min-h-[85%] p-6 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Tag peoples</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[1, 2, 3, 4, 5, 6].map((_, i) => (
              <TouchableOpacity key={i} onPress={() => {
                    const tag = { id: i, name: 'Sangeeth P', username: 'sangeeth_palliyal' };
                    setSelectedTags(prev => prev.find(t => t.id === i) ? prev.filter(t => t.id !== i) : [...prev, tag]);
              }} className="flex-row items-center justify-between py-4">
                <View className="flex-row items-center">
                  <Image source={{ uri: `https://i.pravatar.cc/150?u=${i+20}` }} className="w-14 h-14 rounded-full" />
                  <View className="ml-4">
                    <Text className="text-white font-bold text-lg">Sangeeth P</Text>
                    <Text className="text-gray-400 text-sm">sangeeth_palliyal</Text>
                  </View>
                </View>
                <Ionicons name={selectedTags.find(t => t.id === i) ? "radio-button-on" : "radio-button-off"} size={28} color={selectedTags.find(t => t.id === i) ? "#8B5CF6" : "#555"} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={() => setActiveSheet('none')} className="mt-6 bg-purple-600 py-4 rounded-3xl">
            <Text className="text-white text-center font-bold text-lg">Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderLocationSheet = () => (
    <View style={StyleSheet.absoluteFill} className="z-[70]">
      <TouchableOpacity activeOpacity={1} onPress={() => setActiveSheet('none')} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </TouchableOpacity>
      <View className="flex-1 justify-end">
        <View className="bg-[#1C2024]/95 rounded-t-[40px] min-h-[85%] p-6 border-t border-gray-800 shadow-2xl">
          <View className="w-12 h-1 bg-gray-600 self-center rounded-full mb-8" />
          <Text className="text-white text-xl font-bold text-center mb-8">Add location</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {['Vismaya Cinemas, Perinthalmanna', 'Plaza Movies, Perinthalmanna', 'Parambikkulam Tiger Reserve', 'Nagarhole Tiger Reserve'].map((loc, i) => (
              <TouchableOpacity key={i} onPress={() => { setSelectedLocation(loc); setActiveSheet('none'); }} className="py-5 border-b border-white/5 flex-row items-center">
                <Ionicons name="location-outline" size={22} color="white" />
                <Text className="text-white text-lg flex-1 ml-4">{loc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  // --- UI COMPONENTS ---

  const GridOverlay = () => (
    <View pointerEvents="none" className="absolute inset-0 z-50">
      <View className="flex-1 flex-row border-2 border-white/50 rounded-[32px] overflow-hidden">
        <View className="flex-1 border-r border-white/30" />
        <View className="flex-1 border-r border-white/30" />
        <View className="flex-1" />
      </View>
      <View className="absolute inset-0 flex-col">
        <View className="flex-1 border-b border-white/30" />
        <View className="flex-1 border-b border-white/30" />
        <View className="flex-1" />
      </View>
      
      {/* Corner indicators */}
      <View className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl-[30px]" />
      <View className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr-[30px]" />
      <View className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl-[30px]" />
      <View className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white rounded-br-[30px]" />
      
      {/* Edge indicators */}
      <View className="absolute top-0 left-1/2 -ml-2 w-4 h-1.5 bg-white rounded-full" />
      <View className="absolute bottom-0 left-1/2 -ml-2 w-4 h-1.5 bg-white rounded-full" />
      <View className="absolute left-0 top-1/2 -mt-2 w-1.5 h-4 bg-white rounded-full" />
      <View className="absolute right-0 top-1/2 -mt-2 w-1.5 h-4 bg-white rounded-full" />
    </View>
  );

  const renderCropSheet = () => {
    if (activeSheet !== 'crop') return null;

    const currentItem = originalMedia[currentIndex];
    const containerWidth = width * 0.8;
    const containerHeight = containerWidth / RATIOS[cropRatio];

    return (
      <View style={StyleSheet.absoluteFill} className="z-[100] bg-black">
        
        {/* Interactive Adjust Area (Figma Design) */}
        <View className="flex-1 justify-center items-center">
            {cropMode === 'adjust' && (
              <View className="absolute top-10 bg-black/60 px-4 py-2 rounded-full flex-row items-center z-50">
                  <MaterialCommunityIcons name="gesture-pinch" size={16} color="white" />
                  <Text className="text-white ml-2 text-sm font-medium">Drag to move • Pinch to zoom</Text>
              </View>
            )}

            {currentItem && (
              <View style={{ width: containerWidth, height: containerHeight }}>
                <DraggableMediaItem
                    item={currentItem}
                    containerWidth={containerWidth}
                    containerHeight={containerHeight}
                    initialOffset={mediaOffsets[currentItem.uri]}
                    onOffsetChange={(offset) => {
                        setMediaOffsets(prev => ({ ...prev, [currentItem.uri]: offset }));
                    }}
                />
                {cropMode === 'adjust' && <GridOverlay />}
              </View>
            )}
        </View>

        {/* Bottom Controls */}
        <View className="bg-[#1C2024] rounded-t-[40px] p-6 border-t border-gray-800 shadow-2xl">
          <View className="flex-row items-center justify-between mb-6">
             <View className="w-6" /> 
             <Text className="text-white text-xl font-bold">Crop</Text>
             <TouchableOpacity onPress={() => setActiveSheet('none')}>
                <Ionicons name="checkmark" size={28} color="white" />
             </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mb-8 bg-zinc-800/50 p-1 rounded-2xl self-center">
            <TouchableOpacity 
              onPress={() => setCropMode('ratio')}
              className={`px-8 py-2.5 rounded-xl ${cropMode === 'ratio' ? 'bg-zinc-700' : ''}`}
            >
              <Text className={`font-bold ${cropMode === 'ratio' ? 'text-white' : 'text-gray-400'}`}>Ratio</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setCropMode('adjust')}
              className={`px-8 py-2.5 rounded-xl ${cropMode === 'adjust' ? 'bg-zinc-700' : ''}`}
            >
              <Text className={`font-bold ${cropMode === 'adjust' ? 'text-white' : 'text-gray-400'}`}>Adjust</Text>
            </TouchableOpacity>
          </View>

          {cropMode === 'ratio' ? (
            <View className="flex-row justify-around items-center px-4 mb-4">
              {[
                { label: '9:16', value: '9:16', icon: 'smartphone' },
                { label: '16:9', value: '16:9', icon: 'monitor' },
                { label: '4:3', value: '4:3', icon: 'camera' },
              ].map((r) => (
                <TouchableOpacity 
                  key={r.value} 
                  onPress={() => setCropRatio(r.value as MediaRatio)}
                  className="items-center"
                >
                  <View className={`w-16 h-16 rounded-2xl items-center justify-center border-2 mb-2 ${cropRatio === r.value ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-700 bg-zinc-800/30'}`}>
                    <Feather name={r.icon as any} size={24} color={cropRatio === r.value ? '#A855F7' : '#9CA3AF'} />
                  </View>
                  <Text className={`font-bold ${cropRatio === r.value ? 'text-purple-400' : 'text-gray-400'}`}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-2 mb-4">
               {/* Dummy slider to match UI visually for now, actual zoom is pinch */}
               <View className="flex-row items-center w-full px-6 mb-4">
                  <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                  <View className="flex-1 h-1 bg-zinc-700 mx-4 rounded-full">
                     <View className="w-1/3 h-full bg-purple-500 rounded-full" />
                     <View className="absolute left-1/3 -ml-2 -top-1.5 w-4 h-4 bg-white rounded-full" />
                  </View>
                  <Text className="text-gray-400 font-bold text-xs">3.0x</Text>
               </View>
               <View className="flex-row items-center">
                 <MaterialCommunityIcons name="gesture-tap" size={16} color="#9CA3AF" />
                 <Text className="text-gray-400 text-sm ml-2">Drag to move the image</Text>
               </View>
            </View>
          )}

          <View className="mt-2">
            <TouchableOpacity 
                onPress={() => setActiveSheet('none')}
                className="h-14 bg-purple-600 rounded-full items-center justify-center shadow-lg overflow-hidden"
            >
                <LinearGradient 
                    colors={['#8B5CF6', '#D946EF']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 1 }} 
                    className="absolute inset-0" 
                />
                <Text className="text-white font-bold text-lg">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // --- RENDERING ---

  const renderSelection = () => (
    <View className="flex-1 bg-black">
      <View className="flex-row justify-center items-center py-4 bg-black">
        {['POST', 'STORY', 'REEL'].map((type) => (
          <TouchableOpacity key={type} onPress={() => setPostType(type.toLowerCase() as PostType)} className="mx-4">
            <Text className={`font-bold text-sm ${postType === type.toLowerCase() ? 'text-white' : 'text-zinc-600'}`}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-1 items-center justify-center" />
    </View>
  );

  const renderEdit = () => {
    const containerWidth = width * 0.8;
    const containerHeight = containerWidth / RATIOS[cropRatio];
    
    return (
      <View className="flex-1 bg-black">
          <View className="flex-1 justify-center">
              <FlatList
                  style={{ height: containerHeight, flexGrow: 0 }}
                  horizontal
                  data={originalMedia.map(item => ({ ...item, currentOffset: mediaOffsets[item.uri] }))}
                  extraData={{ mediaOffsets, cropRatio }}
                  keyExtractor={(item) => item.uri}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={containerWidth + 20}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingHorizontal: (width - (containerWidth + 20)) / 2 }}
                  onViewableItemsChanged={({ viewableItems }) => {
                      if (viewableItems.length > 0) {
                          setCurrentIndex(viewableItems[0].index || 0);
                      }
                  }}
                  viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                  renderItem={({ item }) => {
                      const offset = (item as any).currentOffset || { x: 0, y: 0, scale: 1 };
                      const imgWidth = item.width || containerWidth;
                      const imgHeight = item.height || containerHeight;
                      const imgAspectRatio = imgWidth / imgHeight;
                      const containerAspectRatio = containerWidth / containerHeight;
                      let baseWidth: number, baseHeight: number;
                      if (imgAspectRatio > containerAspectRatio) {
                        baseHeight = containerHeight;
                        baseWidth = containerHeight * imgAspectRatio;
                      } else {
                        baseWidth = containerWidth;
                        baseHeight = containerWidth / imgAspectRatio;
                      }

                      return (
                          <View style={{ width: containerWidth + 20 }} className="items-center justify-center">
                              <View style={{ width: containerWidth, height: containerHeight, overflow: 'hidden', borderRadius: 32, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ 
                                  width: baseWidth, 
                                  height: baseHeight, 
                                  justifyContent: 'center', 
                                  alignItems: 'center',
                                  transform: [
                                    { translateX: offset.x },
                                    { translateY: offset.y },
                                    { scale: offset.scale }
                                  ]
                                }}>
                                  <Image 
                                    key={`${item.uri}-${cropRatio}`}
                                    source={{ uri: item.uri }} 
                                    style={{ width: '100%', height: '100%' }} 
                                    contentFit="cover"
                                  />
                                </View>
                              </View>
                          </View>
                      )
                  }}
              />
          </View>

        {selectedSong && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, paddingHorizontal: 16 }}>
                {/* Music Info Container */}
                <View style={{ backgroundColor: '#52525B', borderRadius: 20, height: 56, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 12 }}>
                        <Image 
                          source={{ uri: selectedSong.coverUrl || 'https://i.pravatar.cc/150?u=music' }} 
                          style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#333' }}
                          contentFit="cover"
                        />
                        <View style={{ width: 130, marginLeft: 12 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }} numberOfLines={1}>
                                {selectedSong.title}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <View style={{ paddingHorizontal: 16, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialCommunityIcons name="waveform" size={24} color="white" />
                    </View>
                </View>

                {/* Mute Button Container */}
                <TouchableOpacity onPress={toggleMute} activeOpacity={0.8} style={{ marginLeft: 12 }}>
                    <View style={{ backgroundColor: '#52525B', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
                        <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={26} color="white" />
                    </View>
                </TouchableOpacity>
            </View>
        )}

        <View className="flex-row justify-center gap-x-3 mb-10 px-2">
            {[
                { label: 'Crop', icon: 'crop', action: () => handleCrop() },
                { label: 'Text', icon: 'format-text', action: () => showToast({ message: "Text editing coming soon", type: 'info' }) },
                { label: 'Music', icon: 'music-note', action: () => setActiveSheet('music') },
                { label: 'Overlay', icon: 'layers-outline', action: () => showToast({ message: "Overlays coming soon", type: 'info' }) },
            ].map((tool) => (
                <TouchableOpacity key={tool.label} onPress={tool.action} className="bg-zinc-800/60 px-3 py-4 rounded-3xl items-center flex-1 border border-white/5">
                    <MaterialCommunityIcons name={tool.icon as any} size={24} color="white" />
                    <Text className="text-white text-[11px] mt-2 font-bold">{tool.label}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <View className="px-6 pb-12">
            <TouchableOpacity onPress={handleNext} className="h-16 bg-purple-600 rounded-full items-center justify-center shadow-lg">
                <LinearGradient colors={['#8B5CF6', '#D946EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0 rounded-full" />
                <Text className="text-white font-bold text-lg">Next</Text>
            </TouchableOpacity>
        </View>
    </View>
    );
  };

  const renderFinalize = () => {
    const containerWidth = width - 24;
    const containerHeight = containerWidth / RATIOS[cropRatio];

    return (
      <View className="flex-1 bg-black">
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Large Carousel Preview */}
          <View className="mt-6 relative items-center">
            <View style={{ width: containerWidth, height: containerHeight }} className="bg-[#1C1C1E] rounded-[32px] overflow-hidden">
                <FlatList
                    key={`finalize-carousel-${selectedMedia.length}-${cropRatio}`}
                    horizontal
                    data={selectedMedia}
                    keyExtractor={(item, index) => `${item.uri}-${index}`}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={containerWidth}
                    decelerationRate="fast"
                    pagingEnabled
                    onViewableItemsChanged={({ viewableItems }) => {
                        if (viewableItems.length > 0) {
                            setCurrentIndex(viewableItems[0].index || 0);
                        }
                    }}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                    renderItem={({ item }) => (
                        <View style={{ width: containerWidth, height: containerHeight }}>
                            <Image 
                              source={{ uri: `${item.uri}?t=${Date.now()}` }} 
                              style={{ width: '100%', height: '100%' }} 
                              contentFit="cover" 
                              transition={0}
                              cachePolicy="none"
                            />
                        </View>
                    )}
                />
                
                {/* Multi-photo Icon (only for 2+ photos) */}
                {selectedMedia.length > 1 && (
                    <View className="absolute top-4 right-4 bg-black/60 p-2.5 rounded-2xl z-30 shadow-lg">
                        <Ionicons name="copy" size={20} color="white" />
                    </View>
                )}
            </View>

            {/* Carousel Indicator Dots */}
            {selectedMedia.length > 1 && (
                <View className="flex-row justify-center mt-4 gap-x-2">
                    {selectedMedia.map((_, i) => (
                        <View 
                            key={i} 
                            style={{ width: i === currentIndex ? 8 : 8, height: i === currentIndex ? 8 : 8 }}
                            className={`rounded-full ${i === currentIndex ? 'bg-purple-500' : 'bg-zinc-700'}`}
                        />
                    ))}
                </View>
            )}
          </View>

          {/* Caption Input */}
          <View className="mt-6">
              <TextInput 
                placeholder="Add caption" 
                placeholderTextColor="#52525b" 
                multiline 
                value={caption} 
                onChangeText={setCaption} 
                className="text-white text-base max-h-32 min-h-[40px] px-2" 
              />
          </View>

          {/* Post Options */}
          <View className="mt-10 space-y-2">
              <TouchableOpacity onPress={() => setActiveSheet('tags')} className="flex-row items-center justify-between py-5 border-b border-zinc-900/50">
                  <View className="flex-row items-center">
                      <Ionicons name="person-outline" size={22} color="white" />
                      <Text className="text-white ml-4 text-lg">Tag peoples</Text>
                      {selectedTags.length > 0 && <Text className="text-purple-400 ml-2 font-bold">({selectedTags.length})</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveSheet('location')} className="flex-row items-center justify-between py-5 border-b border-zinc-900/50">
                  <View className="flex-row items-center">
                      <Ionicons name="location-outline" size={22} color="white" />
                      <Text className="text-white ml-4 text-lg">{selectedLocation || 'Add location'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#52525b" />
              </TouchableOpacity>

              <View className="mt-10">
                  <Text className="text-zinc-500 font-bold mb-4 ml-1 text-sm uppercase tracking-wider">Audience</Text>
                  <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900/50">
                      <Text className="text-white text-lg">Followers</Text>
                      <View className="w-6 h-6 rounded-full border-2 border-purple-500 items-center justify-center">
                          <View className="w-3 h-3 rounded-full bg-purple-500" />
                      </View>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-row items-center justify-between py-5">
                      <Text className="text-white text-lg">Close groups</Text>
                      <View className="w-6 h-6 rounded-full border-2 border-zinc-700" />
                  </TouchableOpacity>
              </View>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View className="px-6 pb-12 flex-row gap-x-4 bg-black/80 pt-4">
            <TouchableOpacity onPress={() => handleBack()} className="flex-1 h-14 bg-zinc-900/80 rounded-3xl items-center justify-center border border-zinc-800">
                <Text className="text-white font-bold text-lg">Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} disabled={isUploading} className="flex-1 h-14 bg-purple-600 rounded-3xl items-center justify-center overflow-hidden shadow-lg">
                <LinearGradient colors={['#8B5CF6', '#D946EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0" />
                {isUploading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Share</Text>}
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
        {renderHeader()}
        {step === 'selection' && renderSelection()}
        {step === 'edit' && renderEdit()}
        {step === 'finalize' && renderFinalize()}
        {activeSheet === 'music' && renderMusicSheet()}
        {activeSheet === 'tags' && renderTagSheet()}
        {activeSheet === 'location' && renderLocationSheet()}
        {activeSheet === 'crop' && renderCropSheet()}
    </GestureHandlerRootView>
  );
};

export default CreatePostScreen;
