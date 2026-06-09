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
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/context/ToastContext';

const { width, height } = Dimensions.get('window');

type Step = 'selection' | 'edit' | 'finalize';
type PostType = 'post' | 'story' | 'reel';

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
  const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  
  // Post Data State
  const [caption, setCaption] = useState('');
  const [activeSheet, setActiveSheet] = useState<'none' | 'music' | 'tags' | 'location'>('none');
  
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
  const { showToast } = useToast();

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
      console.log("Mute toggle note:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: 20,
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedMedia(result.assets);
        setStep('edit');
      }
    } catch (error: any) {
      showToast({ message: "Failed to open gallery", type: 'error' });
    }
  };

  const handleNext = () => {
    if (step === 'selection') {
      if (selectedMedia.length === 0) {
        pickImage();
        return;
      }
      setStep('edit');
    } else if (step === 'edit') {
      setStep('finalize');
    }
  };

  const handleBack = () => {
    if (step === 'edit') {
      setStep('selection');
    } else if (step === 'finalize') {
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
      const formData = new FormData();
      for (const asset of selectedMedia) {
        const uri = asset.uri;
        const filename = uri.split('/').pop() || 'upload.jpg';
        const type = asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
        // @ts-ignore
        formData.append('media', { uri, name: filename, type } as any);
      }
      formData.append('caption', caption || '');
      formData.append('visibility', 'public');
      formData.append('isStory', postType === 'story' ? 'true' : 'false');
      formData.append('isPersistent', 'true');
      formData.append('type', postType === 'reel' ? 'reel' : 'post');
      if (selectedLocation) formData.append('locationLabel', selectedLocation);
      if (selectedSong) formData.append('musicId', selectedSong.id);

      await mediaService.createPost(formData);
      showToast({ message: "Post uploaded successfully!", type: 'success' });
      router.replace('/(tabs)');
    } catch (error: any) {
      showToast({ message: error.message || "Failed to upload", type: 'error' });
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
      <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="images-outline" size={100} color="#8B5CF6" />
          <Text className="text-white text-center text-2xl font-bold mt-6">Share your media</Text>
          <Text className="text-zinc-500 text-center mt-4 text-lg">Choose photos or videos from your gallery to create a new post.</Text>
          <TouchableOpacity onPress={pickImage} className="mt-12 bg-purple-600 px-12 py-5 rounded-full shadow-2xl">
              <Text className="text-white font-bold text-xl">Open Gallery</Text>
          </TouchableOpacity>
      </View>
    </View>
  );

  const renderEdit = () => (
    <View className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
            <FlatList
                horizontal
                data={selectedMedia}
                keyExtractor={(item) => item.uri}
                showsHorizontalScrollIndicator={false}
                snapToInterval={width * 0.8 + 20}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: width * 0.1 }}
                renderItem={({ item }) => (
                    <View style={{ width: width * 0.8, height: width * 1.0 }} className="mr-5">
                        <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%', borderRadius: 32 }} contentFit="cover" />
                    </View>
                )}
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

        <View className="flex-row justify-center gap-x-4 mb-10">
            {[
                { label: 'Text', icon: 'format-text', action: () => showToast({ message: "Text editing coming soon", type: 'info' }) },
                { label: 'Music', icon: 'music-note', action: () => setActiveSheet('music') },
                { label: 'Overlay', icon: 'layers-outline', action: () => showToast({ message: "Overlays coming soon", type: 'info' }) },
            ].map((tool) => (
                <TouchableOpacity key={tool.label} onPress={tool.action} className="bg-zinc-800/60 px-6 py-4 rounded-3xl items-center min-w-[100px] border border-white/5">
                    <MaterialCommunityIcons name={tool.icon as any} size={28} color="white" />
                    <Text className="text-white text-xs mt-2 font-bold">{tool.label}</Text>
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

  const renderFinalize = () => (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4">
        <View className="flex-row mt-6">
            <View className="w-[100px] h-[130px] bg-[#1C1C1E] rounded-3xl overflow-hidden border border-white/5">
                <Image source={{ uri: selectedMedia[0]?.uri }} className="w-full h-full" contentFit="cover" />
            </View>
            <View className="flex-1 ml-4 justify-start">
                <TextInput placeholder="Add caption" placeholderTextColor="#52525b" multiline value={caption} onChangeText={setCaption} className="text-white text-base max-h-32 mt-2" />
            </View>
        </View>
        <View className="mt-10 pt-6">
            <TouchableOpacity onPress={() => setActiveSheet('tags')} className="flex-row items-center justify-between py-6 border-b border-zinc-900">
                <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={24} color="white" />
                    <Text className="text-white ml-4 text-lg">Tag peoples</Text>
                    {selectedTags.length > 0 && <Text className="text-purple-400 ml-2 font-bold">({selectedTags.length})</Text>}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#52525b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSheet('location')} className="flex-row items-center justify-between py-6 border-b border-zinc-900">
                <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={24} color="white" />
                    <Text className="text-white ml-4 text-lg">{selectedLocation || 'Add location'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#52525b" />
            </TouchableOpacity>
            <View className="mt-10">
                <Text className="text-zinc-500 font-bold mb-4 ml-1">Audience</Text>
                <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900">
                    <Text className="text-white text-lg">Followers</Text>
                    <View className="w-6 h-6 rounded-full border-2 border-zinc-700 items-center justify-center">
                        <View className="w-3 h-3 rounded-full bg-blue-500" />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center justify-between py-5 border-b border-zinc-900">
                    <Text className="text-white text-lg">Close groups</Text>
                    <View className="w-6 h-6 rounded-full border-2 border-zinc-700" />
                </TouchableOpacity>
            </View>
        </View>
      </ScrollView>
      <View className="px-6 pb-12 flex-row gap-x-4">
          <TouchableOpacity onPress={() => router.back()} className="flex-1 h-14 bg-zinc-900 rounded-3xl items-center justify-center border border-zinc-800">
              <Text className="text-white font-bold text-lg">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUpload} disabled={isUploading} className="flex-1 h-14 bg-purple-600 rounded-3xl items-center justify-center overflow-hidden shadow-lg">
              <LinearGradient colors={['#8B5CF6', '#D946EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="absolute inset-0" />
              {isUploading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save</Text>}
          </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />
        {renderHeader()}
        {step === 'selection' && renderSelection()}
        {step === 'edit' && renderEdit()}
        {step === 'finalize' && renderFinalize()}
        {activeSheet === 'music' && renderMusicSheet()}
        {activeSheet === 'tags' && renderTagSheet()}
        {activeSheet === 'location' && renderLocationSheet()}
    </View>
  );
};

export default CreatePostScreen;
